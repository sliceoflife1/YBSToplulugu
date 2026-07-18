"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Search, MapPin, GraduationCap, FileStack, ArrowRight, User } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import { useLocale } from "next-intl";

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

  // Filtre State'leri
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedEduType, setSelectedEduType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    async function init() {
      // 1. Giriş kontrolü (Auth)
      const { data: { user } } = await supabase.auth.getUser();
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

      // 3. İlk yüklemede tüm görünür andıç profillerini çek
      const { data: ybProfiles } = await supabase
        .from("yearbook_profiles")
        .select(`
          *,
          profiles:user_id (id, first_name, last_name, avatar_url, headline),
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
    // 1. Fakülte Filtresi
    if (selectedFaculty && p.yearbook_departments?.yearbook_faculties?.id !== selectedFaculty) {
      return false;
    }
    // 2. Bölüm Filtresi
    if (selectedDept && p.department_id !== selectedDept) {
      return false;
    }
    // 3. Mezuniyet Yılı Filtresi
    if (selectedYear && p.graduation_year.toString() !== selectedYear) {
      return false;
    }
    // 4. Öğretim Türü Filtresi
    if (selectedEduType && p.education_type !== selectedEduType) {
      return false;
    }
    // 5. Arama Sorgusu (Ad, soyad veya kişisel mesaj içeriği)
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
            {isEn ? "Graduation Yearbook" : "Mezuniyet Andıcı (Yıllık)"}
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
                  <option key={fac.id} value={fac.id}>{fac.name}</option>
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
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
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
                {Array.from({ length: 16 }, (_, i) => 2020 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
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

        {/* Sonuçların Listelenmesi */}
        {filteredProfiles.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredProfiles.map((p) => {
              const fullName = `${p.profiles?.first_name} ${p.profiles?.last_name}`;
              return (
                <div
                  key={p.user_id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Profil Resmi */}
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

                    <h3 className="mt-4 text-md font-bold text-[var(--color-foreground)] line-clamp-1">{fullName}</h3>
                    <p className="text-xs text-[var(--color-muted-foreground)] min-h-[16px] line-clamp-1">
                      {p.profiles?.headline || p.yearbook_departments?.name}
                    </p>

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
                      {isEn ? "View Yearbook Profile" : "Andıcı Gör"}
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
      </main>
    </div>
  );
}
