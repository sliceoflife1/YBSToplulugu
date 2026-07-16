import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowBigUp, MessageSquare, Clock, Plus, Pin } from "lucide-react";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import UpvoteButton from "@/components/community/upvote-button";
import type { Post, Subreddit } from "@/types/database";

export default async function SubredditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: subreddit } = await supabase
    .from("subreddits")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single<Subreddit>();

  if (!subreddit) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles(id, first_name, last_name, avatar_url)")
    .eq("subreddit_id", subreddit.id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();

  // Check upvotes for current user
  let userUpvotes: string[] = [];
  if (user && posts) {
    const postIds = posts.map((p: Post) => p.id);
    const { data: upvotes } = await supabase
      .from("upvotes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds);
    userUpvotes = (upvotes || []).map((u: { post_id: string }) => u.post_id);
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "az önce";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}dk`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}sa`;
    return `${Math.floor(seconds / 86400)}g`;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          {/* Subreddit Header */}
          <div className="mb-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white"
                style={{ backgroundColor: subreddit.color }}
              >
                {subreddit.icon || subreddit.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-[var(--color-foreground)]">
                  {subreddit.name}
                </h1>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {subreddit.description}
                </p>
              </div>
              {user && (
                <Link
                  href={`/community/${slug}/new`}
                  className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  <Plus className="h-4 w-4" /> Gönderi
                </Link>
              )}
            </div>
          </div>

          {/* Posts */}
          {posts && posts.length > 0 ? (
            <div className="space-y-3">
              {(posts as (Post & { profiles: { id: string; first_name: string; last_name: string; avatar_url: string | null } })[]).map((post) => (
                <div
                  key={post.id}
                  className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex gap-3">
                    {/* Upvote */}
                    <div className="flex flex-col items-center gap-1">
                      <UpvoteButton
                        postId={post.id}
                        initialCount={post.upvote_count}
                        initialUpvoted={userUpvotes.includes(post.id)}
                        isLoggedIn={!!user}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                        {post.is_pinned && (
                          <span className="flex items-center gap-1 text-amber-500 font-medium">
                            <Pin className="h-3 w-3" /> Sabitlenmiş
                          </span>
                        )}
                        <span>{post.profiles.first_name} {post.profiles.last_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {timeAgo(post.created_at)}
                        </span>
                      </div>
                      <Link href={`/community/${slug}/${post.id}`}>
                        <h3 className="mt-1 font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                          {post.title}
                        </h3>
                      </Link>
                      {post.content && (
                        <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)] line-clamp-2">
                          {post.content}
                        </p>
                      )}
                      <Link
                        href={`/community/${slug}/${post.id}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {post.comment_count} yorum
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)]" />
              <h3 className="mt-3 font-medium">Henüz gönderi yok</h3>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">İlk gönderiyi sen paylaş!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
