"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  Search,
  Plus,
  Filter,
  X,
  AlertTriangle,
} from "lucide-react";
import type { JobListing } from "@/types/database";
import JobCard from "@/components/jobs/job-card";
import {
  JOB_CATEGORY_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  WORK_MODE_LABELS,
  JOB_CATEGORIES,
  EMPLOYMENT_TYPES,
  WORK_MODES,
} from "@/constants/job-categories";
import type { JobCategory, EmploymentType, WorkMode } from "@/constants/job-categories";

interface JobsClientProps {
  listings: JobListing[];
  userRole: string | null;
  hasApprovedOrg: boolean;
  isLoggedIn: boolean;
}

export default function JobsClient({
  listings,
  userRole,
  hasApprovedOrg,
  isLoggedIn,
}: JobsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | "all">("all");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<EmploymentType | "all">("all");
  const [selectedWorkMode, setSelectedWorkMode] = useState<WorkMode | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const isEmployer = userRole === "employer";

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesSearch =
        !searchQuery ||
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.organizations?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || listing.category === selectedCategory;

      const matchesEmploymentType =
        selectedEmploymentType === "all" || listing.employment_type === selectedEmploymentType;

      const matchesWorkMode =
        selectedWorkMode === "all" || listing.work_mode === selectedWorkMode;

      return matchesSearch && matchesCategory && matchesEmploymentType && matchesWorkMode;
    });
  }, [listings, searchQuery, selectedCategory, selectedEmploymentType, selectedWorkMode]);

  const activeFilterCount = [selectedCategory, selectedEmploymentType, selectedWorkMode].filter(
    (f) => f !== "all"
  ).length;

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedEmploymentType("all");
    setSelectedWorkMode("all");
    setSearchQuery("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg gradient-primary p-2.5">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
              İş İlanları
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              İş ve staj fırsatlarını keşfedin
            </p>
          </div>
        </div>

        {isEmployer && (
          <div>
            {hasApprovedOrg ? (
              <div className="flex gap-2">
                <Link
                  href="/jobs/my-listings"
                  className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
                >
                  <Briefcase className="h-4 w-4" />
                  İlanlarım
                </Link>
                <Link
                  href="/jobs/create"
                  className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  Yeni İlan Oluştur
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Kuruluşunuz henüz onaylanmamıştır</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <input
              type="text"
              placeholder="İlan veya şirket adı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-foreground)] placeholder-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              activeFilterCount > 0
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtrele
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Filtreler</h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                >
                  <X className="h-3 w-3" />
                  Temizle
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Kategori */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted-foreground)]">
                  Kategori
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as JobCategory | "all")}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
                >
                  <option value="all">Tüm Kategoriler</option>
                  {JOB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {JOB_CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              {/* İstihdam Tipi */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted-foreground)]">
                  İstihdam Tipi
                </label>
                <select
                  value={selectedEmploymentType}
                  onChange={(e) => setSelectedEmploymentType(e.target.value as EmploymentType | "all")}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
                >
                  <option value="all">Tüm Tipler</option>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {EMPLOYMENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Çalışma Modu */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted-foreground)]">
                  Çalışma Şekli
                </label>
                <select
                  value={selectedWorkMode}
                  onChange={(e) => setSelectedWorkMode(e.target.value as WorkMode | "all")}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
                >
                  <option value="all">Tüm Modlar</option>
                  {WORK_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {WORK_MODE_LABELS[mode]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {filteredListings.length} ilan bulundu
        </p>
      </div>

      {filteredListings.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <JobCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)] opacity-50" />
          <h3 className="mt-4 text-lg font-medium text-[var(--color-foreground)]">
            İlan Bulunamadı
          </h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {searchQuery || activeFilterCount > 0
              ? "Arama kriterlerinize uygun ilan bulunamadı. Filtreleri temizlemeyi deneyin."
              : "Henüz aktif bir iş ilanı bulunmuyor."}
          </p>
          {(searchQuery || activeFilterCount > 0) && (
            <button
              onClick={clearFilters}
              className="mt-4 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}
    </div>
  );
}
