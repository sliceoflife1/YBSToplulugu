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
  Briefcase,
  Trophy,
  Award,
  Sparkles,
  ExternalLink,
  Clock,
  Building2,
  Tag,
  ChevronRight,
  Flame,
  UserCheck,
  CheckCircle2,
  Crown
} from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import type { Profile, JobListing } from "@/types/database";
import { SAMPLE_JOB_LISTINGS } from "@/constants/sample-jobs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatTimeAgo(dateString?: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "az önce";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} sa önce`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} gün önce`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} ay önce`;
  return `${Math.floor(diffInDays / 365)} yıl önce`;
}

function getRoleBadge(role?: string) {
  switch (role) {
    case "student":
      return { label: "Öğrenci", cls: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800" };
    case "alumni":
      return { label: "Mezun", cls: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" };
    case "faculty":
      return { label: "Akademisyen", cls: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-800" };
    case "employer":
      return { label: "İşveren", cls: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-800" };
    case "admin":
      return { label: "Admin", cls: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-800" };
    default:
      return { label: "Üye", cls: "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border-slate-200 dark:border-slate-800" };
  }
}

function getEmploymentTypeBadge(type?: string) {
  switch (type) {
    case "internship":
      return { label: "Staj Duyurusu", cls: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-300/40" };
    case "full_time":
      return { label: "Tam Zamanlı", cls: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-300/40" };
    case "part_time":
      return { label: "Yarı Zamanlı", cls: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300/40" };
    default:
      return { label: "İş İlanı", cls: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-300/40" };
  }
}

function getWorkModeBadge(mode?: string) {
  switch (mode) {
    case "remote":
      return { label: "Uzaktan", cls: "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300" };
    case "hybrid":
      return { label: "Hibrit", cls: "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300" };
    case "onsite":
      return { label: "Ofiste", cls: "bg-orange-500/10 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300" };
    default:
      return { label: mode || "Genel", cls: "bg-slate-500/10 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300" };
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();
  const t = await getTranslations();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  // Fetch all dynamic data in parallel
  const [
    projectsRes,
    postsRes,
    announcementsRes,
    jobListingsRes,
    latestPostsRes,
    topKarmaPostsRes,
    topKarmaUsersRes,
    profilesWithProjectsRes,
    opportunitiesRes,
  ] = await Promise.all([
    // 0. User stats
    adminSupabase.from("projects").select("id", { count: "exact" }).eq("user_id", user.id),
    adminSupabase.from("posts").select("id", { count: "exact" }).eq("author_id", user.id),
    // 1. Announcements
    adminSupabase.from("announcements").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
    // 2. Employers Job & Internship listings
    adminSupabase.from("job_listings").select("*, profiles!employer_id(first_name, last_name, avatar_url, role), organizations(name, logo_url, website_url)").eq("is_active", true).order("created_at", { ascending: false }).limit(6),
    // 3. Community latest 10 posts
    adminSupabase.from("posts").select("*, profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url, role), subreddits!posts_subreddit_id_fkey(id, name, slug, color)").order("created_at", { ascending: false }).limit(10),
    // 4. Community top 5 posts by karma (upvote_count)
    adminSupabase.from("posts").select("*, profiles!posts_author_id_fkey(id, first_name, last_name, avatar_url, role), subreddits!posts_subreddit_id_fkey(id, name, slug, color)").order("upvote_count", { ascending: false }).limit(5),
    // 5. Top 5 users by karma points
    adminSupabase.from("profiles").select("id, first_name, last_name, avatar_url, role, karma_points, department, headline").eq("is_active", true).order("karma_points", { ascending: false }).limit(5),
    // 6. Profiles with projects to calculate top project creators
    adminSupabase.from("profiles").select("id, first_name, last_name, avatar_url, role, department, headline, karma_points, projects(id)").eq("is_active", true),
    // 7. Latest 5 opportunities
    adminSupabase.from("opportunities").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
  ]);

  const projectCount = projectsRes.count || 0;
  const postCount = postsRes.count || 0;
  const announcements = announcementsRes?.data || [];

  // Job listings (fallback to sample if DB is empty)
  const jobListings: JobListing[] = (jobListingsRes.data && jobListingsRes.data.length > 0)
    ? (jobListingsRes.data as JobListing[])
    : SAMPLE_JOB_LISTINGS.slice(0, 6);

  const latestPosts = latestPostsRes.data || [];
  const topKarmaPosts = topKarmaPostsRes.data || [];
  const topKarmaUsers = topKarmaUsersRes.data || [];
  const opportunities = opportunitiesRes.data || [];

  // Top 5 users with most shared projects
  const topProjectUsers = (profilesWithProjectsRes.data || [])
    .map((p: any) => ({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      avatar_url: p.avatar_url,
      role: p.role,
      department: p.department,
      headline: p.headline,
      karma_points: p.karma_points,
      project_count: Array.isArray(p.projects) ? p.projects.length : 0,
    }))
    .filter((p: any) => p.project_count > 0)
    .sort((a: any, b: any) => b.project_count - a.project_count)
    .slice(0, 5);

  const quickActions = [
    {
      href: "/projects/new",
      icon: FolderKanban,
      title: "Proje Ekle",
      description: "Yeni bir proje paylaş",
      color: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    },
    {
      href: "/cv",
      icon: FileText,
      title: "CV Düzenle",
      description: "CV bilgilerini güncelle",
      color: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
    },
    {
      href: "/community",
      icon: MessageSquare,
      title: "Forum",
      description: "Tartışmalara katıl",
      color: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
    },
    {
      href: "/jobs",
      icon: Briefcase,
      title: "İş & Staj",
      description: "İlanları incele",
      color: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
    },
    {
      href: "/opportunities",
      icon: Sparkles,
      title: "Fırsatlar",
      description: "Öğrenci avantajları",
      color: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
    },
    {
      href: "/explore",
      icon: Users,
      title: "Keşfet",
      description: "Öğrencileri bul",
      color: "bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400",
    },
  ];

  const isProfileIncomplete = !profile?.first_name || !profile?.department;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30 pb-16">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Welcome section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
              Merhaba, {profile?.first_name || "Kullanıcı"} 👋
            </h1>
            <p className="mt-1 text-[var(--color-muted-foreground)]">
              YBS Topluluğu paneline hoş geldin. Topluluktaki en son iş ilanları, tartışmalar, liderlik sıralamaları ve fırsatlar aşağıda seni bekliyor.
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
                  <p className="text-sm text-[var(--color-muted-foreground)]">Projem</p>
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
                  <p className="text-sm text-[var(--color-muted-foreground)]">Gönderim</p>
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
                  <p className="text-sm text-[var(--color-muted-foreground)]">Karma Puanım</p>
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
          <div className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
              Hızlı Erişim
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3.5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className={`rounded-lg p-2 shrink-0 ${action.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[var(--color-foreground)] truncate">
                        {action.title}
                      </p>
                      <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--color-muted-foreground)] transition-transform group-hover:translate-x-1 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* SECTION 1: İŞ VERENLER TARAFINDAN OLUŞTURULAN YENİ İŞ VE STAJ İLANLARI */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-600" />
                  Yeni İş İlanları ve Staj Duyuruları
                </h2>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                  İş verenler tarafından yayınlanan en güncel kariyer fırsatları
                </p>
              </div>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Tüm İlanları Gör
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobListings.map((job) => {
                const empBadge = getEmploymentTypeBadge(job.employment_type);
                const modeBadge = getWorkModeBadge(job.work_mode);
                const companyName = job.organizations?.name || (job.profiles ? `${job.profiles.first_name} ${job.profiles.last_name}` : "İşveren");

                return (
                  <Link
                    key={job.id}
                    href={`/jobs`}
                    className="group flex flex-col justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 border-l-4 border-l-indigo-500"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {job.organizations?.logo_url ? (
                            <img
                              src={job.organizations.logo_url}
                              alt={companyName}
                              className="h-9 w-9 rounded-lg object-cover border border-[var(--color-border)] shrink-0"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 font-bold text-xs shrink-0">
                              <Building2 className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[var(--color-muted-foreground)] truncate">
                              {companyName}
                            </p>
                            <h3 className="font-semibold text-sm text-[var(--color-foreground)] line-clamp-1 group-hover:text-indigo-600 transition-colors">
                              {job.title}
                            </h3>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border ${empBadge.cls}`}>
                          {empBadge.label}
                        </span>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${modeBadge.cls}`}>
                          {modeBadge.label}
                        </span>
                        {job.location && (
                          <span className="inline-flex items-center rounded-md bg-[var(--color-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-muted-foreground)]">
                            {job.location}
                          </span>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2 mb-4">
                          {job.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)] text-[11px] text-[var(--color-muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(job.created_at)}
                      </span>
                      <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        İncele
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: TOPLULUK GÖNDERİLERİ (SON 10 GÖNDERİ & EN ÇOK KARMA ALAN 5 GÖNDERİ) */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-orange-600" />
                  Topluluk Tartışmaları & Forum
                </h2>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                  Öğrenci ve mezunlarımızın paylaştığı son konular ve en çok beğenilen gönderiler
                </p>
              </div>
              <Link
                href="/community"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                Foruma Git
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
              {/* Son Yayınlanan 10 Gönderi (7 Kolon) */}
              <div className="lg:col-span-7 flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)] pb-3">
                  <h3 className="font-semibold text-sm text-[var(--color-foreground)] flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    Son Yayınlanan 10 Gönderi
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-orange-500/10 text-orange-600">
                    Canlı Akış
                  </span>
                </div>

                {latestPosts.length > 0 ? (
                  <div className="divide-y divide-[var(--color-border)] flex-1">
                    {latestPosts.map((post: any) => {
                      const authorName = post.profiles ? `${post.profiles.first_name} ${post.profiles.last_name}` : "Anonim";
                      const roleBadge = getRoleBadge(post.profiles?.role);

                      return (
                        <Link
                          key={post.id}
                          href={`/community`}
                          className="group flex items-start gap-3 py-3 hover:bg-[var(--color-muted)]/50 px-2 rounded-lg transition-colors"
                        >
                          {/* Subreddit or Upvote count indicator */}
                          <div className="flex flex-col items-center justify-center min-w-10 rounded-lg bg-[var(--color-muted)] p-1.5 shrink-0">
                            <Flame className="h-3.5 w-3.5 text-orange-500" />
                            <span className="text-[11px] font-bold text-[var(--color-foreground)] mt-0.5">
                              {post.upvote_count || 0}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {post.subreddits && (
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{
                                    backgroundColor: `${post.subreddits.color || "#f97316"}20`,
                                    color: post.subreddits.color || "#f97316",
                                  }}
                                >
                                  r/{post.subreddits.name}
                                </span>
                              )}
                              <span className="text-[11px] text-[var(--color-muted-foreground)] truncate">
                                {authorName}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded border ${roleBadge.cls}`}>
                                {roleBadge.label}
                              </span>
                            </div>

                            <h4 className="font-semibold text-xs text-[var(--color-foreground)] group-hover:text-orange-600 transition-colors line-clamp-1">
                              {post.title}
                            </h4>

                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--color-muted-foreground)]">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(post.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {post.comment_count || 0} Yorum
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <MessageSquare className="h-8 w-8 text-[var(--color-muted-foreground)] opacity-40 mb-2" />
                    <p className="text-xs text-[var(--color-muted-foreground)]">Henüz topluluk gönderisi yayınlanmadı.</p>
                  </div>
                )}
              </div>

              {/* En Çok Karma Puan Alan 5 Gönderi (5 Kolon) */}
              <div className="lg:col-span-5 flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)] pb-3">
                  <h3 className="font-semibold text-sm text-[var(--color-foreground)] flex items-center gap-2">
                    <Flame className="h-4 w-4 text-amber-500" />
                    En Çok Beğenilen 5 Gönderi
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600">
                    Trendler
                  </span>
                </div>

                {topKarmaPosts.length > 0 ? (
                  <div className="space-y-3 flex-1">
                    {topKarmaPosts.map((post: any, index: number) => {
                      const authorName = post.profiles ? `${post.profiles.first_name} ${post.profiles.last_name}` : "Anonim";

                      return (
                        <Link
                          key={post.id}
                          href={`/community`}
                          className="group flex items-start gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 hover:bg-[var(--color-card)] hover:shadow-md transition-all"
                        >
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold text-xs shrink-0 ${
                            index === 0 ? "bg-amber-500 text-white shadow-sm" : index === 1 ? "bg-slate-300 text-slate-800" : index === 2 ? "bg-amber-700 text-white" : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                          }`}>
                            {index + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-xs text-[var(--color-foreground)] group-hover:text-amber-600 transition-colors line-clamp-2">
                              {post.title}
                            </h4>

                            <div className="flex items-center justify-between mt-2 text-[11px] text-[var(--color-muted-foreground)]">
                              <span className="truncate">{authorName}</span>
                              <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
                                <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
                                {post.upvote_count || 0} Karma
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Flame className="h-8 w-8 text-[var(--color-muted-foreground)] opacity-40 mb-2" />
                    <p className="text-xs text-[var(--color-muted-foreground)]">Henüz oy alan gönderi bulunmuyor.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: LİDERLİK TABLOSU (EN YÜKSEK KARMA 5 KULLANICI & EN FAZLA PROJE 5 KULLANICI) */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Topluluk Liderlik Tablosu
                </h2>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                  En çok katkıda bulunan ve öne çıkan kullanıcı hesapları
                </p>
              </div>
              <Link
                href="/explore"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
              >
                Tüm Üyeleri Keşfet
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* En Yüksek Karma Puana Sahip 5 Kullanıcı */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)] pb-3">
                  <h3 className="font-semibold text-sm text-[var(--color-foreground)] flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    En Yüksek Karma Puanlı 5 Kullanıcı
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600">
                    Karma Liderleri
                  </span>
                </div>

                {topKarmaUsers.length > 0 ? (
                  <div className="divide-y divide-[var(--color-border)]">
                    {topKarmaUsers.map((userItem: any, index: number) => {
                      const roleBadge = getRoleBadge(userItem.role);
                      const fullName = `${userItem.first_name} ${userItem.last_name}`;

                      return (
                        <Link
                          key={userItem.id}
                          href={`/u/${userItem.id}`}
                          className="group flex items-center gap-3 py-3 hover:bg-[var(--color-muted)]/50 px-2 rounded-lg transition-colors"
                        >
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs shrink-0 ${
                            index === 0 ? "bg-amber-400 text-amber-950 shadow-md" : index === 1 ? "bg-slate-300 text-slate-900" : index === 2 ? "bg-amber-700 text-white" : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                          }`}>
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                          </div>

                          {userItem.avatar_url ? (
                            <img
                              src={userItem.avatar_url}
                              alt={fullName}
                              className="h-9 w-9 rounded-full object-cover border border-[var(--color-border)] shrink-0"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 font-bold text-xs shrink-0">
                              {userItem.first_name?.[0]}{userItem.last_name?.[0]}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-xs text-[var(--color-foreground)] truncate group-hover:text-amber-600 transition-colors">
                                {fullName}
                              </p>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded border ${roleBadge.cls}`}>
                                {roleBadge.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">
                              {userItem.department || userItem.headline || "YBS Topluluğu Üyesi"}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 font-bold text-xs text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full shrink-0">
                            <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
                            {userItem.karma_points || 0}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[var(--color-muted-foreground)]">
                    Kullanıcı verisi henüz bulunamadı.
                  </div>
                )}
              </div>

              {/* En Fazla Proje Paylaşan 5 Kullanıcı */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)] pb-3">
                  <h3 className="font-semibold text-sm text-[var(--color-foreground)] flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-blue-500" />
                    En Fazla Proje Paylaşan 5 Kullanıcı
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600">
                    Proje Üreticileri
                  </span>
                </div>

                {topProjectUsers.length > 0 ? (
                  <div className="divide-y divide-[var(--color-border)]">
                    {topProjectUsers.map((userItem: any, index: number) => {
                      const roleBadge = getRoleBadge(userItem.role);
                      const fullName = `${userItem.first_name} ${userItem.last_name}`;

                      return (
                        <Link
                          key={userItem.id}
                          href={`/u/${userItem.id}`}
                          className="group flex items-center gap-3 py-3 hover:bg-[var(--color-muted)]/50 px-2 rounded-lg transition-colors"
                        >
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs shrink-0 ${
                            index === 0 ? "bg-blue-500 text-white shadow-md" : index === 1 ? "bg-slate-300 text-slate-900" : index === 2 ? "bg-amber-700 text-white" : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                          }`}>
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                          </div>

                          {userItem.avatar_url ? (
                            <img
                              src={userItem.avatar_url}
                              alt={fullName}
                              className="h-9 w-9 rounded-full object-cover border border-[var(--color-border)] shrink-0"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-600 font-bold text-xs shrink-0">
                              {userItem.first_name?.[0]}{userItem.last_name?.[0]}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-xs text-[var(--color-foreground)] truncate group-hover:text-blue-600 transition-colors">
                                {fullName}
                              </p>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded border ${roleBadge.cls}`}>
                                {roleBadge.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">
                              {userItem.department || userItem.headline || "YBS Topluluğu Üyesi"}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 font-bold text-xs text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-full shrink-0">
                            <FolderKanban className="h-3.5 w-3.5 text-blue-500" />
                            {userItem.project_count} Proje
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-[var(--color-muted-foreground)]">
                    Henüz proje paylaşan kullanıcı bulunamadı.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: EN SON EKLENEN 5 FIRSAT VE ÖĞRENCİ AVANTAJI */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-foreground)] flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Son Eklenen 5 Fırsat & Öğrenci Avantajı
                </h2>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                  Öğrencilere özel indirimler, sanal kart fırsatları ve ayrıcalıklar
                </p>
              </div>
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
              >
                Tüm Fırsatları İncele
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {opportunities.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {opportunities.map((opp: any) => (
                  <Link
                    key={opp.id}
                    href={`/opportunities/${opp.id}`}
                    className="group flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div>
                      {/* Image header */}
                      <div className="relative aspect-video w-full overflow-hidden bg-[var(--color-muted)]">
                        {opp.image_url ? (
                          <img
                            src={opp.image_url}
                            alt={opp.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500/10 to-indigo-500/10">
                            <Sparkles className="h-6 w-6 text-purple-500 opacity-40" />
                          </div>
                        )}
                        {opp.discount_code && (
                          <div className="absolute top-2 right-2 rounded-md bg-purple-600 text-white font-bold text-[10px] px-2 py-0.5 shadow-sm">
                            {opp.discount_code}
                          </div>
                        )}
                      </div>

                      <div className="p-3">
                        <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">
                          {opp.brand_name || opp.category}
                        </span>
                        <h4 className="font-bold text-xs text-[var(--color-foreground)] line-clamp-2 mt-0.5 group-hover:text-purple-600 transition-colors">
                          {opp.title}
                        </h4>
                        {opp.summary && (
                          <p className="text-[11px] text-[var(--color-muted-foreground)] line-clamp-2 mt-1">
                            {opp.summary}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 pt-0 flex items-center justify-between text-[10px] text-purple-600 font-semibold border-t border-[var(--color-border)]/50 mt-2">
                      <span>Fırsatı Yakala</span>
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center text-xs text-[var(--color-muted-foreground)]">
                Henüz fırsat eklenmemiş.
              </div>
            )}
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

