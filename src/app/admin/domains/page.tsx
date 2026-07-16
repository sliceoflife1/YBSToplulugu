import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import DomainsClient from "./client";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminDomainsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  // Sadece adminler domainleri yönetebilir
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch all domains
  const { data: domains } = await supabase
    .from("allowed_email_domains")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">E-posta Domainleri</h1>
            <p className="mt-1 text-[var(--color-muted-foreground)]">
              Kayıt olabilecek üniversite domainlerini yönetin.
            </p>
          </div>

          <DomainsClient initialDomains={domains || []} />
        </div>
      </main>
    </div>
  );
}
