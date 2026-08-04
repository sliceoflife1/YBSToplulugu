import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { verifyCookieValue } from "@/lib/cookie-signature";
import type { Profile } from "@/types/database";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_2fa_enabled")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  // Defense in depth: middleware bypass edilse bile 2FA kontrolü yap
  if (profile.is_2fa_enabled) {
    const cookieStore = await cookies();
    const verifiedCookie = cookieStore.get("admin_2fa_verified")?.value;

    if (!verifiedCookie || !(await verifyCookieValue(verifiedCookie, user.id))) {
      redirect("/auth/2fa-challenge");
    }
  }

  return <>{children}</>;
}
