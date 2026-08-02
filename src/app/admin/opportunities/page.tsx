import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import OpportunitiesClient from "./client";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminOpportunitiesPage() {
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

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  // Veritabanındaki tüm fırsatları çek
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Öğrenci Fırsatları Yönetimi</h1>
            <p className="mt-1 text-[var(--color-muted-foreground)]">
              Türkiye ve dünya çapındaki öğrenci indirimlerini, kupon kodlarını ve ISIC kart kampanyalarını ekleyin veya yönetin.
            </p>
          </div>

          <OpportunitiesClient initialOpportunities={opportunities || []} />
        </div>
      </main>
    </div>
  );
}
