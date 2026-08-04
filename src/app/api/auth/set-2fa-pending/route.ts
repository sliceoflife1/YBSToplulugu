import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin giriş yaptıktan sonra 2FA doğrulaması beklerken
 * admin_2fa_pending cookie'sini set eder.
 * Ayrıca önceki doğrulama cookie'lerini temizler (yeni login = yeni 2FA).
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

    // Kullanıcının gerçekten admin olduğunu ve 2FA'nın aktif olduğunu doğrula
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_2fa_enabled")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin" || !profile.is_2fa_enabled) {
      return NextResponse.json(
        { error: "Bu işlem sadece 2FA aktif admin kullanıcılar içindir" },
        { status: 403 }
      );
    }

    const response = NextResponse.json({ success: true });

    const cookieDefaults = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    // httpOnly cookie: client-side JS erişemez, sadece middleware kontrol eder
    // Session cookie - tarayıcı kapanınca silinir (maxAge yok)
    response.cookies.set("admin_2fa_pending", "true", cookieDefaults);

    // Önceki doğrulama cookie'lerini temizle (yeni login = yeni 2FA gerekli)
    response.cookies.set("admin_2fa_verified", "", {
      ...cookieDefaults,
      maxAge: 0,
    });

    response.cookies.set("_2fa_checked", "", {
      ...cookieDefaults,
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("[Set2FAPending] Hata:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
