"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface SubredditItem {
  id: string;
  name: string;
  slug: string;
}

interface CommunitySearchHeaderProps {
  subreddits: SubredditItem[];
  initialQuery?: string;
  initialCategory?: string;
  initialSort?: string;
}

export default function CommunitySearchHeader({
  subreddits,
  initialQuery = "",
  initialCategory = "",
  initialSort = "new",
}: CommunitySearchHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);

  // Sync state if URL changes directly
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setCategory(searchParams.get("category") || "");
    setSort(searchParams.get("sort") || "new");
  }, [searchParams]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    if (sort && sort !== "new") params.set("sort", sort);

    router.push(`/community?${params.toString()}`);
  };

  const handleClear = () => {
    setQuery("");
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (sort && sort !== "new") params.set("sort", sort);
    router.push(`/community?${params.toString()}`);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCategory(val);
    
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (val) params.set("category", val);
    if (sort && sort !== "new") params.set("sort", sort);
    
    router.push(`/community?${params.toString()}`);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSort(val);

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    if (val && val !== "new") params.set("sort", val);

    router.push(`/community?${params.toString()}`);
  };

  return (
    <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm mb-6">
      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Bar Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            placeholder="Gönderilerde arayın (başlık veya içerik)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-2.5 pl-10 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[var(--color-foreground)] font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter & Sort selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 min-w-[140px] flex-1 sm:flex-initial">
            <select
              value={category}
              onChange={handleCategoryChange}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-xs font-semibold text-[var(--color-foreground)] focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="">Tüm Kategoriler</option>
              {subreddits.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 min-w-[140px] flex-1 sm:flex-initial">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--color-muted-foreground)] ml-1 hidden sm:block" />
            <select
              value={sort}
              onChange={handleSortChange}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-xs font-semibold text-[var(--color-foreground)] focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="new">En Yeni</option>
              <option value="top">En Çok Beğenilen</option>
              <option value="comments">En Çok Yorumlanan</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="rounded-xl bg-indigo-500 hover:bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-sm cursor-pointer w-full sm:w-auto"
          >
            Ara
          </button>
        </div>
      </form>
    </div>
  );
}
