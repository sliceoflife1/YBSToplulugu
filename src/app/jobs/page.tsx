import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import JobsClient from "./jobs-client";
import type { JobListing } from "@/types/database";

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

  // Eğer veritabanında henüz ilan yoksa test ve önizleme için örnek ilanlar sun
  const sampleListings: JobListing[] = (!listings || listings.length === 0) ? [
    {
      id: "sample-1",
      employer_id: user?.id || "demo-emp-1",
      organization_id: "demo-org-1",
      title: "Full Stack Developer (Next.js & Node.js)",
      description: "YBS ve Bilgisayar Mühendisliği öğrencileri/mezunları için modern web geliştirme pozisyonu. Next.js, Tailwind CSS ve PostgreSQL teknolojileri kullanılmaktadır.",
      category: "software_it",
      employment_type: "full_time",
      work_mode: "hybrid",
      location: "İzmir / Hibrit",
      requirements: ["Next.js ve React deneyimi", "TypeScript hakimiyeti", "SQL bilgisi", "Analitik düşünme"],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      application_count: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organizations: {
        id: "demo-org-1",
        name: "DEÜ Teknoloji A.Ş.",
        type: "employer",
        description: "Yazılım ve Teknoloji Geliştirme Merkezi",
        website_url: "https://www.deu.edu.tr",
        contact_email: "info@teknodeu.com",
        contact_phone: null,
        logo_url: null,
        owner_id: null,
        approval_status: "approved",
        approved_by: null,
        approved_at: null,
        rejection_reason: null,
        is_active: true,
        created_at: new Date().toISOString()
      }
    },
    {
      id: "sample-2",
      employer_id: user?.id || "demo-emp-2",
      organization_id: "demo-org-2",
      title: "Yapay Zeka & Veri Analisti Stajyeri",
      description: "Python, Pandas ve Scikit-learn ile veri analizi ve makine öğrenmesi modelleri geliştirme staj programı.",
      category: "data_science",
      employment_type: "internship",
      work_mode: "remote",
      location: "Uzaktan",
      requirements: ["Python ve SQL bilgisi", "İstatistik ve veri analizi merakı", "Öğrenmeye açık"],
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      application_count: 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organizations: {
        id: "demo-org-2",
        name: "DataTech Analytics",
        type: "employer",
        description: "Veri Bilimi ve Yapay Zeka Çözümleri",
        website_url: "https://example.com",
        contact_email: "hr@datatech.com",
        contact_phone: null,
        logo_url: null,
        owner_id: null,
        approval_status: "approved",
        approved_by: null,
        approved_at: null,
        rejection_reason: null,
        is_active: true,
        created_at: new Date().toISOString()
      }
    },
    {
      id: "sample-3",
      employer_id: user?.id || "demo-emp-3",
      organization_id: "demo-org-3",
      title: "Dijital Pazarlama & Sosyal Medya Yarı Zamanlı Uzmanı",
      description: "Sosyal medya yönetimi, Google Ads ve dijital içerik stratejileri oluşturacak yarı zamanlı çalışma arkadaşı.",
      category: "marketing",
      employment_type: "part_time",
      work_mode: "onsite",
      location: "Alsancak, İzmir",
      requirements: ["Meta & Google Ads deneyimi", "İçerik üretimi", "Haftada 2-3 gün katılım"],
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      application_count: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organizations: {
        id: "demo-org-3",
        name: "Kreatif Dijital Ajans",
        type: "employer",
        description: "Dijital Medya ve Pazarlama Ajansı",
        website_url: "https://example.com",
        contact_email: "ik@kreatifajans.com",
        contact_phone: null,
        logo_url: null,
        owner_id: null,
        approval_status: "approved",
        approved_by: null,
        approved_at: null,
        rejection_reason: null,
        is_active: true,
        created_at: new Date().toISOString()
      }
    },
    {
      id: "sample-4",
      employer_id: user?.id || "demo-emp-4",
      organization_id: "demo-org-4",
      title: "UI/UX Tasarım Stajyeri",
      description: "Figma ve prototipleme araçları ile kullanıcı dostu mobil ve web arayüzleri tasarlayacak stajyer.",
      category: "design",
      employment_type: "internship",
      work_mode: "remote",
      location: "Uzaktan",
      requirements: ["Figma hakimiyeti", "Tasarım portfolyosu", "UI/UX prensipleri bilgisi"],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
      application_count: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organizations: {
        id: "demo-org-4",
        name: "DesignHub Studio",
        type: "employer",
        description: "Kullanıcı Deneyimi ve Arayüz Tasarım Stüdyosu",
        website_url: "https://example.com",
        contact_email: "hello@designhub.com",
        contact_phone: null,
        logo_url: null,
        owner_id: null,
        approval_status: "approved",
        approved_by: null,
        approved_at: null,
        rejection_reason: null,
        is_active: true,
        created_at: new Date().toISOString()
      }
    }
  ] : (listings as JobListing[]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <JobsClient
          listings={sampleListings}
          userRole={userRole}
          hasApprovedOrg={hasApprovedOrg}
          isLoggedIn={!!user}
        />
      </main>
    </div>
  );
}
