import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import OpportunityDetailClient from "@/components/opportunities/opportunity-detail-client";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminSupabase = createAdminClient();
  const supabase = await createClient();

  // Fırsat detayını çek
  const { data: opp } = await adminSupabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .single();

  if (!opp) notFound();

  // Oturum açmış kullanıcı bilgisini al (aksiyon butonları için)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fırsatın görüntülenme sayısını 1 artır
  await adminSupabase
    .from("opportunities")
    .update({ views_count: (opp.views_count || 0) + 1 })
    .eq("id", id);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]/30">
      <Navbar />
      <main className="flex-1">
        <OpportunityDetailClient opportunity={opp} isLoggedIn={!!user} />
      </main>
    </div>
  );
}
