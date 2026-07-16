"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, GitBranch, PlayCircle, Globe, Calendar, User, Code2 } from "lucide-react";

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
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    role: string;
  } | null;
};

export default function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique technologies
  const allTags = Array.from(
    new Set(initialProjects.flatMap((p) => p.technologies || []))
  ).sort();

  const filteredProjects = initialProjects.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag =
      selectedTag === null ||
      (p.technologies && p.technologies.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            placeholder="Proje ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-4 py-2 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              selectedTag === null
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-border)]"
            }`}
          >
            Tümü
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                selectedTag === tag
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-border)]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filteredProjects.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="group flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm transition-all hover:shadow-md"
            >
              <div className="p-5 flex-1">
                <h3 className="text-xl font-bold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                  {p.title}
                </h3>
                {p.description && (
                  <p className="mt-2 text-sm text-[var(--color-muted-foreground)] line-clamp-3">
                    {p.description}
                  </p>
                )}

                {p.technologies && p.technologies.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.technologies.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1 rounded bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]"
                      >
                        {tech}
                      </span>
                    ))}
                    {p.technologies.length > 4 && (
                      <span className="inline-flex items-center gap-1 rounded bg-[var(--color-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]">
                        +{p.technologies.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--color-border)] p-4 flex items-center justify-between bg-[var(--color-muted)]/10 rounded-b-xl">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-xs font-bold text-white">
                    {(p.profiles?.first_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm font-medium">
                    {p.profiles?.first_name} {p.profiles?.last_name}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
                  {p.github_url && (
                    <a href={p.github_url} target="_blank" rel="noreferrer" className="hover:text-[var(--color-foreground)] transition-colors">
                      <GitBranch className="h-4 w-4" />
                    </a>
                  )}
                  {p.youtube_url && (
                    <a href={p.youtube_url} target="_blank" rel="noreferrer" className="hover:text-red-500 transition-colors">
                      <PlayCircle className="h-4 w-4" />
                    </a>
                  )}
                  {p.external_url && (
                    <a href={p.external_url} target="_blank" rel="noreferrer" className="hover:text-[var(--color-primary)] transition-colors">
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center bg-[var(--color-card)]">
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
