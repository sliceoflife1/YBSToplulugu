"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, GitBranch, PlayCircle, Globe, Calendar, User, Code2, ArrowBigUp, MessageSquare, Filter, SlidersHorizontal, BookOpen, GraduationCap, School } from "lucide-react";
import { toast } from "sonner";
import { upvoteProject } from "./actions";

type Project = {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  github_url: string;
  youtube_url: string;
  behance_url: string;
  external_url: string;
  semester: string;
  year: number;
  created_at: string;
  upvote_count: number;
  comment_count: number;
  hasUpvoted: boolean;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    role: string;
    department: string | null;
    karma_points: number;
    edu_email: string;
  } | null;
};

interface ProjectsClientProps {
  initialProjects: Project[];
  isLoggedIn: boolean;
}

// Bölüm - Fakülte Eşleştirmesi (Dokuz Eylül Üniversitesi için)
const departmentToFacultyMap: Record<string, string> = {
  "Yönetim Bilişim Sistemleri": "İktisadi ve İdari Bilimler Fakültesi",
  "İktisat": "İktisadi ve İdari Bilimler Fakültesi",
  "İşletme": "İktisadi ve İdari Bilimler Fakültesi",
  "Maliye": "İktisadi ve İdari Bilimler Fakültesi",
  "Çalışma Ekonomisi ve Endüstri İlişkileri": "İktisadi ve İdari Bilimler Fakültesi",
  "Kamu Yönetimi": "İktisadi ve İdari Bilimler Fakültesi",
  "Uluslararası İlişkiler": "İktisadi ve İdari Bilimler Fakültesi",
  "Bilgisayar Mühendisliği": "Mühendislik Fakültesi",
  "Elektrik-Elektronik Mühendisliği": "Mühendislik Fakültesi",
  "Endüstri Mühendisliği": "Mühendislik Fakültesi",
  "İnşaat Mühendisliği": "Mühendislik Fakültesi",
  "Makine Mühendisliği": "Mühendislik Fakültesi",
  "Maden Mühendisliği": "Mühendislik Fakültesi",
  "Jeoloji Mühendisliği": "Mühendislik Fakültesi",
  "Jeofizik Mühendisliği": "Mühendislik Fakültesi",
  "Çevre Mühendisliği": "Mühendislik Fakültesi",
  "Metalurji ve Malzeme Mühendisliği": "Mühendislik Fakültesi",
  "Tekstil Mühendisliği": "Mühendislik Fakültesi",
};

const getFacultyName = (department: string | null | undefined) => {
  if (!department) return "Diğer / Belirtilmemiş";
  const deptTrimmed = department.trim();
  return departmentToFacultyMap[deptTrimmed] || "Diğer / Belirtilmemiş";
};

const getUniversityName = (email: string | null | undefined) => {
  if (!email) return "Dokuz Eylül Üniversitesi";
  if (email.endsWith("deu.edu.tr")) return "Dokuz Eylül Üniversitesi";
  return "Dokuz Eylül Üniversitesi"; // Sistem geneli varsayılan
};

