import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Users,
  Building2,
  MessageSquare,
  FolderKanban,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  Tag,
  Megaphone,
  BookOpen,
  Briefcase,
  Activity,
  BarChart2,
  ShieldAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import type { Profile, Organization } from "@/types/database";

export default async function AdminPage() {
  const supabase = await createClient();
  const t = await getTranslations("admin");

  // Check auth and admin role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || (profile.role !== "admin" && profile.role !== "moderator" && profile.role !== "faculty")) {
    redirect("/dashboard");
  }

  // Fetch stats
  const [usersRes, orgsRes, pendingOrgsRes, postsRes, projectsRes, jobListingsRes, jobAppsRes] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("organizations").select("id", { count: "exact" }),
      supabase
        .from("organizations")
        .select("*")
        .eq("approval_status", "pending")
        .order("created_at", { ascending: false }),
      supabase.from("posts").select("id", { count: "exact" }),
      supabase.from("projects").select("id", { count: "exact" }),
      supabase.from("job_listings").select("id", { count: "exact" }),
      supabase.from("job_applications").select("id", { count: "exact" }),
    ]);

  const stats = [
    {
      icon: Users,
      label: t("totalUsers"),
      value: usersRes.count || 0,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      icon: MessageSquare,
      label: t("totalPosts"),
      value: postsRes.count || 0,
      color: "bg-orange-500/10 text-orange-600",
    },
    {
      icon: FolderKanban,
      label: t("totalProjects"),
      value: projectsRes.count || 0,
      color: "bg-emerald-500/10 text-emerald-600",
    },
    {
      icon: Building2,
      label: t("organizations"),
      value: orgsRes.count || 0,
      color: "bg-pink-500/10 text-pink-600",
    },
    {
      icon: Briefcase,
      label: "İş İlanları",
      value: jobListingsRes.count || 0,
      color: "bg-cyan-500/10 text-cyan-600",
    },
    {
      icon: FolderKanban,
      label: "Başvurular",
      value: jobAppsRes.count || 0,
      color: "bg-indigo-500/10 text-indigo-600",
    },
  ];

  const pendingOrgs = (pendingOrgsRes.data || []) as Organization[];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-lg gradient-primary p-2.5">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
                {t("title")}
              </h1>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Platform yönetimi ve moderation araçları
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2.5 ${stat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[var(--color-foreground)]">
                        {stat.value}
                      </p>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pending Organizations */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-foreground)]">
                <Clock className="h-5 w-5 text-amber-500" />
                {t("pendingApprovals")}
                {pendingOrgs.length > 0 && (
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                    {pendingOrgs.length}
                  </span>
                )}
              </h2>
            </div>

            {pendingOrgs.length > 0 ? (
              <div className="space-y-3">
                {pendingOrgs.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-muted)]">
                        <Building2 className="h-5 w-5 text-[var(--color-muted-foreground)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-foreground)]">
                          {org.name}
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          {org.type} • {org.contact_email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={`/api/admin/organizations/${org.id}/approve`} method="POST">
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {t("approve")}
                        </button>
                      </form>
                      <form action={`/api/admin/organizations/${org.id}/reject`} method="POST">
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/20"
                        >
                          <XCircle className="h-4 w-4" />
                          {t("reject")}
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                  Bekleyen onay bulunmuyor
                </p>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/users"
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <Users className="h-6 w-6 text-[var(--color-primary)]" />
              <h3 className="mt-3 font-semibold text-[var(--color-foreground)] truncate">
                {t("users")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                Kullanıcıları görüntüle ve yönet
              </p>
            </Link>
            <Link
              href="/admin/subreddits"
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <MessageSquare className="h-6 w-6 text-[var(--color-primary)]" />
              <h3 className="mt-3 font-semibold text-[var(--color-foreground)] truncate">
                {t("subredditManagement")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                Forum alanlarını oluştur ve düzenle
              </p>
            </Link>
            <Link
              href="/admin/opportunities"
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <Tag className="h-6 w-6 text-[var(--color-primary)]" />
              <h3 className="mt-3 font-semibold text-[var(--color-foreground)] truncate">
                {t("opportunitiesManagement")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                Öğrenci indirimlerini yönet
              </p>
            </Link>
            <Link
              href="/admin/jobs"
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <Briefcase className="h-6 w-6 text-[var(--color-primary)]" />
              <h3 className="mt-3 font-semibold text-[var(--color-foreground)] truncate">
                İş İlanları Yönetimi
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                İş ve staj ilanlarını yönet
              </p>
            </Link>
            <Link
              href="/admin/announcements"
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <Megaphone className="h-6 w-6 text-[var(--color-primary)]" />
              <h3 className="mt-3 font-semibold text-[var(--color-foreground)] truncate">
                {t("announcementsManagement")}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                Etkinlik ve duyuruları yönet
              </p>
            </Link>
            <Link
              href="/admin/domains"
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <BarChart3 className="h-6 w-6 text-[var(--color-primary)]" />
              <h3 className="mt-3 font-semibold text-[var(--color-foreground)] truncate">
                E-posta Domainleri
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                Üniversite domainlerini yönet
              </p>
            </Link>
            <Link
              href="/admin/yearbooks"
              className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <BookOpen className="h-6 w-6 text-[var(--color-primary)]" />
              <h3 className="mt-3 font-semibold text-[var(--color-foreground)] truncate">
                Andıç Yıllıkları
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                Mezuniyet andıç yıllarını yönet
              </p>
            </Link>
            {profile.role === "admin" && (
              <>
                <Link
                  href="/admin/reports"
                  className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <ShieldAlert className="h-6 w-6 text-red-600" />
                  <h3 className="mt-3 font-semibold text-[var(--color-foreground)] truncate">
                    İçerik Bildirimleri
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    Bildirilen gönderi ve projeleri incele
                  </p>
                </Link>
                <Link
                  href="/admin/logs"
                  className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <Activity className="h-6 w-6 text-blue-600" />
                  <h3 className="mt-3 font-semibold text-[var(--color-foreground)] truncate">
                    Log Kayıtları
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    Tüm kullanıcı eylemlerini görüntüle
                  </p>
                </Link>
                <Link
                  href="/admin/statistics"
                  className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <BarChart2 className="h-6 w-6 text-emerald-600" />
                  <h3 className="mt-3 font-semibold text-[var(--color-foreground)] truncate">
                    İstatistikler
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    Platform analizleri ve raporlar
                  </p>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
