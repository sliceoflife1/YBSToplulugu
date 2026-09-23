import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";
import { insertNotificationIdempotent } from "@/lib/notifications/idempotent-insert";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") || "signup") as EmailOtpType;
  const next = searchParams.get("next") ?? (type === "recovery" ? "/reset-password" : "/dashboard");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const targetBaseUrl = isLocalEnv
    ? origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : (process.env.NEXT_PUBLIC_SITE_URL || origin);

  if (!token_hash) {
    return NextResponse.redirect(`${targetBaseUrl}/login?error=auth`);
  }

  // PKCE tokenları (pkce_ ön ekli) Supabase'in kendi verify endpoint'i üzerinden doğrulanmalıdır.
  // Bu tokenlar verifyOtp() ile işlenemez — Supabase server-side PKCE exchange gerektirir.
  // Akış: /auth/confirm → Supabase /auth/v1/verify → /auth/callback?code=XXX → exchangeCodeForSession()
  if (token_hash.startsWith("pkce_")) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const callbackUrl = `${targetBaseUrl}/auth/callback`;
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(token_hash)}&type=${type}&redirect_to=${encodeURIComponent(callbackUrl)}`;
    return NextResponse.redirect(verifyUrl);
  }

  // Regular tokenlar (generateLink API'den gelen hashed_token) — doğrudan verifyOtp ile doğrula
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash,
    type,
  });

  if (error) {
    console.error("[auth/confirm] verifyOtp error:", error);
    const errorCode = error.code || "otp_expired";
    const errorDesc = encodeURIComponent(error.message || "Doğrulama bağlantısı geçersiz veya süresi dolmuş.");
    return NextResponse.redirect(
      `${targetBaseUrl}/?error=access_denied&error_code=${errorCode}&error_description=${errorDesc}`
    );
  }

  const user = data.user || data.session?.user;

  if (user) {
    const adminSupabase = createAdminClient();

    // 1. Şifre sıfırlama akışı ise doğrudan şifre belirleme sayfasına gönder
    if (type === "recovery") {
      logActivity({
        userId: user.id,
        actionType: "auth.password_reset_verified",
        actionCategory: "auth",
        entityType: "profile",
        entityId: user.id,
        status: "success",
        request,
      });
      return NextResponse.redirect(`${targetBaseUrl}/reset-password`);
    }

    // 2. Profil ve Rol kontrolü
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && (profile.role === "employer" || profile.role === "faculty")) {
      const roleTitle = profile.role === "employer" ? "İşveren" : "Akademisyen";
      const companyOrName = profile.first_name || user.user_metadata?.first_name || user.email;
      const nowStr = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });

      if (profile.role === "employer") {
        const { data: existingOrg } = await adminSupabase
          .from("organizations")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (!existingOrg) {
          await adminSupabase.from("organizations").insert({
            owner_id: user.id,
            name: companyOrName,
            type: user.user_metadata?.org_type || "employer",
            description: profile.bio || user.user_metadata?.bio || null,
            website_url: profile.website_url || user.user_metadata?.website || null,
            contact_email: user.email,
            contact_phone: profile.phone || user.user_metadata?.phone || null,
            approval_status: "pending",
            is_active: false,
          });
        }
      }

      await insertNotificationIdempotent(
        adminSupabase,
        {
          recipient_id: user.id,
          type: "system",
          title: "E-posta Adresiniz Doğrulandı",
          message: "E-posta adresiniz başarıyla doğrulandı. Hesabınız ve başvuru detaylarınız şu an yönetici onayındadır. Onaylandığında bilgilendirileceksiniz.",
          metadata: { link: "/dashboard", role: profile.role },
          dedup_key: `user_pending_confirmation:${user.id}`,
        },
        { column: "metadata->>link", value: "/dashboard" },
        "[auth/confirm:user]"
      );

      const { data: admins } = await adminSupabase
        .from("profiles")
        .select("id")
        .in("role", ["admin", "moderator"]);

      if (admins && admins.length > 0) {
        await Promise.all(
          admins.map((adminRecord) =>
            insertNotificationIdempotent(
              adminSupabase,
              {
                recipient_id: adminRecord.id,
                type: "system",
                title: `Yeni ${roleTitle} Kaydı (E-posta Doğrulandı): ${companyOrName}`,
                message: `${nowStr} tarihinde yeni bir ${roleTitle} e-posta adresini doğruladı ve onay bekliyor. Şirket/İsim: ${companyOrName}, E-posta: ${user.email}. İncelemek için tıklayın.`,
                metadata: {
                  link: `/admin/users?role=${profile.role}&status=pending`,
                  user_id: user.id,
                  role: profile.role,
                  email: user.email,
                },
                dedup_key: `admin_new_registration:${user.id}`,
              },
              { column: "metadata->>user_id", value: user.id },
              "[auth/confirm:admin]"
            )
          )
        );
      }
    }

    logActivity({
      userId: user.id,
      actionType: "auth.email_verified",
      actionCategory: "auth",
      entityType: "profile",
      entityId: user.id,
      status: "success",
      request,
    });
  }

  return NextResponse.redirect(`${targetBaseUrl}${next}`);
}
