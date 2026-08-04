import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { verifyCookieValue } from "@/lib/cookie-signature";

/**
 * İstemci bileşenlerinin (Navbar vb.) 2FA doğrulama durumunu
 * kontrol etmesini sağlayan endpoint.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        isVerified: false,
        isPending: false,
        isLoggedIn: false,
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_2fa_enabled")
      .eq("id", user.id)
      .single();

    // Admin olmayan veya 2FA aktif olmayan kullanıcılar 2FA gerektirmez
    if (!profile || profile.role !== "admin" || !profile.is_2fa_enabled) {
      return NextResponse.json({
        isVerified: true,
        isPending: false,
        isLoggedIn: true,
      });
    }

    const cookieStore = await cookies();
    const hasPending = cookieStore.get("admin_2fa_pending")?.value === "true";
    const verifiedCookie = cookieStore.get("admin_2fa_verified")?.value;

    let isVerified = false;
    if (verifiedCookie) {
      isVerified = await verifyCookieValue(verifiedCookie, user.id);
    }

    return NextResponse.json({
      isVerified,
      isPending: hasPending || !isVerified,
      isLoggedIn: true,
    });
  } catch (error) {
    console.error("[Check2FA API] Hata:", error);
    return NextResponse.json(
      { isVerified: false, isPending: true, isLoggedIn: false },
      { status: 500 }
    );
  }
}
