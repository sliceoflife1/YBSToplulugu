import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  Clock, 
  Download, 
  FileText, 
  FileArchive, 
  Paperclip,
  ExternalLink,
  GitBranch,
  PlayCircle,
  Globe
} from "lucide-react";

export const dynamic = "force-dynamic";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import ProjectUpvoteButton from "@/components/projects/project-upvote-button";
import ProjectCommentSection from "@/components/projects/project-comment-section";
import LinkSafetyWarning from "@/components/community/LinkSafetyWarning";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"];

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminSupabase = createAdminClient();
  const supabase = await createClient();

  // Fetch Project details
  const { data: project } = await adminSupabase
    .from("projects")
    .select("*, profiles!projects_user_id_fkey(id, first_name, last_name, avatar_url, role)")
    .eq("id", id)
    .single<any>();

  if (!project) notFound();

  // Fetch comments of this project
  const { data: comments } = await adminSupabase
    .from("project_comments")
    .select("*, profiles!project_comments_author_id_fkey(id, first_name, last_name, avatar_url)")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();

  // Check upvote state for logged in user
  let userUpvoted = false;
  if (user) {
    const { data: upvote } = await adminSupabase
      .from("project_upvotes")
      .select("project_id")
      .eq("project_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    userUpvoted = !!upvote;
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "az önce";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}dk`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}sa`;
    return `${Math.floor(seconds / 86400)}g`;
  };

  // YouTube embed parser
  const getYoutubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };

  const youtubeEmbedUrl = getYoutubeEmbedUrl(project.youtube_url);

  // File styling details helper
  const getFileDetails = (url: string) => {
    try {
      const decodedUrl = decodeURIComponent(url);
      const filename = decodedUrl.substring(decodedUrl.lastIndexOf("/") + 1).split("?")[0];
      const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
      
      const isImg = IMAGE_EXTENSIONS.includes(ext);
      
      let icon = <FileText className="h-4 w-4 text-indigo-500" />;
      if ([".zip", ".rar"].includes(ext)) {
        icon = <FileArchive className="h-4 w-4 text-amber-500" />;
      } else if (isImg) {
        icon = <ImageIcon className="h-4 w-4 text-emerald-500" />;
      }
      
      return { filename, isImg, icon };
    } catch {
      return { filename: "dosya-eki", isImg: false, icon: <Paperclip className="h-4 w-4" /> };
    }
  };

  const ImageIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
    </svg>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]/30">
      <Navbar />
      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 animate-fade-in">
          {/* Geri Dön */}
          <Link
            href="/projects"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-4 w-4" /> Projelere geri dön
          </Link>

          {/* Proje Detay Kartı */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-md">
            <div className="flex gap-4">
              {/* Oylama Butonu */}
              <div className="flex flex-col items-center">
                <ProjectUpvoteButton
                  projectId={project.id}
                  initialCount={project.upvote_count || 0}
                  initialUpvoted={userUpvoted}
                  isLoggedIn={!!user}
                />
              </div>

              {/* İçerik Alanı */}
              <div className="flex-1 min-w-0">
                {/* Meta Detaylar */}
                <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                  {project.profiles?.id ? (
                    <Link 
                      href={`/u/${project.profiles.id}`}
                      className="flex items-center gap-2 hover:text-indigo-500 transition-colors font-semibold text-[var(--color-foreground)] group"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white uppercase shadow-sm">
                        {(project.profiles?.first_name || "?").charAt(0)}
                      </div>
                      <span>
                        {project.profiles?.first_name} {project.profiles?.last_name}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white uppercase shadow-sm">
                        ?
                      </div>
                      <span>Bilinmeyen Kullanıcı</span>
                    </div>
                  )}
                  <span>•</span>
                  <span>
                    {project.semester === "fall" ? "Güz" : project.semester === "spring" ? "Bahar" : "Yaz"} {project.year}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {timeAgo(project.created_at)}
                  </span>
                </div>

                {/* Başlık */}
                <h1 className="mt-3 text-xl font-bold text-[var(--color-foreground)] sm:text-2xl leading-tight">
                  {project.title}
                </h1>

                {/* Teknolojiler */}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {project.technologies.map((tech: string) => (
                      <span
                        key={tech}
                        className="inline-flex items-center rounded bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-500"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {/* Açıklama */}
                <div className="mt-5 border-t border-[var(--color-border)]/50 pt-5">
                  {project.description ? (
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-[var(--color-foreground)] break-words space-y-4"
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                  ) : null}
                </div>

                {/* Proje Sosyal Medya & Harici Bağlantılar */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {project.github_url && (
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-xs font-semibold hover:bg-[var(--color-muted)] transition-colors"
                    >
                      <GitBranch className="h-4 w-4 text-indigo-500" />
                      GitHub Deposu
                    </a>
                  )}
                  {project.behance_url && (
                    <a
                      href={project.behance_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-xs font-semibold hover:bg-[var(--color-muted)] transition-colors"
                    >
                      <Globe className="h-4 w-4 text-blue-500" />
                      Behance Sayfası
                    </a>
                  )}
                  {project.external_url && (
                    <a
                      href={project.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-xs font-semibold hover:bg-[var(--color-muted)] transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-emerald-500" />
                      Canlı Demo (Website)
                    </a>
                  )}
                </div>

                {/* Gömülü YouTube Videosu */}
                {youtubeEmbedUrl && (
                  <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black shadow-lg aspect-video">
                    <iframe
                      src={youtubeEmbedUrl}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                )}

                {/* Yüklenen Resimler & Dosyalar */}
                {project.media_urls && project.media_urls.length > 0 && (
                  <div className="mt-6 border-t border-[var(--color-border)]/50 pt-6 space-y-4">
                    {/* Resim Galerisi */}
                    {project.media_urls.some((url: string) => getFileDetails(url).isImg) && (
                      <div>
                        <h4 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-2.5">
                          Eklenen Görseller
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {project.media_urls
                            .filter((url: string) => getFileDetails(url).isImg)
                            .map((url: string, i: number) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] aspect-video block shadow-sm"
                              >
                                <img
                                  src={url}
                                  alt="Yüklenen görsel"
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                  <ExternalLink className="h-6 w-6 text-white" />
                                </div>
                              </a>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Diğer Dosyalar Listesi */}
                    {project.media_urls.some((url: string) => !getFileDetails(url).isImg) && (
                      <div className="border-t border-[var(--color-border)]/50 pt-4">
                        <h4 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-2">
                          Dosya Ekleri
                        </h4>
                        <div className="space-y-2">
                          {project.media_urls
                            .filter((url: string) => !getFileDetails(url).isImg)
                            .map((url: string, i: number) => {
                              const { filename, icon } = getFileDetails(url);
                              return (
                                <div
                                  key={i}
                                  className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3 text-xs bg-[var(--color-card)]"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {icon}
                                    <span className="font-medium text-[var(--color-foreground)] truncate max-w-[200px] sm:max-w-[400px]">
                                      {filename}
                                    </span>
                                  </div>
                                  <a
                                    href={url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-semibold text-indigo-500 hover:underline shrink-0 pl-2"
                                  >
                                    <Download className="h-3.5 w-3.5" /> İndir
                                  </a>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Yorumlar Bölümü */}
          <ProjectCommentSection
            projectId={project.id}
            initialComments={comments || []}
            isLoggedIn={!!user}
          />
        </div>
      </main>

      {/* Dış Bağlantı Güvenlik Modal'ı */}
      <LinkSafetyWarning />
    </div>
  );
}
