import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Pin } from "lucide-react";

export const dynamic = "force-dynamic";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import UpvoteButton from "@/components/community/upvote-button";
import CommentSection from "@/components/community/comment-section";
import type { Post, Subreddit } from "@/types/database";

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
    .single<Post & { profiles: { id: string; first_name: string; last_name: string; avatar_url: string | null } }>();

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

  // Basit markdown render edici
  const renderFormattedContent = (content: string) => {
    if (!content) return null;

    // Paragraflara böl
    const paragraphs = content.split("\n");

    return paragraphs.map((paragraph, index) => {
      let html = paragraph;

      // Bold text **text** -> <strong>text</strong>
      html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

      // Italic text *text* -> <em>text</em>
      html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

      // Inline code `code` -> <code class="bg-muted px-1.5 py-0.5 rounded text-xs">code</code>
      html = html.replace(/`(.*?)`/g, '<code class="bg-[var(--color-muted)] px-1.5 py-0.5 rounded text-xs text-[var(--color-primary)] font-mono">$1</code>');

      // Headings (e.g. # Header -> h3, ## Header -> h4)
      if (paragraph.startsWith("### ")) {
        return (
          <h5 key={index} className="mt-4 mb-2 text-sm font-bold" dangerouslySetInnerHTML={{ __html: html.replace("### ", "") }} />
        );
      } else if (paragraph.startsWith("## ")) {
        return (
          <h4 key={index} className="mt-5 mb-2.5 text-base font-bold" dangerouslySetInnerHTML={{ __html: html.replace("## ", "") }} />
        );
      } else if (paragraph.startsWith("# ")) {
        return (
          <h3 key={index} className="mt-6 mb-3 text-lg font-bold" dangerouslySetInnerHTML={{ __html: html.replace("# ", "") }} />
        );
      }

      // Bullet lists
      if (paragraph.trim().startsWith("- ") || paragraph.trim().startsWith("* ")) {
        const itemText = paragraph.trim().replace(/^[-*]\s+/, "");
        return (
          <ul key={index} className="list-disc pl-5 my-1 text-sm text-[var(--color-foreground)]">
            <li dangerouslySetInnerHTML={{ __html: itemText }} />
          </ul>
        );
      }

      return (
        <p
          key={index}
          className="my-2.5 text-sm leading-relaxed text-[var(--color-foreground)]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]/30">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          {/* Back button */}
          <Link
            href={`/community/${slug}`}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-4 w-4" /> {subreddit.name} topluluğuna geri dön
          </Link>

          {/* Post Detail Card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
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
                    <span className="flex items-center gap-1 text-amber-500 font-medium">
                      <Pin className="h-3 w-3" /> Sabitlenmiş
                    </span>
                  )}
                  {/* User info */}
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[9px] font-bold text-[var(--color-primary)]">
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
                  <span className="font-medium text-[var(--color-foreground)]">
                    {post.profiles.first_name} {post.profiles.last_name}
                  </span>
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
                  {renderFormattedContent(post.content || "")}
                </div>
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
    </div>
  );
}
