import { NextResponse } from "next/server";

/**
 * Çıkış yapılırken admin_2fa_pending cookie'sini temizler.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set("admin_2fa_pending", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Hemen sil
  });

  return response;
}
