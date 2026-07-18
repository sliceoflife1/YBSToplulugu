"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, GitBranch, PlayCircle, Globe, Calendar, User, Code2, ArrowBigUp, MessageSquare } from "lucide-react";
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
  upvote_count: number;
  comment_count: number;
  hasUpvoted: boolean;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    role: string;
  } | null;
};

interface ProjectsClientProps {
  initialProjects: Project[];
  isLoggedIn: boolean;
}

export default function ProjectsClient({ initialProjects, isLoggedIn }: ProjectsClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique technologies
  const allTags = Array.from(
    new Set(projects.flatMap((p) => p.technologies || []))
  ).sort();

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

  const filteredProjects = projects.filter((p) => {
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
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] pl-10 pr-4 py-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2 animate-fade-in">
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

      {filteredProjects.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {filteredProjects.map((p) => (
            <Link
              href={`/projects/${p.id}`}
              key={p.id}
              className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] overflow-hidden"
            >
              <div className="p-6 flex-1 flex flex-col justify-between">
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

                {p.technologies && p.technologies.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {p.technologies.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-500"
                      >
                        {tech}
                      </span>
                    ))}
                    {p.technologies.length > 4 && (
                      <span className="inline-flex items-center rounded bg-[var(--color-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
                        +{p.technologies.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="border-t border-[var(--color-border)] px-6 py-4 flex items-center justify-between bg-[var(--color-muted)]/5 group-hover:bg-[var(--color-muted)]/10 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white uppercase shadow-sm">
                    {(p.profiles?.first_name || "?").charAt(0)}
                  </div>
                  <div className="text-xs font-semibold text-[var(--color-foreground)]">
                    {p.profiles?.first_name} {p.profiles?.last_name}
                  </div>
                </div>

                {/* Oy & Yorum & Sosyal Medya İkonları */}
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

                  {/* Proje Linkleri */}
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
            </Link>
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
