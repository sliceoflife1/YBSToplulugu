import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { insertNotificationIdempotent } from "@/lib/notifications/idempotent-insert";

/**
 * POST /api/auth/notify-registration
 *
 * Yeni bir İşveren veya Akademisyen kaydı olduğunda yöneticilere (admin/moderator)
 * bildirim gönderir ve işverenler için "pending" durumunda bir organizasyon kaydı
 * oluşturur.
 *
 * ---------------------------------------------------------------------------
 * GÜVENLİK MODELİ (Socratic denetim sonrası eklendi)
 * ---------------------------------------------------------------------------
 * Bu uç nokta kayıt formundan (henüz oturum/e-posta doğrulaması olmayan bir
 * tarayıcıdan) çağrıldığı için klasik bir "Authorization: Bearer <session>"
 * kontrolü YAPILAMAZ — kullanıcının henüz gerçek bir oturumu olmayabilir.
 * Bunun yerine, servis rolü (RLS bypass) ile çalışan bu uç nokta aşağıdaki
 * çok katmanlı kısıtlamalarla korunur:
 *
 *   1) Sadece role IN ('employer','faculty') olan profiller işlenir.
 *   2) Sadece is_active = false (yani henüz onaylanmamış / gerçekten
 *      "pending") profiller işlenir. Zaten onaylanmış bir hesap için
 *      tekrar tekrar çağrılsa bile hiçbir şey yapılmaz.
 *   3) Sadece profili SON 20 DAKİKA içinde oluşturulmuş kullanıcılar için
 *      işlem yapılır (REGISTRATION_WINDOW_MS). Bu, eski/rastgele bir
 *      userId ile bu uç noktanın "replay" saldırısı gibi tekrar tekrar
 *      tetiklenmesini anlamsız hale getirir.
 *   4) Bildirim ekleme işlemi artık SELECT-then-INSERT değil, veritabanı
 *      seviyesinde UNIQUE INDEX (recipient_id, dedup_key) + "ON CONFLICT
 *      DO NOTHING" (bkz. migrations/039) ile ATOMİK olarak yapılır — bkz.
 *      `insertNotificationIdempotent`. Bu, istemci çağrısı + DB trigger'ı +
 *      /auth/callback aynı anda (race condition) çalışsa bile en fazla BİR
 *      bildirim oluşmasını garanti eder (migration uygulanmışsa).
 *   5) Tüm "işlem yapılmadı" durumları (profil yok, rol uygun değil, zaten
 *      aktif, çok eski) DIŞARIYA AYNI JSON gövdesiyle döner
 *      (`{ success: true, skipped: true }`) — böylece bu uç nokta hangi
 *      userId'lerin var/geçerli/pending olduğunu ayırt etmeye yarayan bir
 *      "oracle" olarak kötüye kullanılamaz.
 *   6) Servis rolü anahtarı (service_role) sadece sunucu tarafında,
 *      ortam değişkeninden okunur; istemciye asla gönderilmez.
 *
 * Not: Bu uç nokta, veritabanı tetikleyicilerinin (migrations/019, 022)
 * dağıtılmamış olma ihtimaline karşı bir GÜVENLİK AĞIDIR; birincil ve en
 * güvenilir yol hâlâ `profiles` tablosuna INSERT anında tetiklenen DB
 * trigger'ıdır (tarayıcıdan bağımsız çalışır). `/admin/notifications-health`
 * sayfası bu trigger'ların gerçekten kurulu olup olmadığını kontrol eder.
 */

const REGISTRATION_WINDOW_MS = 20 * 60 * 1000; // 20 dakika

