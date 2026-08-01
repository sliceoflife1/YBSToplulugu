import Link from "next/link";
import { Search, Users, Star, GraduationCap, BookOpen, Building2, Globe, ArrowRight, UserCheck, Calendar } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Organization {
  id: string;
  name: string;
  type: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  approval_status: string;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; query?: string }>;
}) {
  const adminSupabase = createAdminClient();
  const params = await searchParams;
  const activeTab = params.tab || "students";
  const searchQuery = params.query || "";

  let filteredProfiles: Profile[] = [];
  let filteredOrgs: Organization[] = [];

  if (activeTab === "students") {
    // Tüm aktif kullanıcı ve öğrencileri çek (en yeniler en üstte, pasifler hariç)
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("*")
      .neq("is_active", false)
      .in("role", ["student", "alumni", "user", "admin", "moderator", "employer"])
      .order("karma_points", { ascending: false })
      .order("created_at", { ascending: false });

    filteredProfiles = profiles || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredProfiles = filteredProfiles.filter(
        (p) =>
          (p.first_name && p.first_name.toLowerCase().includes(q)) ||
          (p.last_name && p.last_name.toLowerCase().includes(q)) ||
          (p.department && p.department.toLowerCase().includes(q))
      );
    }
  } else if (activeTab === "academics") {
    // Aktif Akademisyenleri çek (pasifler hariç)
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("*")
      .neq("is_active", false)
      .eq("role", "faculty")
      .order("karma_points", { ascending: false })
      .order("created_at", { ascending: false });

    filteredProfiles = profiles || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredProfiles = filteredProfiles.filter(
        (p) =>
          (p.first_name && p.first_name.toLowerCase().includes(q)) ||
          (p.last_name && p.last_name.toLowerCase().includes(q)) ||
          (p.department && p.department.toLowerCase().includes(q))
      );
    }
  } else if (activeTab === "organizations") {
    // Onaylı Kurumları ve Aktif İşveren Profillerini çek
    const [orgsRes, employerProfilesRes] = await Promise.all([
      adminSupabase
        .from("organizations")
        .select("*")
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false }),
      adminSupabase
        .from("profiles")
        .select("*")
        .neq("is_active", false)
        .eq("role", "employer")
        .order("created_at", { ascending: false }),
    ]);

    filteredOrgs = orgsRes.data || [];
    const employerProfiles = employerProfilesRes.data || [];

    // İşveren profillerini de görüntülenecek profillere ekle
    filteredProfiles = employerProfiles;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredOrgs = filteredOrgs.filter(
        (o) =>
          (o.name && o.name.toLowerCase().includes(q)) ||
          (o.description && o.description.toLowerCase().includes(q))
      );
      filteredProfiles = filteredProfiles.filter(
        (p) =>
          (p.first_name && p.first_name.toLowerCase().includes(q)) ||
          (p.last_name && p.last_name.toLowerCase().includes(q)) ||
          (p.headline && p.headline.toLowerCase().includes(q)) ||
          (p.department && p.department.toLowerCase().includes(q))
      );
    }
  } else if (activeTab === "mentors") {
    // Aktif Mentörleri çek
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("*")
      .neq("is_active", false)
      .eq("is_mentor", true)
      .order("karma_points", { ascending: false })
      .order("created_at", { ascending: false });

    filteredProfiles = profiles || [];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredProfiles = filteredProfiles.filter(
        (p) =>
          (p.first_name && p.first_name.toLowerCase().includes(q)) ||
          (p.last_name && p.last_name.toLowerCase().includes(q)) ||
          (p.mentor_topics && p.mentor_topics.some((topic: string) => topic.toLowerCase().includes(q)))
      );
    }
  }

  const tabs = [
    { value: "students", label: "Öğrenciler & Üyeler", icon: GraduationCap },
    { value: "academics", label: "Akademisyenler", icon: BookOpen },
    { value: "organizations", label: "Kurumlar & İşverenler", icon: Building2 },
    { value: "mentors", label: "Mentörler", icon: UserCheck },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]/30">
      <Navbar />
      <main className="flex-1">
        {/* Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 py-12 text-white shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Keşfet
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-teal-100">
              DEÜ Topluluğundaki öğrencileri, akademisyenleri ve kayıtlı firmaları/dernekleri keşfedin.
            </p>
          </div>
        </div>

        {/* Tab ve Arama Bölümü */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-[var(--color-border)] pb-6">
            {/* Sekmeler */}
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.value;
                return (
                  <Link
                    key={tab.value}
                    href={`/explore?tab=${tab.value}${searchQuery ? `&query=${searchQuery}` : ""}`}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      isSelected
                        ? "gradient-primary text-white shadow-md shadow-indigo-500/10"
                        : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            {/* Arama Çubuğu */}
            <form method="GET" action="/explore" className="relative w-full max-w-xs shrink-0">
              <input type="hidden" name="tab" value={activeTab} />
              <input
                type="text"
                name="query"
                defaultValue={searchQuery}
                placeholder="Ara..."
                className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] py-2.5 pl-10 pr-4 text-xs focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--color-muted-foreground)]" />
            </form>
          </div>

          {/* Sonuç Alanı */}
          <div className="mt-8">
            {activeTab === "organizations" ? (
              // Kurum Listesi
              filteredOrgs.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredOrgs.map((org) => (
                    <div
                      key={org.id}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-lg"
                    >
                      <div>
                        {/* Logo & Başlık */}
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-muted)]/50 p-1.5 border border-[var(--color-border)]">
                            {org.logo_url ? (
                              <img
                                src={org.logo_url}
                                alt={org.name}
                                className="h-full w-full object-contain rounded-lg"
                              />
                            ) : (
                              <Building2 className="h-6 w-6 text-[var(--color-primary)]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-[var(--color-foreground)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                              {org.name}
                            </h3>
                            <span className="rounded bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)] uppercase">
                              {org.type === "employer" && "İşveren"}
                              {org.type === "foundation" && "Vakıf"}
                              {org.type === "association" && "Dernek"}
                              {org.type === "other" && "Diğer Kurum"}
                            </span>
                          </div>
                        </div>

                        {/* Açıklama */}
                        {org.description && (
                          <p className="mt-4 text-xs text-[var(--color-muted-foreground)] line-clamp-3 leading-relaxed whitespace-pre-wrap">
                            {org.description}
                          </p>
                        )}
                      </div>

                      {/* Alt Bağlantı */}
                      {org.website_url && (
                        <div className="mt-4 border-t border-[var(--color-border)]/50 pt-3 flex items-center justify-end">
                          <a
                            href={org.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] hover:underline"
                          >
                            Web Sitesini Ziyaret Et
                            <Globe className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Building2} label="Kayıtlı kurum bulunmuyor" />
              )
            ) : (
              // Profil Listesi (Öğrenci veya Akademisyen)
              filteredProfiles.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProfiles.map((p) => (
                    <Link
                      key={p.id}
                      href={`/u/${p.id}`}
                      className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-4">
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt={`${p.first_name} ${p.last_name}`}
                            className="h-12 w-12 rounded-xl object-cover border border-[var(--color-border)]"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-lg font-bold text-white shadow-sm shrink-0">
                            {(p.first_name || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                            {p.first_name} {p.last_name}
                          </h3>
                          <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                            {p.department || "Bölüm belirtilmemiş"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-[var(--color-muted-foreground)]">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-primary)]/10 px-2 py-0.5 font-bold text-[var(--color-primary)] uppercase">
                          {p.role === "student" && "Öğrenci"}
                          {p.role === "alumni" && "Mezun"}
                          {p.role === "faculty" && "Akademisyen"}
                          {p.role === "employer" && "İşveren"}
                          {p.role === "admin" && "Yönetici"}
                          {p.role === "moderator" && "Moderatör"}
                          {(!p.role || (p.role as string) === "user") && "Üye"}
                        </span>
                        {p.karma_points > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-amber-500">{p.karma_points}</span>
                          </span>
                        )}
                        {activeTab === "mentors" && p.meeting_url && (
                          <a
                            href={p.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2.5 py-1 font-semibold text-indigo-600 transition-colors hover:bg-indigo-500/20"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            Randevu Al
                          </a>
                        )}
                      </div>
                      
                      {activeTab === "mentors" && p.mentor_topics && p.mentor_topics.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--color-border)]/50 pt-3">
                          {p.mentor_topics.slice(0, 3).map((topic: string, i: number) => (
                            <span key={i} className="rounded-md bg-[var(--color-muted)] px-2 py-0.5 text-[9px] font-medium text-[var(--color-foreground)]">
                              {topic}
                            </span>
                          ))}
                          {p.mentor_topics.length > 3 && (
                            <span className="rounded-md bg-[var(--color-muted)] px-2 py-0.5 text-[9px] font-medium text-[var(--color-muted-foreground)]">
                              +{p.mentor_topics.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {p.bio && (
                        <p className="mt-3 text-xs text-[var(--color-muted-foreground)] line-clamp-2 leading-relaxed">
                          {p.bio}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Users} label="Kayıtlı üye bulunmuyor" />
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-16 text-center shadow-sm">
      <Icon className="mx-auto h-12 w-12 text-[var(--color-muted-foreground)] opacity-50" />
      <h3 className="mt-4 text-base font-bold text-[var(--color-foreground)]">
        Sonuç bulunamadı
      </h3>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        {label} veya arama kriterlerinizle eşleşen bir kayıt bulunmuyor.
      </p>
    </div>
  );
}
