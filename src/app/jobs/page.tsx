import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import JobsClient from "./jobs-client";
import type { JobListing } from "@/types/database";
import { SAMPLE_JOB_LISTINGS } from "@/constants/sample-jobs";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const supabase = await createClient();

  // Kullanıcı bilgisini çek (opsiyonel - giriş yapmamış da olabilir)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: string | null = null;
  let hasApprovedOrg = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profile?.role || null;

    // İşveren ise onaylı organizasyonu var mı kontrol et
    if (userRole === "employer") {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", user.id)
        .eq("approval_status", "approved")
        .maybeSingle();
      hasApprovedOrg = !!org;
    }
  }

  // Aktif iş ilanlarını çek
  const { data: listings } = await supabase
    .from("job_listings")
    .select("*, profiles!employer_id(first_name, last_name, avatar_url), organizations(name, logo_url, website_url)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const activeListings: JobListing[] = (listings && listings.length > 0)
    ? (listings as JobListing[])
    : SAMPLE_JOB_LISTINGS;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <JobsClient
          listings={activeListings}
          userRole={userRole}
          hasApprovedOrg={hasApprovedOrg}
          isLoggedIn={!!user}
        />
      </main>
    </div>
  );
}
