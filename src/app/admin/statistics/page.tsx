"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  MessageSquare,
  FolderKanban,
  Building2,
  Briefcase,
  AlertTriangle,
  Activity,
  Shield,
  TrendingUp,
  BarChart3,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

type Period = "7d" | "30d" | "90d" | "365d";

export default function AdminStatisticsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("30d");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile || profile.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        const res = await fetch(`/api/admin/stats?period=${period}`);
        if (!res.ok) {
          throw new Error("İstatistikler alınırken bir hata oluştu");
        }
        
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        console.error("Stats fetch error:", err);
        setError(err.message || "Bilinmeyen bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [period, router]);

  const renderBarChart = (data: Record<string, number | unknown>, colorVar: string = "--color-primary") => {
    if (!data) return null;
    const entries = Object.entries(data).map(([k, v]) => [k, Number(v) || 0] as [string, number]).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map((e) => e[1]), 1);

    return (
      <div className="space-y-3 mt-4">
        {entries.map(([label, value]) => (
          <div key={label} className="relative">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-[var(--color-foreground)] capitalize">{label}</span>
              <span className="text-[var(--color-muted-foreground)]">{value}</span>
            </div>
            <div className="h-6 w-full bg-[var(--color-muted)] rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500 ease-out flex items-center px-2 text-xs text-white font-medium"
                style={{
                  width: `${Math.max((value / max) * 100, 2)}%`,
                  backgroundColor: `var(${colorVar})`,
                }}
              >
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header & Controls */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg gradient-primary p-2.5">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
                  İstatistikler ve Analizler
                </h1>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Platform metrikleri ve kullanıcı aktiviteleri
                </p>
              </div>
            </div>

            <div className="flex bg-[var(--color-card)] p-1 rounded-lg border border-[var(--color-border)] shadow-sm">
              {(["7d", "30d", "90d", "365d"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    period === p
                      ? "bg-[var(--color-primary)] text-white shadow-sm"
                      : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  }`}
                >
                  {p === "7d" ? "7 Gün" : p === "30d" ? "30 Gün" : p === "90d" ? "3 Ay" : "1 Yıl"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-900/20">
              <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
              <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          ) : stats ? (
            <div className="space-y-8 animate-fade-in">
              {/* 1. Platform Genel Bakış */}
              <section>
                <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Platform Genel Bakış
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[
                    { label: "Toplam Kullanıcı", value: stats.platform.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-500/10" },
                    { label: "Toplam Gönderi", value: stats.platform.totalPosts, icon: MessageSquare, color: "text-orange-600", bg: "bg-orange-500/10" },
                    { label: "Toplam Proje", value: stats.platform.totalProjects, icon: FolderKanban, color: "text-emerald-600", bg: "bg-emerald-500/10" },
                    { label: "İş İlanları", value: stats.platform.totalJobs, icon: Briefcase, color: "text-cyan-600", bg: "bg-cyan-500/10" },
                    { label: "Kuruluşlar", value: stats.platform.totalOrganizations, icon: Building2, color: "text-pink-600", bg: "bg-pink-500/10" },
                  ].map((item, i) => (
                    <div key={i} className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)] shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${item.bg}`}>
                          <item.icon className={`h-4 w-4 ${item.color}`} />
                        </div>
                        <p className="text-sm text-[var(--color-muted-foreground)]">{item.label}</p>
                      </div>
                      <p className="text-2xl font-bold text-[var(--color-foreground)]">{item.value?.toLocaleString() || 0}</p>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)] shadow-sm flex justify-between items-center">
                    <div>
                      <p className="text-sm text-[var(--color-muted-foreground)]">Bu Dönem Yeni Kullanıcı</p>
                      <p className="text-xl font-bold text-emerald-500">+{stats.users.newUsersInPeriod || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-emerald-500/20" />
                  </div>
                  <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)] shadow-sm flex justify-between items-center">
                    <div>
                      <p className="text-sm text-[var(--color-muted-foreground)]">Aktif Kullanıcılar</p>
                      <p className="text-xl font-bold text-blue-500">{stats.activity.uniqueActiveUsers || 0}</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-500/20" />
                  </div>
                  <div className="bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)] shadow-sm flex justify-between items-center">
                    <div>
                      <p className="text-sm text-[var(--color-muted-foreground)]">Toplam Eylem</p>
                      <p className="text-xl font-bold text-purple-500">{stats.activity.totalActions?.toLocaleString() || 0}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500/20" />
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 2. Kullanıcı İstatistikleri */}
                <section className="bg-[var(--color-card)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm">
                  <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-6 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Kullanıcı İstatistikleri
                  </h2>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 rounded-lg bg-[var(--color-muted)]">
                      <p className="text-sm text-[var(--color-muted-foreground)] mb-1">Mentor</p>
                      <p className="text-xl font-bold text-[var(--color-primary)]">{stats.users.mentorCount || 0}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-[var(--color-muted)]">
                      <p className="text-sm text-[var(--color-muted-foreground)] mb-1">İşe Açık</p>
                      <p className="text-xl font-bold text-emerald-500">{stats.users.openToWorkCount || 0}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-[var(--color-muted)]">
                      <p className="text-sm text-[var(--color-muted-foreground)] mb-1">Pasif</p>
                      <p className="text-xl font-bold text-red-500">{stats.users.inactiveCount || 0}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-2">Rol Dağılımı</h3>
                      {renderBarChart(stats.users.roleCounts, "--color-primary")}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-2">Bölüm Dağılımı (İlk 5)</h3>
                      {renderBarChart(
                        Object.fromEntries(
                          Object.entries(stats.users.departmentCounts || {})
                            .sort((a: any, b: any) => b[1] - a[1])
                            .slice(0, 5)
                        ),
                        "--color-secondary"
                      )}
                    </div>
                  </div>
                </section>

                {/* 3. Aktivite İstatistikleri */}
                <section className="bg-[var(--color-card)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm">
                  <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-6 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-500" />
                    Aktivite İstatistikleri
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-2">Kategori Bazlı Eylemler</h3>
                      {renderBarChart(stats.activity.categoryBreakdown, "--color-warning")}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Saatlik Aktivite (Yoğunluk)
                      </h3>
                      <div className="flex items-end h-32 gap-1 mt-4">
                        {Array.from({ length: 24 }).map((_, hour) => {
                          const val = stats.activity.hourlyActivity?.[hour] || 0;
                          const maxHourly = Math.max(...Object.values(stats.activity.hourlyActivity || {0: 1}) as number[], 1);
                          return (
                            <div key={hour} className="flex-1 flex flex-col justify-end group relative">
                              <div 
                                className="w-full bg-orange-500/50 rounded-t-sm transition-all group-hover:bg-orange-500"
                                style={{ height: `${Math.max((val / maxHourly) * 100, 5)}%` }}
                              ></div>
                              <span className="text-[10px] text-[var(--color-muted-foreground)] mt-1 text-center hidden md:block">
                                {hour}
                              </span>
                              {/* Tooltip */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 bg-[var(--color-foreground)] text-[var(--color-background)] text-xs px-2 py-1 rounded">
                                {hour}:00 - {val} eylem
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. Topluluk ve 5. Proje */}
                <div className="space-y-8">
                  <section className="bg-[var(--color-card)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm">
                    <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-6 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                      Topluluk İstatistikleri
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-lg border border-[var(--color-border)]">
                        <p className="text-sm text-[var(--color-muted-foreground)]">Yeni Gönderi</p>
                        <p className="text-2xl font-bold text-[var(--color-foreground)]">+{stats.community.newPostsInPeriod || 0}</p>
                      </div>
                      <div className="p-4 rounded-lg border border-[var(--color-border)]">
                        <p className="text-sm text-[var(--color-muted-foreground)]">Yeni Yorum</p>
                        <p className="text-2xl font-bold text-[var(--color-foreground)]">+{stats.community.newCommentsInPeriod || 0}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-2">En Aktif Subredditler (Top 5)</h3>
                      <div className="space-y-3 mt-4">
                        {(stats.community.topSubreddits || []).slice(0, 5).map((sub: any, i: number) => {
                          const maxPost = Math.max(...(stats.community.topSubreddits || []).map((s: any) => s.post_count), 1);
                          return (
                            <div key={i} className="relative">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-[var(--color-foreground)]">r/{sub.slug}</span>
                                <span className="text-[var(--color-muted-foreground)]">{sub.post_count} gönderi</span>
                              </div>
                              <div className="h-4 w-full bg-[var(--color-muted)] rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-purple-500"
                                  style={{ width: `${Math.max((sub.post_count / maxPost) * 100, 2)}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>

                  <section className="bg-[var(--color-card)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm">
                    <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-6 flex items-center gap-2">
                      <FolderKanban className="h-5 w-5 text-emerald-500" />
                      Proje İstatistikleri
                    </h2>
                    <div className="flex gap-4 mb-6">
                      <div className="flex-1 p-3 rounded-lg bg-emerald-500/10 text-center">
                        <p className="text-xs text-emerald-600 font-medium mb-1">Takım Projesi</p>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{stats.projects.teamProjectCount || 0}</p>
                      </div>
                      <div className="flex-1 p-3 rounded-lg bg-blue-500/10 text-center">
                        <p className="text-xs text-blue-600 font-medium mb-1">Bireysel Proje</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{stats.projects.soloProjectCount || 0}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-2">Proje Türü Dağılımı</h3>
                      {renderBarChart(stats.projects.projectTypeCounts, "--color-success")}
                    </div>
                  </section>
                </div>

                {/* 6. İş ve 7/8 Güvenlik/Durum */}
                <div className="space-y-8">
                  <section className="bg-[var(--color-card)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm">
                    <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-6 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-cyan-500" />
                      İş ve Kariyer İstatistikleri
                    </h2>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-2">Çalışma Türü Dağılımı</h3>
                        {renderBarChart(stats.jobs.employmentTypeCounts, "--color-info")}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-2">Çalışma Modu</h3>
                        {renderBarChart(stats.jobs.workModeCounts, "--color-secondary-light")}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-2">Başvuru Durumları</h3>
                        {renderBarChart(stats.jobs.applicationStatusCounts, "--color-primary")}
                      </div>
                    </div>
                  </section>

                  <section className="bg-[var(--color-card)] rounded-xl p-6 border border-[var(--color-border)] shadow-sm">
                    <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-6 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-500" />
                      Güvenlik & Durum
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                          <XCircle className="h-4 w-4" />
                          <span className="font-medium text-sm">Başarısız Giriş</span>
                        </div>
                        <p className="text-2xl font-bold text-red-600">{stats.security.failedLogins || 0}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-2 text-amber-600 mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium text-sm">Yetkisiz Erişim</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-600">{stats.security.unauthorizedAttempts || 0}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-[var(--color-muted-foreground)] mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        API Yanıt Durumları
                      </h3>
                      {renderBarChart(stats.activity.statusBreakdown, "--color-error")}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
