import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MessageSquare, Users, TrendingUp, Plus } from "lucide-react";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import type { Subreddit } from "@/types/database";

export default async function CommunityPage() {
  const supabase = await createClient();
  const t = await getTranslations("community");

  const { data: subreddits } = await supabase
    .from("subreddits")
    .select("*")
    .eq("is_active", true)
    .order("post_count", { ascending: false });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
                {t("title")}
              </h1>
              <p className="mt-1 text-[var(--color-muted-foreground)]">
                Tartışmalara katıl, bilgi paylaş, toplulukla büyü
              </p>
            </div>
          </div>

          {/* Subreddits grid */}
          {subreddits && subreddits.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(subreddits as Subreddit[]).map((sub) => (
                <Link
                  key={sub.id}
                  href={`/community/${sub.slug}`}
                  className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
                      style={{ backgroundColor: sub.color }}
                    >
                      {sub.icon || sub.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                        {sub.name}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--color-muted-foreground)] line-clamp-2">
                        {sub.description}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-muted-foreground)]">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {sub.post_count} gönderi
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-[var(--color-muted-foreground)]" />
              <h3 className="mt-4 text-lg font-semibold text-[var(--color-foreground)]">
                Henüz forum oluşturulmamış
              </h3>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                Admin panelinden yeni forumlar oluşturulabilir.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
