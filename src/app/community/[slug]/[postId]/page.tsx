import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import PostDetailClient from "@/components/community/post-detail-client";
import CommentSection from "@/components/community/comment-section";
import LinkSafetyWarning from "@/components/community/LinkSafetyWarning";
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

  // Rol kontrolü yapalım
  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profile?.role || null;
  }

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

          {/* Post Detail Card (Client Component wrapper for interactive edits/deletes) */}
          <PostDetailClient
            post={{
              id: post.id,
              title: post.title,
              content: post.content || "",
              media_urls: post.media_urls,
              youtube_url: post.youtube_url,
              created_at: post.created_at,
              author_id: post.author_id,
              upvote_count: post.upvote_count || 0,
              subreddit_id: post.subreddit_id,
            }}
            profiles={post.profiles}
            subredditSlug={slug}
            currentUser={user ? { id: user.id, role: userRole } : null}
            userUpvoted={userUpvoted}
          />

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
            currentUser={user ? { id: user.id, role: userRole } : null}
          />
        </div>
      </main>

      {/* Dış Bağlantı Güvenlik Interceptor'ı */}
      <LinkSafetyWarning />
    </div>
  );
}
