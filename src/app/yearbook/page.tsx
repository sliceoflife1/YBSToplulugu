"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  GraduationCap,
  FileStack,
  ArrowRight,
  User,
  Star,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/layout/navbar";
import { useLocale } from "next-intl";

const PAGE_SIZE = 20;

/**
 * Yıllık (Yearbook) Hiyerarşik Öncelik Puanı Hesaplama:
 * 1. Derece Öncelik: Yönetici (admin) & Moderatör (moderator) & Ünvanlı Akademisyenler (Prof. Dr. > Doç. Dr. > Dr. Öğr. Üyesi > Öğr. Gör. > Arş. Gör.)
 * 2. Derece Öncelik: Karma Puanı Yüksek Olanlar (karma_points DESC)
 * 3. Derece Öncelik: Alfabetik İsim / Soyisim (first_name ASC, last_name ASC)
 */
function getYearbookProfileRank(ybProfile: any): number {
  const p = ybProfile.profiles || {};
  const role = p.role;
  if (role === "admin") return 10;
  if (role === "moderator") return 20;

  const headline = (p.headline || "").toLowerCase();

  if (
    role === "faculty" ||
    headline.includes("prof") ||
    headline.includes("doç") ||
    headline.includes("öğr. üyesi") ||
    headline.includes("öğr. gör") ||
    headline.includes("arş. gör")
  ) {
    if (
      headline.includes("prof. dr.") ||
      headline.includes("prof.dr") ||
      headline.includes("profesor") ||
      headline.includes("profesör")
    )
      return 30;
    if (
      headline.includes("doç. dr.") ||
      headline.includes("doç.dr") ||
      headline.includes("doc. dr") ||
      headline.includes("doçent")
    )
      return 40;
    if (
      headline.includes("dr. öğretim üyesi") ||
      headline.includes("dr. öğr. üyesi") ||
      headline.includes("dr. ogr. uyesi") ||
      headline.includes("yardımcı doçent")
    )
      return 50;
    if (
      headline.includes("öğr. gör") ||
      headline.includes("öğretim görevlisi") ||
      headline.includes("arş. gör") ||
      headline.includes("araştırma görevlisi") ||
      headline.includes("dr.")
    )
      return 60;
    if (role === "faculty") return 70;
  }

  if (role === "alumni") return 80;
  if (role === "student") return 90;
  if (role === "employer") return 100;
  return 110;
}

function sortYearbookProfilesHierarchically(list: any[]): any[] {
  return [...list].sort((a, b) => {
    // 1. Derece Öncelik: Yönetici, Moderatör, Ünvanlı Akademisyenler
    const rankA = getYearbookProfileRank(a);
    const rankB = getYearbookProfileRank(b);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // 2. Derece Öncelik: Karma Puanı yüksek olanlar (karma_points DESC)
    const karmaA = a.profiles?.karma_points || 0;
    const karmaB = b.profiles?.karma_points || 0;
    if (karmaA !== karmaB) {
      return karmaB - karmaA;
    }

    // 3. Derece Öncelik: Alfabetik İsim / Soyisim (first_name ASC, last_name ASC)
    const nameA = `${a.profiles?.first_name || ""} ${a.profiles?.last_name || ""}`.toLowerCase();
    const nameB = `${b.profiles?.first_name || ""} ${b.profiles?.last_name || ""}`.toLowerCase();
    return nameA.localeCompare(nameB, "tr");
  });
}

