import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTOTP } from "@/lib/totp";
import { signCookieValue } from "@/lib/cookie-signature";

/**
 * Admin 2FA TOTP doğrulaması yapar.
 * Başarılıysa:
 *   1. admin_2fa_pending cookie'sini temizler
 *   2. HMAC-imzalı admin_2fa_verified cookie'si set eder (pozitif sinyal)
 * Tüm doğrulama sunucu tarafında yapılır (güvenli).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string" || code.trim().length < 6) {
      return NextResponse.json(
        { error: "Lütfen geçerli bir doğrulama kodu giriniz" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Oturum zaman aşımına uğradı" },
        { status: 401 }
      );
    }

    // Kullanıcı profilini ve TOTP verilerini getir
    const { data: profile } = await supabase
      .from("profiles")
      .select("totp_secret, backup_codes, role, is_2fa_enabled")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin" || !profile.is_2fa_enabled) {
      return NextResponse.json(
        { error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }

    let isValid = false;
    let usedBackupCode = false;

    // 1. 6 haneli TOTP kod kontrolü
    if (cleanCode.length === 6 && profile.totp_secret) {
      isValid = verifyTOTP(profile.totp_secret, cleanCode);
    }

    // 2. Yedek kod kontrolü (8 haneli hex)
    if (
      !isValid &&
      profile.backup_codes &&
      Array.isArray(profile.backup_codes) &&
      profile.backup_codes.includes(cleanCode.toUpperCase())
    ) {
      isValid = true;
      usedBackupCode = true;

      // Kullanılan yedek kodu listeden çıkar
      const remainingCodes = profile.backup_codes.filter(
        (c: string) => c !== cleanCode.toUpperCase()
      );
      await supabase
        .from("profiles")
        .update({ backup_codes: remainingCodes })
        .eq("id", user.id);
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Geçersiz doğrulama kodu" },
        { status: 401 }
      );
    }

    // Doğrulama başarılı — HMAC-imzalı pozitif doğrulama cookie'si oluştur
    const signedValue = await signCookieValue(user.id);

    const response = NextResponse.json({
      success: true,
      usedBackupCode,
    });

    const cookieDefaults = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };

    // Pending cookie'yi sil
    response.cookies.set("admin_2fa_pending", "", {
      ...cookieDefaults,
      maxAge: 0,
    });

    // Pozitif doğrulama cookie'si set et (12 saat)
    response.cookies.set("admin_2fa_verified", signedValue, {
      ...cookieDefaults,
      maxAge: 43200, // 12 hours
    });

    // Önceki _2fa_checked cache cookie'sini temizle
    response.cookies.set("_2fa_checked", "", {
      ...cookieDefaults,
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("[Verify2FA] Hata:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
