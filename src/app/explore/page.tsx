import Link from "next/link";
import {
  Search,
  Users,
  Star,
  GraduationCap,
  BookOpen,
  Building2,
  Globe,
  UserCheck,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 20;

interface Organization {
  id: string;
  name: string;
  type: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  approval_status: string;
}

/**
 * Hiyerarşik Öncelik Puanı Hesaplama:
 * 1. Yönetici (admin) -> 10
 * 2. Moderatör (moderator) -> 20
 * 3. Ünvanlı Akademisyenler (Prof. Dr. > Doç. Dr. > Dr. Öğr. Üyesi > Öğr. Gör. / Arş. Gör.) -> 30-60
 * 4. Diğer Akademisyenler (faculty) -> 70
 * 5. Mezunlar (alumni) -> 80
 * 6. Öğrenciler (student) -> 90
 * 7. İşverenler (employer) -> 100
 * 8. Diğer (user) -> 110
 */
function getProfileRank(p: Profile): number {
  if (p.role === "admin") return 10;
  if (p.role === "moderator") return 20;

  const headline = (p.headline || "").toLowerCase();
  const bio = (p.bio || "").toLowerCase();
  const department = (p.department || "").toLowerCase();
  const text = `${headline} ${bio} ${department}`;

  if (
    p.role === "faculty" ||
    text.includes("prof") ||
    text.includes("doç") ||
    text.includes("öğr. üyesi") ||
    text.includes("öğr. gör") ||
    text.includes("arş. gör")
  ) {
    if (
      text.includes("prof. dr.") ||
      text.includes("prof.dr") ||
      text.includes("profesor") ||
      text.includes("profesör")
    )
      return 30;
    if (
      text.includes("doç. dr.") ||
      text.includes("doç.dr") ||
      text.includes("doc. dr") ||
      text.includes("doçent")
    )
      return 40;
    if (
      text.includes("dr. öğretim üyesi") ||
      text.includes("dr. öğr. üyesi") ||
      text.includes("dr. ogr. uyesi") ||
      text.includes("yardımcı doçent")
    )
      return 50;
    if (
      text.includes("öğr. gör") ||
      text.includes("öğretim görevlisi") ||
      text.includes("arş. gör") ||
      text.includes("araştırma görevlisi") ||
      text.includes("dr.")
    )
      return 60;
    if (p.role === "faculty") return 70;
  }

  if (p.role === "alumni") return 80;
  if (p.role === "student") return 90;
  if (p.role === "employer") return 100;
  return 110;
}

/**
 * Hiyerarşik Sıralama:
 * 1. Öncelik Sıralaması (getProfileRank)
 * 2. Karma Puanı (Azalan - En yüksek puan önce gelir)
 * 3. Alfabetik İsim & Soyisim (Artan - A'dan Z'ye)
 */
function sortProfilesHierarchically(profiles: Profile[]): Profile[] {
  return [...profiles].sort((a, b) => {
    const rankA = getProfileRank(a);
    const rankB = getProfileRank(b);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    const karmaA = a.karma_points || 0;
    const karmaB = b.karma_points || 0;
    if (karmaA !== karmaB) {
      return karmaB - karmaA;
    }

    const nameA = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
    const nameB = `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase();
    return nameA.localeCompare(nameB, "tr");
  });
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    query?: string;
    role?: string;
    title?: string;
    isMentor?: string;
    sortBy?: string;
    page?: string;
  }>;
}) {
  const adminSupabase = createAdminClient();
  const params = await searchParams;

  const activeTab = params.tab || "students";
  const searchQuery = (params.query || "").trim();
  const roleFilter = params.role || "all";
  const titleFilter = params.title || "all";
  const isMentorFilter = params.isMentor === "true";
  const sortBy = params.sortBy || "hierarchy";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));

  let filteredProfiles: Profile[] = [];
  let filteredOrgs: Organization[] = [];

  if (activeTab === "organizations") {
    // Kurumlar & İşverenler sekmesi
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
    let employerProfiles = employerProfilesRes.data || [];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredOrgs = filteredOrgs.filter(
        (o) =>
          (o.name && o.name.toLowerCase().includes(q)) ||
          (o.description && o.description.toLowerCase().includes(q))
      );
      employerProfiles = employerProfiles.filter(
        (p) =>
          (p.first_name && p.first_name.toLowerCase().includes(q)) ||
          (p.last_name && p.last_name.toLowerCase().includes(q)) ||
          (p.headline && p.headline.toLowerCase().includes(q)) ||
          (p.department && p.department.toLowerCase().includes(q))
      );
    }
    filteredProfiles = employerProfiles;
  } else {
    // Diğer Kullanıcı Sekmeleri (Öğrenciler, Akademisyenler, Mentörler)
    let queryBuilder = adminSupabase.from("profiles").select("*").neq("is_active", false);

    if (activeTab === "academics") {
      queryBuilder = queryBuilder.eq("role", "faculty");
    } else if (activeTab === "mentors") {
      queryBuilder = queryBuilder.eq("is_mentor", true);
    } else {
      // "students" varsayılan sekmesi
      queryBuilder = queryBuilder.in("role", [
        "student",
        "alumni",
        "user",
        "admin",
        "moderator",
      ]);
    }

    const { data: rawProfiles } = await queryBuilder;
    let profilesList = rawProfiles || [];

    // --- KAPSAMLI VERİTABANI/İSTEMCİ SÜZGEÇLERİ (Global Filters) ---

    // 1. Arama Metni (Ad, Soyad, Bölüm, Headline, Bio, Mentörlük Konuları)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      profilesList = profilesList.filter((p) => {
        const fullName = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase();
        const dept = (p.department || "").toLowerCase();
        const hl = (p.headline || "").toLowerCase();
        const bio = (p.bio || "").toLowerCase();
        const topics = (p.mentor_topics || []).join(" ").toLowerCase();
        return (
          fullName.includes(q) ||
          dept.includes(q) ||
          hl.includes(q) ||
          bio.includes(q) ||
          topics.includes(q)
        );
      });
    }

    // 2. Rol Filtresi
    if (roleFilter !== "all") {
      profilesList = profilesList.filter((p) => p.role === roleFilter);
    }

    // 3. Akademik Ünvan Filtresi
    if (titleFilter !== "all") {
      profilesList = profilesList.filter((p) => {
        const text = `${p.headline || ""} ${p.bio || ""}`.toLowerCase();
        if (titleFilter === "prof")
          return text.includes("prof");
        if (titleFilter === "docent")
          return text.includes("doç") || text.includes("doc");
        if (titleFilter === "dr_member")
          return text.includes("öğr. üyesi") || text.includes("ogr. uyesi");
        if (titleFilter === "instructor")
          return text.includes("öğr. gör") || text.includes("öğretim görevlisi");
        if (titleFilter === "res_asst")
          return text.includes("arş. gör") || text.includes("araştırma görevlisi");
        return true;
      });
    }

    // 4. Mentörlük Filtresi
    if (isMentorFilter) {
      profilesList = profilesList.filter((p) => p.is_mentor === true);
    }

    // --- SIRALAMA HIYERAŞİSİ (Sorting Order) ---
    if (sortBy === "karma") {
      profilesList.sort((a, b) => (b.karma_points || 0) - (a.karma_points || 0));
    } else if (sortBy === "name_asc") {
      profilesList.sort((a, b) =>
        `${a.first_name || ""} ${a.last_name || ""}`.localeCompare(
          `${b.first_name || ""} ${b.last_name || ""}`,
          "tr"
        )
      );
    } else if (sortBy === "newest") {
      profilesList.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      // Varsayılan: Hiyerarşik Sıralama (Admin/Mod -> Prof/Doç/Dr.Öğr -> Karma -> İsme göre)
      profilesList = sortProfilesHierarchically(profilesList);
    }

    filteredProfiles = profilesList;
  }

  // --- SAYFALAMA MİMARİSİ (20'şerli Pagination) ---
  const totalCount = filteredProfiles.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedProfiles = filteredProfiles.slice(startIndex, startIndex + PAGE_SIZE);

  // URL Oluşturma Yardımcısı
  const createUrl = (newParams: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams();
    search.set("tab", activeTab);
    if (searchQuery) search.set("query", searchQuery);
    if (roleFilter !== "all") search.set("role", roleFilter);
    if (titleFilter !== "all") search.set("title", titleFilter);
    if (isMentorFilter) search.set("isMentor", "true");
    if (sortBy !== "hierarchy") search.set("sortBy", sortBy);
    search.set("page", "1");

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === "all" || value === "false") {
        search.delete(key);
      } else {
        search.set(key, String(value));
      }
    });

    return `/explore?${search.toString()}`;
  };

  const tabs = [
    { value: "students", label: "Öğrenciler & Üyeler", icon: GraduationCap },
    { value: "academics", label: "Akademisyenler", icon: BookOpen },
    { value: "organizations", label: "Kurumlar & İşverenler", icon: Building2 },
    { value: "mentors", label: "Mentörler", icon: UserCheck },
  ];

  const hasActiveFilters =
    searchQuery ||
    roleFilter !== "all" ||
    titleFilter !== "all" ||
    isMentorFilter ||
    sortBy !== "hierarchy";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]/30">
      <Navbar />
      <main className="flex-1">
        {/* Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 py-12 text-white shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Keşfet</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-teal-100">
              DEÜ Topluluğundaki öğrencileri, akademisyenleri ve kayıtlı firmaları/dernekleri keşfedin.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Sekmeler */}
          <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={`/explore?tab=${tab.value}`}
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

          {/* Gelişmiş Filtreleme & Arama Çubuğu */}
          <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
            <form method="GET" action="/explore" className="space-y-4">
              <input type="hidden" name="tab" value={activeTab} />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* Arama Çubuğu */}
                <div className="relative lg:col-span-2">
                  <input
                    type="text"
                    name="query"
                    defaultValue={searchQuery}
                    placeholder="İsim, unvan, bölüm veya biyografide ara..."
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-xs focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                  />
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--color-muted-foreground)]" />
                </div>

                {/* Rol Filtresi */}
                <div>
                  <select
                    name="role"
                    defaultValue={roleFilter}
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2.5 text-xs focus:border-[var(--color-ring)] focus:outline-none"
                  >
                    <option value="all">Tüm Rol/Sıfatlar</option>
                    <option value="student">Öğrenci</option>
                    <option value="alumni">Mezun</option>
                    <option value="faculty">Akademisyen</option>
                    <option value="employer">İşveren</option>
                    <option value="admin">Yönetici</option>
                    <option value="moderator">Moderatör</option>
                  </select>
                </div>

                {/* Akademik Ünvan Filtresi */}
                <div>
                  <select
                    name="title"
                    defaultValue={titleFilter}
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 py-2.5 text-xs focus:border-[var(--color-ring)] focus:outline-none"
                  >
                    <option value="all">Tüm Ünvanlar</option>
                    <option value="prof">Prof. Dr.</option>
                    <option value="docent">Doç. Dr.</option>
                    <option value="dr_member">Dr. Öğretim Üyesi</option>
                    <option value="instructor">Öğretim Görevlisi</option>
                    <option value="res_asst">Araştırma Görevlisi</option>
                  </select>
                </div>
              </div>

              {/* Alt Filtre İkinci Satır */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)]/50 pt-3">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Sıralama Kriteri */}
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                    <span className="font-semibold">Sıralama:</span>
                    <select
                      name="sortBy"
                      defaultValue={sortBy}
                      className="rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] px-2.5 py-1.5 text-xs font-medium focus:outline-none"
                    >
                      <option value="hierarchy">
                        ⭐ Hiyerarşik (Yönetici/Prof & Puan)
                      </option>
                      <option value="karma">Karma Puana Göre (En Yüksek)</option>
                      <option value="name_asc">İsme Göre (A-Z)</option>
                      <option value="newest">En Yeniler</option>
                    </select>
                  </div>

                  {/* Mentörlük İşaret kutusu */}
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--color-foreground)]">
                    <input
                      type="checkbox"
                      name="isMentor"
                      value="true"
                      defaultChecked={isMentorFilter}
                      className="rounded border-[var(--color-border)] text-indigo-600 focus:ring-indigo-500"
                    />
                    Sadece Mentörler
                  </label>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {hasActiveFilters && (
                    <Link
                      href={`/explore?tab=${activeTab}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Filtreleri Temizle
                    </Link>
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl gradient-primary px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 transition-opacity"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Filtrele
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Sayfalama Bilgisi Özet Satırı */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-muted-foreground)]">
            <span>
              Toplam <strong className="text-[var(--color-foreground)]">{totalCount}</strong> kayıt bulundu. (Her sayfada 20 gösteriliyor)
            </span>
            <span>
              Sayfa <strong className="text-[var(--color-foreground)]">{safePage}</strong> / {totalPages}
            </span>
          </div>

          {/* Sonuç Alanı */}
          <div className="mt-4">
            {activeTab === "organizations" ? (
              filteredOrgs.length > 0 || filteredProfiles.length > 0 ? (
                <div className="space-y-10">
                  {filteredOrgs.length > 0 && (
                    <div>
                      <h2 className="mb-4 text-base font-bold text-[var(--color-foreground)] flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-teal-600" />
                        Kayıtlı Şirketler & Kurumlar
                      </h2>
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredOrgs.map((org) => (
                          <div
                            key={org.id}
                            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-lg"
                          >
                            <div>
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

                              {org.description && (
                                <p className="mt-4 text-xs text-[var(--color-muted-foreground)] line-clamp-3 leading-relaxed whitespace-pre-wrap">
                                  {org.description}
                                </p>
                              )}
                            </div>

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
                    </div>
                  )}

                  {filteredProfiles.length > 0 && (
                    <div>
                      <h2 className="mb-4 text-base font-bold text-[var(--color-foreground)] flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-amber-600" />
                        Kayıtlı İşveren Temsilcileri
                      </h2>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {paginatedProfiles.map((p) => (
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
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-lg font-bold text-white shadow-sm shrink-0">
                                  {(p.first_name || "?").charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                                  {p.first_name} {p.last_name}
                                </h3>
                                <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                                  {p.headline || p.department || "İşveren Temsilcisi"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-[10px]">
                              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 font-bold text-amber-600 uppercase">
                                İşveren
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState icon={Building2} label="Kayıtlı kurum veya işveren bulunmuyor" />
              )
            ) : paginatedProfiles.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedProfiles.map((p) => {
                  const rank = getProfileRank(p);
                  const isManager = p.role === "admin" || p.role === "moderator";

                  return (
                    <Link
                      key={p.id}
                      href={`/u/${p.id}`}
                      className={`group rounded-2xl border bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                        isManager
                          ? "border-amber-500/30 ring-1 ring-amber-500/20 bg-amber-500/5"
                          : rank <= 60
                          ? "border-teal-500/30 ring-1 ring-teal-500/10"
                          : "border-[var(--color-border)]"
                      }`}
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
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                              {p.first_name} {p.last_name}
                            </h3>
                            {isManager && (
                              <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                            {p.headline || p.department || "Bölüm belirtilmemiş"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-[var(--color-muted-foreground)]">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-bold uppercase ${
                            isManager
                              ? "bg-amber-500/20 text-amber-600"
                              : p.role === "faculty"
                              ? "bg-teal-500/20 text-teal-600"
                              : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          }`}
                        >
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
                            <span
                              key={i}
                              className="rounded-md bg-[var(--color-muted)] px-2 py-0.5 text-[9px] font-medium text-[var(--color-foreground)]"
                            >
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
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={Users} label="Kayıtlı üye bulunmuyor" />
            )}
          </div>

          {/* Sayfalama (Pagination) Numaralandırılmış Kontrol Çubuğu */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {/* Önceki Sayfa */}
              <Link
                href={createUrl({ page: Math.max(1, safePage - 1) })}
                className={`inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs font-semibold transition-colors ${
                  safePage <= 1
                    ? "pointer-events-none opacity-40"
                    : "hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Önceki
              </Link>

              {/* Sayfa Numaraları */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((pNum) => pNum === 1 || pNum === totalPages || Math.abs(pNum - safePage) <= 2)
                  .map((pNum, index, array) => {
                    const prevNum = array[index - 1];
                    const isEllipsis = prevNum && pNum - prevNum > 1;

                    return (
                      <div key={pNum} className="flex items-center gap-1">
                        {isEllipsis && (
                          <span className="px-1 text-xs text-[var(--color-muted-foreground)]">...</span>
                        )}
                        <Link
                          href={createUrl({ page: pNum })}
                          className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                            pNum === safePage
                              ? "gradient-primary text-white shadow-md shadow-indigo-500/20"
                              : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                          }`}
                        >
                          {pNum}
                        </Link>
                      </div>
                    );
                  })}
              </div>

              {/* Sonraki Sayfa */}
              <Link
                href={createUrl({ page: Math.min(totalPages, safePage + 1) })}
                className={`inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs font-semibold transition-colors ${
                  safePage >= totalPages
                    ? "pointer-events-none opacity-40"
                    : "hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                Sonraki
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-16 text-center shadow-sm">
      <Icon className="mx-auto h-12 w-12 text-[var(--color-muted-foreground)] opacity-50" />
      <h3 className="mt-4 text-base font-bold text-[var(--color-foreground)]">Sonuç bulunamadı</h3>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        {label} veya arama kriterlerinizle eşleşen bir kayıt bulunmuyor.
      </p>
    </div>
  );
}
