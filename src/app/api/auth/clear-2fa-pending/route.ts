import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Çıkış yapılırken tüm 2FA ile ilgili cookie'leri temizler.
 * Auth kontrolü yaparak yetkisiz çağrıları engeller.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });

    const cookieDefaults = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0, // Hemen sil
    };

    // Tüm 2FA cookie'lerini temizle
    response.cookies.set("admin_2fa_pending", "", cookieDefaults);
    response.cookies.set("admin_2fa_verified", "", cookieDefaults);
    response.cookies.set("_2fa_checked", "", cookieDefaults);

    return response;
  } catch (error) {
    console.error("[Clear2FAPending] Hata:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
