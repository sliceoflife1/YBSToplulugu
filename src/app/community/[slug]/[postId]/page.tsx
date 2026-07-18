import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  ArrowLeft, 
  Clock, 
  Pin, 
  Download, 
  FileText, 
  FileArchive, 
  Paperclip,
  ExternalLink
} from "lucide-react";

export const dynamic = "force-dynamic";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import UpvoteButton from "@/components/community/upvote-button";
import CommentSection from "@/components/community/comment-section";
import LinkSafetyWarning from "@/components/community/LinkSafetyWarning";
import type { Post, Subreddit } from "@/types/database";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"];

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const adminSupabase = createAdminClient();
  const supabase = await createClient();

  // Subreddit ve Post bilgilerini çekelim
  const { data: subreddit } = await adminSupabase
    .from("subreddits")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single<Subreddit>();

  if (!subreddit) notFound();

  // Post bilgilerini çekerken profiles ilişkisini netleştirerek alalım
  const { data: post } = await adminSupabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url)")
    .eq("id", postId)
    .single<Post & { 
      media_urls: string[] | null; 
      youtube_url: string | null; 
      profiles: { id: string; first_name: string; last_name: string; avatar_url: string | null } 
    }>();

  if (!post) notFound();

  // Yorumları çekelim
  const { data: comments } = await adminSupabase
    .from("comments")
    .select("*, profiles!comments_author_id_fkey(id, first_name, last_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();

  // Beğeni durumunu kontrol et
  let userUpvoted = false;
  if (user) {
    const { data: upvote } = await adminSupabase
      .from("upvotes")
      .select("post_id")
      .eq("post_id", postId)
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

  // YouTube gömülü link üretici
  const getYoutubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };

  const youtubeEmbedUrl = getYoutubeEmbedUrl(post.youtube_url);

  // Dosya tipi belirleme ve ikon getirme
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
          {/* Back button */}
          <Link
            href={`/community/${slug}`}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-4 w-4" /> {subreddit.name} topluluğuna geri dön
          </Link>

          {/* Post Detail Card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-md">
            <div className="flex gap-4">
              {/* Upvote Button */}
              <div className="flex flex-col items-center">
                <UpvoteButton
                  postId={post.id}
                  initialCount={post.upvote_count}
                  initialUpvoted={userUpvoted}
                  isLoggedIn={!!user}
                />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 min-w-0">
                {/* Meta details */}
                <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                  {post.is_pinned && (
                    <span className="flex items-center gap-1 text-amber-500 font-medium animate-pulse">
                      <Pin className="h-3 w-3" /> Sabitlenmiş
                    </span>
                  )}
                  {/* User info */}
                  {post.profiles?.id ? (
                    <Link 
                      href={`/u/${post.profiles.id}`}
                      className="flex items-center gap-2 hover:text-indigo-500 transition-colors font-semibold text-[var(--color-foreground)] group"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[9px] font-bold text-[var(--color-primary)] shadow-sm">
                        {post.profiles.avatar_url ? (
                          <img
                            src={post.profiles.avatar_url}
                            alt={`${post.profiles.first_name}`}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          `${post.profiles.first_name.charAt(0).toUpperCase()}${post.profiles.last_name.charAt(0).toUpperCase()}`
                        )}
                      </div>
                      <span>
                        {post.profiles.first_name} {post.profiles.last_name}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[9px] font-bold text-[var(--color-primary)] shadow-sm">
                        ?
                      </div>
                      <span>Bilinmeyen Kullanıcı</span>
                    </div>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {timeAgo(post.created_at)}
                  </span>
                </div>

                {/* Title */}
                <h1 className="mt-3 text-xl font-bold text-[var(--color-foreground)] sm:text-2xl">
                  {post.title}
                </h1>

                {/* Body Content */}
                <div className="mt-4 border-t border-[var(--color-border)]/50 pt-4">
                  {post.content ? (
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-[var(--color-foreground)] break-words space-y-4"
                      dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                  ) : null}
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

                {/* Yüklenen Dosyalar & Görseller */}
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="mt-6 border-t border-[var(--color-border)]/50 pt-6 space-y-4">
                    {/* Görsel Galerisi */}
                    {post.media_urls.some(url => getFileDetails(url).isImg) && (
                      <div>
                        <h4 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-2.5">
                          Eklenen Görseller
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {post.media_urls
                            .filter(url => getFileDetails(url).isImg)
                            .map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] aspect-video block"
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

                    {/* Diğer Dosyalar (Döküman / Arşiv) */}
                    {post.media_urls.some(url => !getFileDetails(url).isImg) && (
                      <div>
                        <h4 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-2.5">
                          Ekli Dosyalar
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {post.media_urls
                            .filter(url => !getFileDetails(url).isImg)
                            .map((url, i) => {
                              const { filename, icon } = getFileDetails(url);
                              return (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] p-3 hover:bg-[var(--color-muted)]/30 hover:border-indigo-500/30 transition-all group"
                                >
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-muted)] group-hover:bg-indigo-500/10 shrink-0">
                                    {icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-[var(--color-foreground)] truncate group-hover:text-indigo-500">
                                      {filename}
                                    </p>
                                    <span className="text-[10px] text-[var(--color-muted-foreground)] flex items-center gap-1 mt-0.5">
                                      <Download className="h-3 w-3" /> İndir
                                    </span>
                                  </div>
                                </a>
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

          {/* Comment Section Component */}
          <CommentSection
            postId={post.id}
            slug={slug}
            initialComments={(comments || []).map((c: any) => ({
              id: c.id,
              post_id: c.post_id,
              author_id: c.author_id,
              parent_id: c.parent_id,
              content: c.content,
              created_at: c.created_at,
              profiles: c.profiles,
            }))}
            isLoggedIn={!!user}
            currentUser={user ? { id: user.id } : null}
          />
        </div>
      </main>

      {/* Dış Bağlantı Güvenlik Interceptor'ı */}
      <LinkSafetyWarning />
    </div>
  );
}