export default function ProjectsClient({ initialProjects, isLoggedIn }: ProjectsClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Gelişmiş filtreleme alanları
  const [showFilters, setShowFilters] = useState(false);
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterSemester, setFilterSemester] = useState<string>("");
  const [filterDepartment, setFilterDepartment] = useState<string>("");
  const [filterUniversity, setFilterUniversity] = useState<string>("");
  const [filterFaculty, setFilterFaculty] = useState<string>("");
  const [sortBy, setSortBy] = useState<"karma" | "upvotes" | "comments" | "newest" | "oldest">("karma");

  // Benzersiz teknoloji etiketleri
  const allTags = Array.from(
    new Set(projects.flatMap((p) => p.technologies || []))
  ).sort();

  // Filtre seçenekleri için veriden benzersiz listeler oluştur
  const yearsList = Array.from(new Set(projects.map((p) => p.year).filter(Boolean))).sort((a, b) => b - a) as number[];
  const departmentsList = Array.from(new Set(projects.map((p) => p.profiles?.department).filter(Boolean))).sort() as string[];
  const universitiesList = Array.from(new Set(projects.map((p) => getUniversityName(p.profiles?.edu_email)).filter(Boolean))).sort() as string[];
  const facultiesList = Array.from(new Set(projects.map((p) => getFacultyName(p.profiles?.department)).filter((f) => f !== "Diğer / Belirtilmemiş"))).sort() as string[];

  const handleUpvote = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.error("Oy kullanmak için giriş yapmalısınız.");
      return;
    }

    // Optimistik Arayüz Güncellemesi
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const newHasUpvoted = !p.hasUpvoted;
          return {
            ...p,
            hasUpvoted: newHasUpvoted,
            upvote_count: newHasUpvoted ? p.upvote_count + 1 : p.upvote_count - 1,
          };
        }
        return p;
      })
    );

    const result = await upvoteProject(projectId);
    if (result.error) {
      toast.error(result.error);
      // Hata durumunda optimistik güncellemeyi geri al
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === projectId) {
            const revertedHasUpvoted = !p.hasUpvoted;
            return {
              ...p,
              hasUpvoted: revertedHasUpvoted,
              upvote_count: revertedHasUpvoted ? p.upvote_count + 1 : p.upvote_count - 1,
            };
          }
          return p;
        })
      );
    }
  };

  // Filtreleme mantığı
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${p.profiles?.first_name || ""} ${p.profiles?.last_name || ""}`.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag =
      selectedTag === null ||
      (p.technologies && p.technologies.includes(selectedTag));

    const matchesYear = filterYear === "" || p.year.toString() === filterYear;
    const matchesSemester = filterSemester === "" || p.semester === filterSemester;
    const matchesDept = filterDepartment === "" || p.profiles?.department === filterDepartment;
    const matchesUniv = filterUniversity === "" || getUniversityName(p.profiles?.edu_email) === filterUniversity;
    const matchesFaculty = filterFaculty === "" || getFacultyName(p.profiles?.department) === filterFaculty;

    return matchesSearch && matchesTag && matchesYear && matchesSemester && matchesDept && matchesUniv && matchesFaculty;
  });

  // Sıralama mantığı
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === "karma") {
      const karmaA = a.profiles?.karma_points || 0;
      const karmaB = b.profiles?.karma_points || 0;
      return karmaB - karmaA; // Yüksek karma puanlı en üstte
    }
    if (sortBy === "upvotes") {
      return b.upvote_count - a.upvote_count;
    }
    if (sortBy === "comments") {
      return b.comment_count - a.comment_count;
    }
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return 0;
  });

  const activeFilterCount = [
    filterYear,
    filterSemester,
    filterDepartment,
    filterUniversity,
    filterFaculty
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setFilterYear("");
    setFilterSemester("");
    setFilterDepartment("");
    setFilterUniversity("");
    setFilterFaculty("");
    setSearchQuery("");
    setSelectedTag(null);
    setSortBy("karma");
  };

  return (
    <div>
      {/* Üst Arama ve Filtreleme Paneli */}
      <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Arama Kutusu */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
            <input
              type="text"
              placeholder="Proje adı, açıklama veya geliştirici ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm text-[var(--color-foreground)]"
            />
          </div>

          {/* Filtre ve Sıralama Butonları */}
          <div className="flex w-full md:w-auto items-center justify-end gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                showFilters || activeFilterCount > 0
                  ? "border-indigo-500/30 bg-indigo-500/5 text-indigo-500"
                  : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filtreler</span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-indigo-500 text-white px-2 py-0.5 text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sıralama Kutusu */}
            <div className="relative flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none transition-all cursor-pointer font-semibold"
              >
                <option value="karma">🔥 Karma Puana Göre</option>
                <option value="upvotes">👍 Beğeni Sayısına Göre</option>
                <option value="comments">💬 Yorum Sayısına Göre</option>
                <option value="newest">📅 En Yeni Eklenenler</option>
                <option value="oldest">⏳ En Eski Eklenenler</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gelişmiş Filtreler Akordeonu */}
        {showFilters && (
          <div className="mt-5 border-t border-[var(--color-border)] pt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-5 animate-fade-in">
            {/* Üniversite Filtresi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-muted-foreground)] flex items-center gap-1">
                <School className="h-3.5 w-3.5" /> ÜNİVERSİTE
              </label>
              <select
                value={filterUniversity}
                onChange={(e) => setFilterUniversity(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Tümü</option>
                {universitiesList.map((uni) => (
                  <option key={uni} value={uni}>{uni}</option>
                ))}
              </select>
            </div>

            {/* Fakülte Filtresi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-muted-foreground)] flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> FAKÜLTE
              </label>
              <select
                value={filterFaculty}
                onChange={(e) => setFilterFaculty(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Tümü</option>
                {facultiesList.map((fac) => (
                  <option key={fac} value={fac}>{fac}</option>
                ))}
              </select>
            </div>

            {/* Bölüm Filtresi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-muted-foreground)] flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" /> BÖLÜM
              </label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Tümü</option>
                {departmentsList.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Yıl Filtresi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-muted-foreground)] flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> YIL
              </label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Tümü</option>
                {yearsList.map((y) => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
            </div>

            {/* Dönem Filtresi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-muted-foreground)] flex items-center gap-1">
                <Code2 className="h-3.5 w-3.5" /> DÖNEM
              </label>
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Tümü</option>
                <option value="fall">Güz</option>
                <option value="spring">Bahar</option>
                <option value="summer">Yaz</option>
              </select>
            </div>
          </div>
        )}

        {/* Aktif Filtre Özetleri & Sıfırlama Butonu */}
        {(activeFilterCount > 0 || selectedTag !== null || searchQuery !== "") && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4 text-xs">
            <span className="text-[var(--color-muted-foreground)]">
              Toplam <strong>{sortedProjects.length}</strong> proje listeleniyor.
            </span>
            <button
              onClick={handleResetFilters}
              className="text-indigo-500 font-bold hover:underline"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>

      {/* Teknoloji Etiketi Filtresi */}
      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 animate-fade-in">
          <button
            onClick={() => setSelectedTag(null)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              selectedTag === null
                ? "bg-indigo-500 text-white shadow-sm"
                : "bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            }`}
          >
            Tümü
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                selectedTag === tag
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Projeler Listesi */}
      {sortedProjects.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {sortedProjects.map((p) => (
            <div
              key={p.id}
              className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] overflow-hidden"
            >
              <Link href={`/projects/${p.id}`} className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-foreground)] group-hover:text-indigo-500 transition-colors leading-snug">
                    {p.title}
                  </h3>
                  {p.description && (
                    <div 
                      className="mt-3 text-sm text-[var(--color-muted-foreground)] line-clamp-3 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: p.description }}
                    />
                  )}
                </div>

                <div className="mt-5 space-y-3">
                  {/* Proje Fakülte & Bölüm Bilgisi */}
                  <div className="flex flex-col gap-1 text-[11px] text-[var(--color-muted-foreground)] border-t border-[var(--color-border)]/50 pt-2">
                    <span className="truncate">🏫 {getUniversityName(p.profiles?.edu_email)}</span>
                    <span className="truncate">🏛️ {getFacultyName(p.profiles?.department)}</span>
                    <span className="truncate">🎓 {p.profiles?.department || "Bölüm Belirtilmemiş"}</span>
                  </div>

                  {/* Teknolojiler */}
                  {p.technologies && p.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.technologies.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex items-center rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-500"
                        >
                          {tech}
                        </span>
                      ))}
                      {p.technologies.length > 3 && (
                        <span className="inline-flex items-center rounded bg-[var(--color-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
                          +{p.technologies.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>

              {/* Kart Alt Bilgisi */}
              <div className="border-t border-[var(--color-border)] px-6 py-4 flex items-center justify-between bg-[var(--color-muted)]/5 group-hover:bg-[var(--color-muted)]/10 transition-colors">
                {p.profiles?.id ? (
                  <Link 
                    href={`/u/${p.profiles.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 hover:text-indigo-500 transition-colors group/author"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white uppercase shadow-sm">
                      {(p.profiles?.first_name || "?").charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <div className="text-xs font-semibold">
                        {p.profiles?.first_name} {p.profiles?.last_name}
                      </div>
                      <div className="text-[9px] text-[var(--color-muted-foreground)] flex items-center gap-0.5">
                        🔥 Karma: {p.profiles?.karma_points || 0}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white uppercase shadow-sm">
                      ?
                    </div>
                    <div className="text-xs font-semibold text-[var(--color-foreground)]">
                      Bilinmeyen Kullanıcı
                    </div>
                  </div>
                )}

                {/* Beğeni & Yorum & Sosyal Medya Bağlantıları */}
                <div className="flex items-center gap-3.5">
                  {/* Oy Butonu */}
                  <button
                    type="button"
                    onClick={(e) => handleUpvote(p.id, e)}
                    className={`flex items-center gap-1 text-xs font-semibold transition-colors hover:text-indigo-500 ${
                      p.hasUpvoted ? "text-indigo-500" : "text-[var(--color-muted-foreground)]"
                    }`}
                  >
                    <ArrowBigUp className={`h-4 w-4 ${p.hasUpvoted ? "fill-indigo-500 text-indigo-500" : ""}`} />
                    <span>{p.upvote_count}</span>
                  </button>

                  {/* Yorum İkonu */}
                  <div className="flex items-center gap-1 text-xs font-semibold text-[var(--color-muted-foreground)]">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{p.comment_count}</span>
                  </div>

                  <div className="h-3 w-px bg-[var(--color-border)]" />

                  {/* Proje Bağlantıları */}
                  <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
                    {p.github_url && (
                      <a 
                        href={p.github_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-[var(--color-foreground)] transition-colors p-1"
                        title="GitHub Deposu"
                      >
                        <GitBranch className="h-4 w-4" />
                      </a>
                    )}
                    {p.youtube_url && (
                      <a 
                        href={p.youtube_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-red-500 transition-colors p-1"
                        title="YouTube Videosu"
                      >
                        <PlayCircle className="h-4 w-4" />
                      </a>
                    )}
                    {p.external_url && (
                      <a 
                        href={p.external_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-indigo-500 transition-colors p-1"
                        title="Canlı Demo"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center bg-[var(--color-card)] animate-fade-in">
          <Code2 className="mx-auto h-12 w-12 text-[var(--color-muted-foreground)] opacity-50" />
          <h3 className="mt-4 text-lg font-medium">Proje Bulunamadı</h3>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            Arama kriterlerinize uyan bir proje bulunamadı. Lütfen filtreleri temizleyip tekrar deneyin.
          </p>
        </div>
      )}
    </div>
  );
}
