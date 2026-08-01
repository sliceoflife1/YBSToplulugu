import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/diagnostics/notifications
 *
 * Bildirim sisteminin canlı veritabanında GERÇEKTEN kurulu olup olmadığını
 * doğrulayan sağlık kontrolü. Sokratik denetimdeki 4. soruya doğrudan yanıt
 * verir: "Live Supabase veritabanında migration'lar uygulandı mı?"
 *
 * Yetkilendirme: normal (RLS'e tabi) oturum istemcisiyle çağıranın gerçekten
 * admin/moderator olduğu doğrulanır; sonuç yalnızca bu durumda, ayrıcalıklı
 * `admin_notification_healthcheck()` SQL fonksiyonu servis rolüyle
 * çağrılarak döndürülür (bkz. migrations/039).
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok." }, { status: 403 });
  }

  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase.rpc("admin_notification_healthcheck");

  if (error) {
    // Fonksiyonun kendisi yoksa (migrations/039 hiç uygulanmamışsa) bu da
    // anlamlı bir teşhis sonucudur.
    return NextResponse.json({
      healthcheck_function_exists: false,
      error: error.message,
      hint: "supabase/migrations/039_notifications_dedup_and_healthcheck.sql henüz uygulanmamış olabilir.",
    });
  }

  return NextResponse.json({ healthcheck_function_exists: true, ...data });
}