// Her "işlem yapılmadı" durumunda dönülecek, bilgi sızdırmayan tek tip yanıt
function skippedResponse() {
  return NextResponse.json({ success: true, skipped: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const userId = body?.userId;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId gerekli" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("[notify-registration] profile fetch error:", profileError);
      return NextResponse.json({ error: "Profil sorgulanamadı" }, { status: 500 });
    }

    // 1) Profil yok, 2) rol uygun değil, 3) zaten onaylanmış (is_active),
    // 4) çok eski bir kayıt -> hepsi için AYNI sessiz yanıt (bilgi sızdırma yok)
    if (!profile || !["employer", "faculty"].includes(profile.role)) {
      return skippedResponse();
    }

    if (profile.is_active) {
      return skippedResponse();
    }

    const createdAtMs = profile.created_at ? new Date(profile.created_at).getTime() : 0;
    if (!createdAtMs || Date.now() - createdAtMs > REGISTRATION_WINDOW_MS) {
      return skippedResponse();
    }

    const roleTitle = profile.role === "employer" ? "İşveren" : "Akademisyen";
    const companyOrName = profile.first_name || profile.edu_email;
    const nowStr = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });

    // 2. İşveren ise "pending" durumunda organizasyon kaydı oluştur (yoksa)
    if (profile.role === "employer") {
      const { data: existingOrg, error: existingOrgError } = await adminSupabase
        .from("organizations")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle();

      if (existingOrgError) {
        console.error("[notify-registration] existing org check error:", existingOrgError);
      }

      if (!existingOrg) {
        const { error: orgError } = await adminSupabase.from("organizations").insert({
          owner_id: userId,
          name: companyOrName,
          type: "employer",
          description: profile.bio || null,
          website_url: profile.website_url || null,
          contact_email: profile.edu_email,
          contact_phone: profile.phone || null,
          approval_status: "pending",
          is_active: false,
        });

        // 23505 = unique_violation: migrations/039 owner_id için UNIQUE INDEX
        // eklediyse ve DB trigger'ı bizden önce aynı satırı oluşturduysa
        // burası normalde devreye girer; gerçek bir hata değildir.
        if (orgError && orgError.code !== "23505") {
          console.error("[notify-registration] organizations insert error:", orgError);
        }
      }
    }

    // 3. Kullanıcının kendisine bilgilendirme bildirimi (atomik + yedekli)
    await insertNotificationIdempotent(
      adminSupabase,
      {
        recipient_id: userId,
        type: "system",
        title: "Başvurunuz Alındı",
        message: "Kaydınız alındı. Hesabınız ve başvuru detaylarınız şu an yönetici onayındadır. Onaylandığında bilgilendirileceksiniz.",
        metadata: { link: "/dashboard", role: profile.role },
        dedup_key: `user_pending_confirmation:${userId}`,
      },
      { column: "metadata->>link", value: "/dashboard" },
      "[notify-registration:user]"
    );

    // 4. Tüm admin ve moderatörlere bildirim gönder (atomik + yedekli)
    const { data: admins, error: adminsError } = await adminSupabase
      .from("profiles")
      .select("id")
      .in("role", ["admin", "moderator"]);

    if (adminsError) {
      console.error("[notify-registration] admins fetch error:", adminsError);
    }

    if (admins && admins.length > 0) {
      await Promise.all(
        admins.map((adminRecord) =>
          insertNotificationIdempotent(
            adminSupabase,
            {
              recipient_id: adminRecord.id,
              type: "system",
              title: `Yeni ${roleTitle} Başvurusu: ${companyOrName}`,
              message: `${nowStr} tarihinde yeni bir ${roleTitle} kaydı oluşturuldu ve onay bekliyor. Ad/Şirket: ${companyOrName}, E-posta: ${profile.edu_email}. İncelemek için tıklayın.`,
              metadata: {
                link: `/admin/users?role=${profile.role}&status=pending`,
                user_id: userId,
                role: profile.role,
                email: profile.edu_email,
              },
              dedup_key: `admin_new_registration:${userId}`,
            },
            { column: "metadata->>user_id", value: userId },
            "[notify-registration:admin]"
          )
        )
      );
    } else {
      console.warn("[notify-registration] Bildirim gönderilecek admin/moderator bulunamadı.");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[notify-registration] Unexpected error:", err);
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu" }, { status: 500 });
  }
}
