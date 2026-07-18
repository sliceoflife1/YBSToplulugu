import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MessageSquare, Users, TrendingUp, Plus } from "lucide-react";

export const dynamic = "force-dynamic";
import { createAdminClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import type { Subreddit } from "@/types/database";

export default async function CommunityPage() {
  const adminSupabase = createAdminClient();
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

  // Gönderi sayılarını veritabanındaki posts tablosundan canlı olarak sayalım
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

/**
 * Veritabanında hiç aktif kategori bulunmadığında varsayılan kategorileri (auto-seed) ekleyen fonksiyon.
 * Admin client ile çalışır - RLS bypass eder.
 * Mevcut slug kayıtlarını kontrol eder, duplicate insert hatalarını önler.
 */
async function seedSubreddits() {
  const adminSupabase = createAdminClient();

  // Önce veritabanında herhangi bir subreddit var mı kontrol et (aktif veya inaktif fark etmeksizin)
  const { data: existingAll } = await adminSupabase
    .from("subreddits")
    .select("slug");
  
  const existingSlugs = new Set((existingAll || []).map((s: { slug: string }) => s.slug));

  // created_by için admin veya moderatör kullanıcısı bul, yoksa herhangi birini seç
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

  // Veritabanında hiç kullanıcı yoksa Foreign Key kısıtlaması nedeniyle seed yapamayız
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

  // Sadece henüz veritabanında bulunmayan slug'ları ekle
  const toInsert = allDefaults.filter(d => !existingSlugs.has(d.slug));

  if (toInsert.length === 0) {
    // Hepsi zaten mevcut ama inaktif olabilir — hepsini aktif yap
    await adminSupabase
      .from("subreddits")
      .update({ is_active: true })
      .in("slug", allDefaults.map(d => d.slug));

    // Güncellenmiş veriyi geri döndür
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
