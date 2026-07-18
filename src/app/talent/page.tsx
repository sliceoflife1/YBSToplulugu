import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, Briefcase, GraduationCap, Award, Mail, ExternalLink, ShieldCheck, Globe, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";

export const dynamic = "force-dynamic";

export default async function TalentHubPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; skill?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Kullanıcının erişim yetkisini kontrol et
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isSystemAdmin = profile?.role === "admin" || profile?.role === "moderator";

  let isApprovedEmployer = false;
  if (!isSystemAdmin) {
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, approval_status, type")
      .eq("owner_id", user.id)
      .eq("type", "employer")
      .eq("approval_status", "approved")
      .limit(1);

    if (orgs && orgs.length > 0) {
      isApprovedEmployer = true;
    }
  }

  const hasAccess = isSystemAdmin || isApprovedEmployer;

  if (!hasAccess) {
    redirect("/explore"); // Yetkisi yoksa explore sayfasına yönlendir
  }

  const params = await searchParams;
  const searchQuery = params.query || "";
  const filterSkill = params.skill || "";

  // 2. Yetenek Havuzu verilerini çek (is_cv_public = true)
  // cv_data ile join işlemi yapacağız
  const { data: talentProfiles } = await supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      avatar_url,
      department,
      class_year,
      bio,
      linkedin_url,
      github_url,
      cv_data (
        skills,
        experience,
        education
      )
    `)
    .eq("is_active", true)
    .eq("is_cv_public", true)
    .order("created_at", { ascending: false });

  let filteredTalents = talentProfiles || [];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredTalents = filteredTalents.filter((t) => {
      return (
        t.first_name.toLowerCase().includes(q) ||
        t.last_name.toLowerCase().includes(q) ||
        (t.department && t.department.toLowerCase().includes(q))
      );
    });
  }

  if (filterSkill) {
    const s = filterSkill.toLowerCase();
    filteredTalents = filteredTalents.filter((t) => {
      // @ts-ignore - cv_data array as it is a relation, but it's 1-to-1 so we take the first element
      const cvData = Array.isArray(t.cv_data) ? t.cv_data[0] : t.cv_data;
      if (!cvData || !cvData.skills) return false;
      return cvData.skills.some((skill: string) => skill.toLowerCase().includes(s));
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]/30">
      <Navbar />
      <main className="flex-1">
        {/* Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 py-12 text-white shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                <ShieldCheck className="h-4 w-4" />
                Özel Erişim
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Yetenek Havuzu
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-indigo-100">
              Yalnızca onaylı kurumsal iş ortaklarımıza ve yöneticilerimize açık olan öğrenci CV havuzu.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--color-border)] pb-6">
            <h2 className="text-lg font-bold text-[var(--color-foreground)] flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-500" />
              Açık Profiller ({filteredTalents.length})
            </h2>

            {/* Arama ve Filtreleme */}
            <form method="GET" action="/talent" className="flex w-full flex-col sm:flex-row gap-3 md:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  name="query"
                  defaultValue={searchQuery}
                  placeholder="İsim veya Bölüm ara..."
                  className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-muted-foreground)]" />
              </div>
              <div className="relative w-full sm:w-48">
                <input
                  type="text"
                  name="skill"
                  defaultValue={filterSkill}
                  placeholder="Yetenek ara (Örn: React)"
                  className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Award className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-muted-foreground)]" />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Filtrele
              </button>
            </form>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTalents.map((t) => {
              // @ts-ignore
              const cvData = Array.isArray(t.cv_data) ? t.cv_data[0] : t.cv_data;
              const skills = cvData?.skills || [];
              const exp = Array.isArray(cvData?.experience) ? cvData.experience : [];

              return (
                <div key={t.id} className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:border-indigo-500/30">
                  <div>
                    <div className="flex items-start gap-4">
                      {t.avatar_url ? (
                        <img
                          src={t.avatar_url}
                          alt={t.first_name}
                          className="h-14 w-14 shrink-0 rounded-full object-cover border border-[var(--color-border)]"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xl font-bold text-white shadow-sm">
                          {t.first_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <Link href={`/u/${t.id}`} className="font-bold text-base text-[var(--color-foreground)] hover:text-indigo-600 truncate block">
                          {t.first_name} {t.last_name}
                        </Link>
                        <p className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5 flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                          {t.department || "Bölüm Belirtilmemiş"}
                        </p>
                        {exp.length > 0 && (
                          <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-1.5 truncate">
                            {exp[0].title} @ {exp[0].company}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      {skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {skills.slice(0, 4).map((skill: string, i: number) => (
                            <span key={i} className="rounded-md bg-[var(--color-muted)] px-2 py-1 text-[10px] font-semibold text-[var(--color-foreground)] border border-[var(--color-border)]/50">
                              {skill}
                            </span>
                          ))}
                          {skills.length > 4 && (
                            <span className="rounded-md bg-[var(--color-muted)]/50 px-2 py-1 text-[10px] font-medium text-[var(--color-muted-foreground)] border border-[var(--color-border)]/30">
                              +{skills.length - 4}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--color-muted-foreground)] italic">
                          Yetenek bilgisi eklenmemiş.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-[var(--color-border)]/50 pt-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      {t.linkedin_url && (
                        <a href={t.linkedin_url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[#0077b5]/10 p-1.5 text-[#0077b5] hover:bg-[#0077b5]/20 transition-colors">
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                      {t.github_url && (
                        <a href={t.github_url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-gray-500/10 p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-500/20 transition-colors">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    <Link
                      href={`/u/${t.id}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group/link"
                    >
                      Profili İncele
                      <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTalents.length === 0 && (
            <div className="mt-8 rounded-2xl border border-[var(--color-border)] border-dashed bg-[var(--color-card)] py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-muted)] mb-3">
                <Search className="h-6 w-6 text-[var(--color-muted-foreground)]" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Kayıt Bulunamadı</h3>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">Arama kriterlerinize uygun açık profil bulunamadı.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
