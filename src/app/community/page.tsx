import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MessageSquare, Users, TrendingUp, Plus, Clock, Inbox, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import CommunitySearchHeader from "@/components/community/CommunitySearchHeader";
import UpvoteButton from "@/components/community/upvote-button";
import type { Subreddit } from "@/types/database";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { q = "", category = "", sort = "new" } = await searchParams;
  const adminSupabase = createAdminClient();
  const supabase = await createClient();
  const t = await getTranslations("community");

  // Admin client ile oku — RLS bypass edilerek tüm aktif subreddits alınır
  let { data: subreddits } = await adminSupabase
    .from("subreddits")
    .select("*")
    .eq("is_active", true);

  // Eğer veritabanında hiç aktif topluluk kategorisi yoksa otomatik oluştur (auto-seed)
  if (!subreddits || subreddits.length === 0) {
    const seeded = await seedSubreddits();
    if (seeded) {
      subreddits = seeded.filter((s: Subreddit) => s.is_active);
    }
  }

  const { data: { user } } = await supabase.auth.getUser();

  // Gönderi sayılarını veritabanındaki posts tablosundan canlı olarak sayalım (kategoriler için)
  const { data: postsCountData } = await adminSupabase
    .from("posts")
    .select("subreddit_id");

  const postCounts: Record<string, number> = {};
  if (postsCountData) {
    postsCountData.forEach((p) => {
      postCounts[p.subreddit_id] = (postCounts[p.subreddit_id] || 0) + 1;
    });
  }

  // Her subreddit'in post_count alanını dinamik sayıyla ezerek güncelleyelim
  if (subreddits) {
    subreddits = subreddits.map((sub) => ({
      ...sub,
      post_count: postCounts[sub.id] || 0,
    }));

    // Post sayısına göre azalan şekilde sırala
    subreddits.sort((a, b) => (b.post_count || 0) - (a.post_count || 0));
  }

  // ARAMA SORGUSU VARSA
  let searchPosts: any[] = [];
  let userUpvotes: string[] = [];

  if (q) {
    let queryBuilder = adminSupabase
      .from("posts")
      .select("*, profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url), subreddits!posts_subreddit_id_fkey(id, name, slug, color)");

    if (category) {
      queryBuilder = queryBuilder.eq("subreddit_id", category);
    }

    queryBuilder = queryBuilder.or(`title.ilike.%${q}%,content.ilike.%${q}%`);

    if (sort === "top") {
      queryBuilder = queryBuilder.order("upvote_count", { ascending: false });
    } else if (sort === "comments") {
      queryBuilder = queryBuilder.order("comment_count", { ascending: false });
    } else {
      queryBuilder = queryBuilder.order("created_at", { ascending: false });
    }

    const { data: searchResults } = await queryBuilder;
    searchPosts = searchResults || [];

    // Kullanıcının beğendiği post'ları al
    if (user) {
      const { data: upvoteData } = await adminSupabase
        .from("upvotes")
        .select("post_id")
        .eq("user_id", user.id);
      if (upvoteData) {
        userUpvotes = upvoteData.map((u) => u.post_id);
      }
    }
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
      <main className="flex-1 bg-[var(--color-muted)]/30 pb-16">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
                {t("title")}
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                Tartışmalara katıl, bilgi paylaş, toplulukla büyü
              </p>
            </div>
          </div>

          {/* Kapsamlı Arama Arayüzü */}
          <CommunitySearchHeader
            subreddits={(subreddits || []).map((s) => ({ id: s.id, name: s.name, slug: s.slug }))}
            initialQuery={q}
            initialCategory={category}
            initialSort={sort}
          />

          {/* SONUÇ GÖRÜNÜMÜ VEYA SEED LİSTESİ */}
          {q ? (
            // ARAMA SONUÇLARI
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <h2 className="text-lg font-bold text-[var(--color-foreground)]">
                  Arama Sonuçları ({searchPosts.length} gönderi)
                </h2>
                {category && (
                  <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full">
                    Kategori Filtresi Aktif
                  </span>
                )}
              </div>

              {searchPosts.length > 0 ? (
                <div className="grid gap-4">
                  {searchPosts.map((post) => (
                    <div
                      key={post.id}
                      className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex gap-4">
                        {/* Upvote Button */}
                        <div className="flex flex-col items-center">
                          <UpvoteButton
                            postId={post.id}
                            initialCount={post.upvote_count || 0}
                            initialUpvoted={userUpvotes.includes(post.id)}
                            isLoggedIn={!!user}
                          />
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                            {/* Subreddit badge */}
                            <Link 
                              href={`/community/${post.subreddits?.slug}`}
                              style={{ backgroundColor: `${post.subreddits?.color}15`, color: post.subreddits?.color }}
                              className="font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider"
                            >
                              {post.subreddits?.name}
                            </Link>
                            <span>•</span>
                            {/* Author */}
                            {post.profiles?.id ? (
                              <Link 
                                href={`/u/${post.profiles.id}`}
                                className="font-semibold text-[var(--color-foreground)] hover:text-indigo-500 transition-colors"
                              >
                                {post.profiles.first_name} {post.profiles.last_name}
                              </Link>
                            ) : (
                              <span>Bilinmeyen Kullanıcı</span>
                            )}
                            <span>•</span>
                            <span 
                              className="flex items-center gap-1 cursor-help"
                              title={new Date(post.created_at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'long', timeStyle: 'short' }) + ' (Türkiye Saati)'}
                            >
                              <Clock className="h-3.5 w-3.5" /> {timeAgo(post.created_at)}
                            </span>
                          </div>

                          {/* Title */}
                          <Link href={`/community/${post.subreddits?.slug}/${post.id}`}>
                            <h3 className="mt-2 font-semibold text-base text-[var(--color-foreground)] group-hover:text-indigo-500 transition-colors leading-tight">
                              {post.title}
                            </h3>
                          </Link>

                          {/* Content Snippet */}
                          {post.content && (
                            <p className="mt-1.5 text-sm text-[var(--color-muted-foreground)] line-clamp-2">
                              {post.content.replace(/<[^>]*>/g, "")}
                            </p>
                          )}

                          {/* Foot detail */}
                          <div className="mt-3.5 flex items-center gap-4 text-xs font-semibold text-[var(--color-muted-foreground)]">
                            <Link 
                              href={`/community/${post.subreddits?.slug}/${post.id}`}
                              className="flex items-center gap-1 hover:text-indigo-500 transition-colors"
                            >
                              <MessageSquare className="h-4 w-4" />
                              {post.comment_count || 0} yorum
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
                  <Inbox className="mx-auto h-12 w-12 text-[var(--color-muted-foreground)]" />
                  <h3 className="mt-4 text-lg font-semibold text-[var(--color-foreground)]">
                    Aramanızla eşleşen sonuç bulunamadı
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                    Farklı kelimeler aramayı veya kategori filtresini değiştirmeyi deneyebilirsiniz.
                  </p>
                </div>
              )}
            </div>
          ) : (
            // VARSAYILAN KATEGORİ LİSTESİ
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[var(--color-foreground)] border-b border-[var(--color-border)] pb-3">
                Kategoriler
              </h2>
              {subreddits && subreddits.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
                  {(subreddits as Subreddit[]).map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/community/${sub.slug}`}
                      className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white shrink-0"
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
                            <span className="flex items-center gap-1 font-semibold">
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
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Veritabanında hiç kategori yoksa seed ekleyen fonksiyon.
 */
async function seedSubreddits() {
  const adminSupabase = createAdminClient();

  const { data: existingAll } = await adminSupabase
    .from("subreddits")
    .select("slug");
  
  const existingSlugs = new Set((existingAll || []).map((s: { slug: string }) => s.slug));

  const { data: adminUser } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  let creatorId = adminUser?.id;

  if (!creatorId) {
    const { data: moderatorUser } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("role", "moderator")
      .limit(1)
      .maybeSingle();
    creatorId = moderatorUser?.id;
  }

  if (!creatorId) {
    const { data: anyUser } = await adminSupabase
      .from("profiles")
      .select("id")
      .limit(1)
      .maybeSingle();
    creatorId = anyUser?.id;
  }

  if (!creatorId) return null;

  const allDefaults = [
    {
      name: "Ders Notları",
      slug: "ders-notlari",
      description: "Ders özetleri, sınav soruları, çalışma kağıtları ve akademik paylaşımlar.",
      icon: "📝",
      color: "#3B82F6",
      created_by: creatorId,
      is_active: true
    },
    {
      name: "YBS Projeleri",
      slug: "ybs-projeler",
      description: "Öğrencilerin geliştirdiği yazılım, veri analitiği, iş analizi projeleri ve sunumları.",
      icon: "🚀",
      color: "#10B981",
      created_by: creatorId,
      is_active: true
    },
    {
      name: "Staj ve Kariyer",
      slug: "staj-ve-kariyer",
      description: "Staj deneyimleri, iş ilanları, mülakat hazırlıkları ve kariyer fırsatları.",
      icon: "💼",
      color: "#F59E0B",
      created_by: creatorId,
      is_active: true
    },
    {
      name: "Yazılım & Teknoloji",
      slug: "yazilim-ve-teknoloji",
      description: "Web/mobil geliştirme, yapay zeka, veri bilimi tartışmaları ve kaynak paylaşımları.",
      icon: "💻",
      color: "#8B5CF6",
      created_by: creatorId,
      is_active: true
    },
    {
      name: "Haberler & Etkinlikler",
      slug: "haberler-ve-etkinlikler",
      description: "Bölüm duyuruları, topluluk zirveleri, seminerler ve resmi haberler.",
      icon: "📢",
      color: "#06B6D4",
      created_by: creatorId,
      is_active: true
    },
    {
      name: "Soru-Cevap & Teknik Destek",
      slug: "soru-cevap",
      description: "Derslerde, projelerde veya teknik konularda takıldığınız yerlerde yardımlaşma.",
      icon: "❓",
      color: "#EF4444",
      created_by: creatorId,
      is_active: true
    },
    {
      name: "Sosyal & Sohbet",
      slug: "sosyal-ve-sohbet",
      description: "Ders dışı konular, tanışma, kahve sohbetleri ve serbest kürsü.",
      icon: "☕",
      color: "#EC4899",
      created_by: creatorId,
      is_active: true
    },
    {
      name: "Mezunlar Köşesi",
      slug: "mezunlar-kosesi",
      description: "Mezunlarımızın sektörel deneyimleri, tavsiyeleri ve mezun-öğrenci köprüsü.",
      icon: "🎓",
      color: "#6366F1",
      created_by: creatorId,
      is_active: true
    }
  ];

  const toInsert = allDefaults.filter(d => !existingSlugs.has(d.slug));

  if (toInsert.length === 0) {
    await adminSupabase
      .from("subreddits")
      .update({ is_active: true })
      .in("slug", allDefaults.map(d => d.slug));

    const { data: updated } = await adminSupabase
      .from("subreddits")
      .select("*")
      .eq("is_active", true)
      .order("post_count", { ascending: false });

    return updated as Subreddit[] | null;
  }

  const { data: inserted, error } = await adminSupabase
    .from("subreddits")
    .insert(toInsert)
    .select();

  if (error) {
    console.error("Subreddits seed error:", error);
    return null;
  }

  return inserted as Subreddit[] | null;
}