export default function YearbookPage() {
  const router = useRouter();
  const locale = useLocale();
  const isEn = locale === "en";

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Veri State'leri
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);

  // Filtre State'leri
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedEduType, setSelectedEduType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sayfalama State'i
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filtre değiştiğinde 1. sayfaya sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFaculty, selectedDept, selectedYear, selectedEduType, searchQuery]);

  useEffect(() => {
    const supabase = createClient();
    async function init() {
      // 1. Giriş kontrolü (Auth)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);

      // 2. Fakülteleri Yükle
      const { data: facs } = await supabase
        .from("yearbook_faculties")
        .select("*")
        .order("name");
      setFaculties(facs || []);

      // 2.1. Aktif Andıç Yıllarını Yükle
      try {
        const res = await fetch("/api/yearbook/periods");
        const data = await res.json();
        setPeriods(data.periods || []);
      } catch (e) {
        console.error("Yıllar yüklenemedi", e);
      }

      // 3. İlk yüklemede tüm görünür andıç profillerini çek
      const { data: ybProfiles } = await supabase
        .from("yearbook_profiles")
        .select(`
          *,
          profiles:profiles!yearbook_profiles_user_id_fkey (id, first_name, last_name, avatar_url, headline, role, karma_points),
          yearbook_departments:department_id (id, name, yearbook_faculties(id, name))
        `)
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      setProfiles(ybProfiles || []);
      setLoading(false);
    }
    init();
  }, [router]);

  // Seçilen fakülte değiştikçe bölümleri dinamik yükle
  useEffect(() => {
    if (!selectedFaculty) {
      setDepartments([]);
      setSelectedDept("");
      return;
    }
    const supabase = createClient();
    async function loadDepts() {
      const { data } = await supabase
        .from("yearbook_departments")
        .select("*")
        .eq("faculty_id", selectedFaculty)
        .order("name");
      setDepartments(data || []);
    }
    loadDepts();
  }, [selectedFaculty]);

  // Filtrelenmiş Andıç Profilleri
  const filteredProfiles = profiles.filter((p) => {
    if (selectedFaculty && p.yearbook_departments?.yearbook_faculties?.id !== selectedFaculty) {
      return false;
    }
    if (selectedDept && p.department_id !== selectedDept) {
      return false;
    }
    if (selectedYear && p.graduation_year.toString() !== selectedYear) {
      return false;
    }
    if (selectedEduType && p.education_type !== selectedEduType) {
      return false;
    }
    if (searchQuery) {
      const fullName = `${p.profiles?.first_name} ${p.profiles?.last_name}`.toLowerCase();
      const messageText = (p.message || "").toLowerCase();
      const q = searchQuery.toLowerCase();
      if (!fullName.includes(q) && !messageText.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Hiyerarşik Sıralama ve 20'şerli Sayfalama
  const sortedProfiles = sortYearbookProfilesHierarchically(filteredProfiles);
  const totalCount = sortedProfiles.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedProfiles = sortedProfiles.slice(startIndex, startIndex + PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8">
        {/* Başlık Bölümü */}
        <div className="mb-8 border-b border-[var(--color-border)] pb-6">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <FileStack className="h-8 w-8 text-indigo-500" />
            {isEn ? "Graduation Yearbook" : "Mezuniyet Yıllığı"}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            {isEn
              ? "Discover and write memories for graduating students across faculties and departments."
              : "Fakülte ve bölümlere göre mezun olacak öğrencileri keşfedin ve andıç yazılarınızı bırakın."}
          </p>
        </div>

        {/* Filtre ve Arama Alanı (Glassmorphic Container) */}
        <div className="mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/50 p-6 shadow-md backdrop-blur-md">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Fakülte Filtresi */}
            <div>
              <label className="text-xs font-semibold block mb-1.5">{isEn ? "Faculty" : "Fakülte"}</label>
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">{isEn ? "All Faculties" : "Tüm Fakülteler"}</option>
                {faculties.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bölüm Filtresi */}
            <div>
              <label className="text-xs font-semibold block mb-1.5">{isEn ? "Department" : "Bölüm"}</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                disabled={!selectedFaculty}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">{isEn ? "All Departments" : "Tüm Bölümler"}</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mezuniyet Yılı Filtresi */}
            <div>
              <label className="text-xs font-semibold block mb-1.5">{isEn ? "Graduation Year" : "Mezuniyet Yılı"}</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">{isEn ? "All Years" : "Tüm Yıllar"}</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.year}>
                    {p.year}
                  </option>
                ))}
              </select>
            </div>

            {/* Öğretim Türü Filtresi */}
            <div>
              <label className="text-xs font-semibold block mb-1.5">{isEn ? "Education Type" : "Öğretim Türü"}</label>
              <select
                value={selectedEduType}
                onChange={(e) => setSelectedEduType(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">{isEn ? "All Types" : "Tüm Türler"}</option>
                <option value="primary">{isEn ? "First Education" : "Birinci Öğretim"}</option>
                <option value="secondary">{isEn ? "Second Education" : "İkinci Öğretim"}</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            {/* Arama Inputu */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              <input
                type="text"
                placeholder={isEn ? "Search by name or message..." : "Öğrenci adı veya andıç sözüyle ara..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Sayfalama Bilgisi Özet Satırı */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-muted-foreground)]">
          <span>
            Toplam <strong className="text-[var(--color-foreground)]">{totalCount}</strong> mezun kayıtlı. (Her sayfada 20 gösteriliyor)
          </span>
          <span>
            Sayfa <strong className="text-[var(--color-foreground)]">{safePage}</strong> / {totalPages}
          </span>
        </div>

        {/* Sonuçların Listelenmesi */}
        {paginatedProfiles.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paginatedProfiles.map((p) => {
              const fullName = `${p.profiles?.first_name} ${p.profiles?.last_name}`;
              const isManager = p.profiles?.role === "admin" || p.profiles?.role === "moderator";
              const rank = getYearbookProfileRank(p);

              return (
                <div
                  key={p.user_id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-[var(--color-card)] p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                    isManager
                      ? "border-amber-500/30 ring-1 ring-amber-500/20 bg-amber-500/5"
                      : rank <= 60
                      ? "border-teal-500/30 ring-1 ring-teal-500/10"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Tıklanabilir Profil Resmi -> /u/[user_id] */}
                    <Link
                      href={`/u/${p.user_id}`}
                      className="hover:opacity-95 transition-opacity cursor-pointer block"
                    >
                      {p.profiles?.avatar_url ? (
                        <img
                          src={p.profiles.avatar_url}
                          alt={fullName}
                          className="h-24 w-24 rounded-full object-cover border-2 border-indigo-500/20 group-hover:border-indigo-500 transition-colors"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-3xl font-extrabold text-white">
                          {p.profiles?.first_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>

                    {/* Tıklanabilir Kullanıcı Adı -> /u/[user_id] */}
                    <div className="mt-4 flex items-center justify-center gap-1.5">
                      <Link
                        href={`/u/${p.user_id}`}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors"
                      >
                        <h3 className="text-md font-bold text-[var(--color-foreground)] line-clamp-1">
                          {fullName}
                        </h3>
                      </Link>
                      {isManager && (
                        <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-[var(--color-muted-foreground)] min-h-[16px] line-clamp-1">
                      {p.profiles?.headline || p.yearbook_departments?.name}
                    </p>

                    {/* Karma Puanı & Rozet */}
                    {p.profiles?.karma_points > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{p.profiles.karma_points} Karma</span>
                      </div>
                    )}

                    {/* Departman ve Yıl Bilgileri */}
                    <div className="mt-3.5 flex flex-col gap-1 w-full text-left bg-[var(--color-muted)]/20 rounded-xl p-3 text-xs border border-[var(--color-border)]/50">
                      <div className="flex items-center gap-1.5 text-[var(--color-foreground)]">
                        <GraduationCap className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{p.yearbook_departments?.name}</span>
                      </div>
                      <div className="flex justify-between text-[var(--color-muted-foreground)] mt-1">
                        <span>{p.graduation_year} Yılı Mezunu</span>
                        <span>{p.education_type === "primary" ? "1. Öğretim" : "2. Öğretim"}</span>
                      </div>
                    </div>

                    {/* Mezuniyet Sözü */}
                    {p.message && (
                      <p className="mt-4 text-xs italic text-[var(--color-muted-foreground)] line-clamp-2 px-1">
                        &ldquo;{p.message}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-[var(--color-border)]/50">
                    <Link
                      href={`/yearbook/${p.user_id}`}
                      className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500/10 py-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                      {isEn ? "View Yearbook Profile" : "Yıllığı Gör"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-card)]/30">
            <User className="h-12 w-12 text-[var(--color-muted-foreground)] mb-3" />
            <h3 className="font-semibold text-[var(--color-foreground)]">{isEn ? "No Students Found" : "Öğrenci Bulunamadı"}</h3>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
              {isEn ? "Try adjusting your filters or search query." : "Filtrelerinizi değiştirmeyi veya farklı aramalar yapmayı deneyin."}
            </p>
          </div>
        )}

        {/* Sayfalama (Pagination) Numaralandırılmış Kontrol Çubuğu */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {/* Önceki Sayfa */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage <= 1}
              className={`inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs font-semibold transition-colors ${
                safePage <= 1
                  ? "pointer-events-none opacity-40"
                  : "hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              {isEn ? "Previous" : "Önceki"}
            </button>

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
                      <button
                        type="button"
                        onClick={() => setCurrentPage(pNum)}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                          pNum === safePage
                            ? "gradient-primary text-white shadow-md shadow-indigo-500/20"
                            : "border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                        }`}
                      >
                        {pNum}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Sonraki Sayfa */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage >= totalPages}
              className={`inline-flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-xs font-semibold transition-colors ${
                safePage >= totalPages
                  ? "pointer-events-none opacity-40"
                  : "hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {isEn ? "Next" : "Sonraki"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
