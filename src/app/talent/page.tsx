import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, Briefcase, GraduationCap, Award, ExternalLink, ShieldCheck, Globe, ArrowRight, Download, Sparkles, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import { DEU_FACULTIES } from "@/constants/deu-departments";
import { formatClassYear, CLASS_YEAR_OPTIONS } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface TalentSearchParams {
  query?: string;
  skill?: string;
  department?: string;
  classYear?: string;
  location?: string;
  openToWork?: string;
  mentor?: string;
}

export default async function TalentHubPage({
  searchParams,
}: {
  searchParams: Promise<TalentSearchParams>;
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
  const filterDepartment = params.department || "";
  const filterClassYear = params.classYear || "";
  const filterLocation = params.location || "";
  const filterOpenToWork = params.openToWork === "1";
  const filterMentor = params.mentor === "1";

  // 2. Yetenek Havuzu verilerini çek (is_cv_public = true)
  // Kolon bazlı filtreler (bölüm, sınıf, konum, iş arama durumu, mentörlük)
  // doğrudan veritabanı sorgusunda uygulanır; metin/yetenek arama işlemleri
  // cv_data ile join edilen jsonb alanları için bellek üzerinde yapılır.
  let queryBuilder = supabase
    .from("profiles")
    .select(`
      id,
      first_name,
      last_name,
      avatar_url,
      department,
      class_year,
      headline,
      location,
      is_open_to_work,
      is_mentor,
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
    .eq("is_cv_public", true);

  if (filterDepartment) queryBuilder = queryBuilder.eq("department", filterDepartment);
  if (filterClassYear) queryBuilder = queryBuilder.eq("class_year", Number(filterClassYear));
  if (filterLocation) queryBuilder = queryBuilder.ilike("location", `%${filterLocation}%`);
  if (filterOpenToWork) queryBuilder = queryBuilder.eq("is_open_to_work", true);
  if (filterMentor) queryBuilder = queryBuilder.eq("is_mentor", true);

  const { data: talentProfiles } = await queryBuilder.order("created_at", { ascending: false });

  let filteredTalents = talentProfiles || [];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredTalents = filteredTalents.filter((t) => {
      // cv_data ilişkisi 1-1 olduğu için dizi olarak gelse de ilk eleman kullanılır
      const cvData = (Array.isArray(t.cv_data) ? t.cv_data[0] : t.cv_data) as { experience?: unknown } | null;
      const exp = Array.isArray(cvData?.experience) ? (cvData.experience as Record<string, string>[]) : [];
      const expText = exp.map((e) => `${e.title || e.position || ""} ${e.company || ""}`).join(" ").toLowerCase();
      return (
        t.first_name.toLowerCase().includes(q) ||
        t.last_name.toLowerCase().includes(q) ||
        (t.department && t.department.toLowerCase().includes(q)) ||
        (t.headline && t.headline.toLowerCase().includes(q)) ||
        (t.bio && t.bio.toLowerCase().includes(q)) ||
        expText.includes(q)
      );
    });
  }

  if (filterSkill) {
    const s = filterSkill.toLowerCase();
    filteredTalents = filteredTalents.filter((t) => {
      // cv_data ilişkisi 1-1 olduğu için dizi olarak gelse de ilk eleman kullanılır
      const cvData = (Array.isArray(t.cv_data) ? t.cv_data[0] : t.cv_data) as { skills?: string[] } | null;
      if (!cvData || !cvData.skills) return false;
      return cvData.skills.some((skill: string) => skill.toLowerCase().includes(s));
    });
  }

  // Filtre panelinde göstermek için mevcut bölümleri elde et
  const departmentOptions = Array.from(
    new Set(DEU_FACULTIES.flatMap((f) => f.departments.map((d) => d.name)))
  ).sort();

  const buildQueryString = (overrides: Partial<TalentSearchParams> = {}) => {
    const merged: TalentSearchParams = {
      query: searchQuery,
      skill: filterSkill,
      department: filterDepartment,
      classYear: filterClassYear,
      location: filterLocation,
      openToWork: filterOpenToWork ? "1" : "",
      mentor: filterMentor ? "1" : "",
      ...overrides,
    };
    const qs = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (value) qs.set(key, String(value));
    });
    return qs.toString();
  };

  const activeFilterCount = [filterDepartment, filterClassYear, filterLocation, filterOpenToWork, filterMentor].filter(Boolean).length;

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
          <div className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-bold text-[var(--color-foreground)] flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-500" />
                Açık Profiller ({filteredTalents.length})
              </h2>

              {/* Arama */}
              <form method="GET" action="/talent" className="flex w-full flex-col sm:flex-row gap-3 md:w-auto">
                <input type="hidden" name="department" value={filterDepartment} />
                <input type="hidden" name="classYear" value={filterClassYear} />
                <input type="hidden" name="location" value={filterLocation} />
                <input type="hidden" name="openToWork" value={filterOpenToWork ? "1" : ""} />
                <input type="hidden" name="mentor" value={filterMentor ? "1" : ""} />
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    name="query"
                    defaultValue={searchQuery}
                    placeholder="İsim, unvan, bölüm veya deneyim ara..."
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

            {/* Gelişmiş Filtreler */}
            <form method="GET" action="/talent" className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <input type="hidden" name="query" value={searchQuery} />
              <input type="hidden" name="skill" value={filterSkill} />
              <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                <Filter className="h-3.5 w-3.5" /> Gelişmiş Filtreler {activeFilterCount > 0 && <span className="rounded-full bg-indigo-500/10 text-indigo-600 px-2 py-0.5">{activeFilterCount} aktif</span>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <select name="department" defaultValue={filterDepartment} className="rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="">Tüm Bölümler</option>
                  {departmentOptions.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>

                <select name="classYear" defaultValue={filterClassYear} className="rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="">Tüm Sınıflar</option>
                  {CLASS_YEAR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.labelTr}</option>
                  ))}
                </select>

                <input
                  type="text"
                  name="location"
                  defaultValue={filterLocation}
                  placeholder="Konum (Örn: İzmir)"
                  className="rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />

                <label className="flex items-center gap-2 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm cursor-pointer">
                  <input type="checkbox" name="openToWork" value="1" defaultChecked={filterOpenToWork} className="accent-indigo-600" />
                  İş Arıyor
                </label>

                <label className="flex items-center gap-2 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2 text-sm cursor-pointer">
                  <input type="checkbox" name="mentor" value="1" defaultChecked={filterMentor} className="accent-indigo-600" />
                  Mentör
                </label>
              </div>
              <div className="mt-3 flex gap-2">
                <button type="submit" className="rounded-xl bg-[var(--color-foreground)] px-4 py-2 text-xs font-semibold text-[var(--color-background)] hover:opacity-90 transition-opacity">
                  Filtreleri Uygula
                </button>
                {activeFilterCount > 0 && (
                  <Link href={`/talent?${buildQueryString({ department: "", classYear: "", location: "", openToWork: "", mentor: "" })}`} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors">
                    Filtreleri Temizle
                  </Link>
                )}
              </div>
            </form>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTalents.map((t) => {
              // cv_data ilişkisi 1-1 olduğu için dizi olarak gelse de ilk eleman kullanılır
              const cvData = (Array.isArray(t.cv_data) ? t.cv_data[0] : t.cv_data) as { skills?: string[]; experience?: unknown } | null;
              const skills = cvData?.skills || [];
              const exp = Array.isArray(cvData?.experience) ? (cvData.experience as Record<string, string>[]) : [];
              const latestExp = exp[0];

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
                        <div className="flex items-center gap-1.5">
                          <Link href={`/u/${t.id}`} className="font-bold text-base text-[var(--color-foreground)] hover:text-indigo-600 truncate">
                            {t.first_name} {t.last_name}
                          </Link>
                          {t.is_open_to_work && (
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
                              <Sparkles className="h-2.5 w-2.5" /> İŞ ARIYOR
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 truncate mt-0.5">
                          {t.headline || (latestExp && `${latestExp.title || latestExp.position} @ ${latestExp.company}`)}
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5 flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                          {t.department || "Bölüm Belirtilmemiş"}
                        </p>
                        {t.location && (
                          <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1 truncate flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" /> {t.location}
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
                      <a href={`/api/cv/pdf?userId=${t.id}`} className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-600 hover:bg-indigo-500/20 transition-colors" title="CV'yi PDF olarak indir">
                        <Download className="h-4 w-4" />
                      </a>
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
