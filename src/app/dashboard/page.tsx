import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  FolderKanban,
  FileText,
  MessageSquare,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Star,
  Calendar,
  Megaphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import type { Profile } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const t = await getTranslations();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  // Fetch stats & announcements
  const [projectsRes, postsRes, announcementsRes] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact" }).eq("user_id", user.id),
    supabase.from("posts").select("id", { count: "exact" }).eq("author_id", user.id),
    supabase.from("announcements").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
  ]);

  const projectCount = projectsRes.count || 0;
  const postCount = postsRes.count || 0;
  const announcements = announcementsRes?.data || [];

  const quickActions = [
    {
      href: "/projects/new",
      icon: FolderKanban,
      title: "Proje Ekle",
      description: "Yeni bir proje paylaş",
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      href: "/cv",
      icon: FileText,
      title: "CV Düzenle",
      description: "CV bilgilerini güncelle",
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      href: "/community",
      icon: MessageSquare,
      title: "Forum",
      description: "Tartışmalara katıl",
      color: "bg-orange-500/10 text-orange-600",
    },
    {
      href: "/explore",
      icon: Users,
      title: "Keşfet",
      description: "Öğrencileri bul",
      color: "bg-pink-500/10 text-pink-600",
    },
  ];

  const isProfileIncomplete = !profile?.first_name || !profile?.department;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Welcome section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
              Merhaba, {profile?.first_name || "Kullanıcı"} 👋
            </h1>
            <p className="mt-1 text-[var(--color-muted-foreground)]">
              YBS Topluluğu paneline hoş geldin
            </p>
          </div>

          {/* Profile completion banner */}
          {isProfileIncomplete && (
            <div className="mb-6 animate-fade-in rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-amber-500" />
                <div className="flex-1">
                  <p className="font-medium text-[var(--color-foreground)]">
                    Profilini tamamla!
                  </p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    İsim, bölüm ve diğer bilgilerini ekleyerek profilini oluştur.
                  </p>
                </div>
                <Link
                  href="/profile/edit"
                  className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
                >
                  Tamamla
                </Link>
              </div>
            </div>
          )}

          {/* Stats cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2.5">
                  <FolderKanban className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--color-foreground)]">
                    {projectCount}
                  </p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">Proje</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-orange-500/10 p-2.5">
                  <MessageSquare className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--color-foreground)]">
                    {postCount}
                  </p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">Gönderi</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2.5">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--color-foreground)]">
                    {profile?.karma_points || 0}
                  </p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">Karma</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-pink-500/10 p-2.5">
                  <FileText className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--color-foreground)]">
                    {profile?.is_cv_public ? "Açık" : "Gizli"}
                  </p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">CV Durumu</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
              Hızlı Erişim
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className={`rounded-lg p-2.5 ${action.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-[var(--color-foreground)]">
                        {action.title}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--color-muted-foreground)] transition-transform group-hover:translate-x-1" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Duyuru ve Etkinlikler Bölümü */}
          {announcements.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-[var(--color-primary)]" />
                {t("dashboard.announcementsTitle")}
              </h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                {announcements.map((ann: any) => (
                  <Link
                    key={ann.id}
                    href={`/announcements/${ann.id}`}
                    className="flex flex-col sm:flex-row overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 group"
                  >
                    {/* Görsel */}
                    {ann.image_url ? (
                      <div className="relative aspect-video sm:aspect-square sm:w-32 shrink-0 bg-[var(--color-muted)]">
                        <img
                          src={ann.image_url}
                          alt={ann.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video sm:aspect-square sm:w-32 shrink-0 items-center justify-center bg-gradient-to-br from-indigo-500/5 to-purple-500/10 border-r border-[var(--color-border)]">
                        <Megaphone className="h-8 w-8 text-[var(--color-primary)] opacity-30" />
                      </div>
                    )}

                    {/* İçerik */}
                    <div className="flex flex-1 flex-col p-4 justify-between min-w-0">
                      <div>
                        <h3 className="font-bold text-sm text-[var(--color-foreground)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                          {ann.title}
                        </h3>
                        <p className="mt-1 text-xs text-[var(--color-muted-foreground)] line-clamp-2 whitespace-pre-wrap">
                          {ann.content}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between flex-wrap gap-2 text-[10px] text-[var(--color-muted-foreground)]">
                        {ann.event_date ? (
                          <span className="flex items-center gap-1 text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(ann.event_date).toLocaleDateString("tr-TR")}
                          </span>
                        ) : (
                          <span />
                        )}

                        <span
                          className="inline-flex items-center gap-1 rounded bg-[var(--color-primary)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)] group-hover:bg-[var(--color-primary)]/20 transition-colors"
                        >
                          Detaylar
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
