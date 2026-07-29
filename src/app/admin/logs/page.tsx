"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Search,
  Download,
  Archive,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface LogEntry {
  id: string;
  user_id: string | null;
  action_type: string;
  action_category: string;
  entity_type: string | null;
  entity_id: string | null;
  status: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    edu_email: string;
    role: string;
  } | null;
}

const CATEGORIES = [
  { value: "", label: "Tümü" },
  { value: "auth", label: "Kimlik Doğrulama" },
  { value: "community", label: "Topluluk" },
  { value: "project", label: "Proje" },
  { value: "job", label: "İş/Kariyer" },
  { value: "admin", label: "Yönetici" },
  { value: "profile", label: "Profil" },
  { value: "yearbook", label: "Andıç" },
  { value: "storage", label: "Depolama" },
  { value: "legal", label: "Yasal" },
];

const STATUSES = [
  { value: "", label: "Tümü" },
  { value: "success", label: "Başarılı", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  { value: "error", label: "Hata", color: "text-red-600", bg: "bg-red-500/10" },
  { value: "unauthorized", label: "Yetkisiz", color: "text-amber-600", bg: "bg-amber-500/10" },
  { value: "blocked", label: "Engellendi", color: "text-red-700", bg: "bg-red-500/15" },
];

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Giriş Yapma",
  "auth.login_failed": "Başarısız Giriş",
  "auth.register": "Kayıt Olma",
  "auth.logout": "Çıkış Yapma",
  "auth.email_verified": "E-posta Doğrulama",
  "auth.password_reset_request": "Şifre Sıfırlama İsteği",
  "auth.password_reset": "Şifre Değiştirildi",
  "post.create": "Gönderi Paylaşma",
  "post.edit": "Gönderi Düzenleme",
  "post.delete": "Gönderi Silme",
  "post.upvote": "Gönderi Oylama",
  "comment.create": "Yorum Yapma",
  "comment.edit": "Yorum Düzenleme",
  "comment.delete": "Yorum Silme",
  "project.create": "Proje Oluşturma",
  "project.edit": "Proje Düzenleme",
  "project.delete": "Proje Silme",
  "project.upvote": "Proje Oylama",
  "project.remove_tag": "Takım Etiketi Kaldırma",
  "project_comment.create": "Proje Yorumu",
  "project_comment.edit": "Proje Yorum Düzenleme",
  "project_comment.delete": "Proje Yorum Silme",
  "job.create": "İş İlanı Oluşturma",
  "job.edit": "İş İlanı Düzenleme",
  "job.delete": "İş İlanı Silme",
  "job.apply": "İş Başvurusu",
  "job.application_status_change": "Başvuru Durumu Değişikliği",
  "job.interview_request": "Mülakat Daveti",
  "admin.user_role_change": "Rol Değişikliği",
  "admin.user_delete": "Kullanıcı Silme",
  "admin.password_reset": "Şifre Sıfırlama (Admin)",
  "admin.org_approve": "Kuruluş Onaylama",
  "admin.org_reject": "Kuruluş Reddetme",
  "admin.log_export": "Log İndirme",
  "admin.log_archive": "Log Arşivleme",
  "admin.legal_update": "Yasal Güncelleme",
  "profile.edit": "Profil Düzenleme",
  "cv.generate_pdf": "CV PDF Oluşturma",
  "cv.update": "CV Güncelleme",
  "yearbook.profile_create": "Yıllık Profili Oluşturma",
  "yearbook.profile_update": "Yıllık Profili Güncelleme",
  "yearbook.profile_delete": "Yıllık Profili Silme",
  "yearbook.entry_create": "Yıllık Yazısı Ekleme",
  "yearbook.entry_update": "Yıllık Yazısı Güncelleme",
  "yearbook.entry_delete": "Yıllık Yazısı Silme",
  "storage.file_upload": "Dosya Yükleme",
  "legal.consent_given": "Yasal Onay",
};

function getStatusInfo(status: string) {
  switch (status) {
    case "success":
      return { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-500/10", label: "Başarılı" };
    case "error":
      return { icon: XCircle, color: "text-red-600", bg: "bg-red-500/10", label: "Hata" };
    case "unauthorized":
      return { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-500/10", label: "Yetkisiz" };
    case "blocked":
      return { icon: XCircle, color: "text-red-700", bg: "bg-red-500/15", label: "Engellendi" };
    default:
      return { icon: Activity, color: "text-gray-600", bg: "bg-gray-500/10", label: status };
  }
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    auth: "bg-blue-500/10 text-blue-700",
    community: "bg-orange-500/10 text-orange-700",
    project: "bg-emerald-500/10 text-emerald-700",
    job: "bg-cyan-500/10 text-cyan-700",
    admin: "bg-red-500/10 text-red-700",
    profile: "bg-indigo-500/10 text-indigo-700",
    yearbook: "bg-pink-500/10 text-pink-700",
    storage: "bg-teal-500/10 text-teal-700",
    legal: "bg-amber-500/10 text-amber-700",
  };
  return colors[category] || "bg-gray-500/10 text-gray-700";
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const formatted = date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  });
  return `${formatted} UTC`;
}

export default function AdminLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [authorized, setAuthorized] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Export
  const [exporting, setExporting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") { router.push("/dashboard"); return; }
      setAuthorized(true);
    }
    checkAuth();
  }, [router]);

  const fetchLogs = useCallback(async () => {
    if (!authorized) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        ...(search && { search }),
        ...(category && { category }),
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      const res = await fetch(`/api/admin/logs?${params}`);
      if (!res.ok) throw new Error("Loglar yüklenirken hata oluştu");
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authorized, page, search, category, status, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function handleExport(format: "csv" | "json") {
    setExporting(true);
    try {
      const exportStart = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const exportEnd = endDate || new Date().toISOString();
      const res = await fetch("/api/admin/logs/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: exportStart,
          endDate: exportEnd,
          format,
          category: category || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dışa aktarım başarısız");
      window.open(data.downloadUrl, "_blank");
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleArchive() {
    if (!confirm("90 günden eski loglar Azure'a arşivlenip Supabase'den silinecek. Devam edilsin mi?")) return;
    setArchiving(true);
    try {
      const res = await fetch("/api/admin/logs/archive", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Arşivleme başarısız");
      alert(`${data.message}`);
      fetchLogs();
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setArchiving(false);
    }
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-muted)]/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-lg p-2 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
                Log Kayıtları
              </h1>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Toplam {total.toLocaleString("tr-TR")} kayıt
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs()}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Yenile
            </button>
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exporting ? "İndiriliyor..." : "CSV İndir"}
            </button>
            <button
              onClick={() => handleExport("json")}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              JSON
            </button>
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              {archiving ? "Arşivleniyor..." : "Arşivle"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-[var(--color-muted-foreground)]" />
            <span className="text-sm font-medium text-[var(--color-foreground)]">Filtreler</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              <input
                type="text"
                placeholder="Eylem, varlık türü veya ID ara..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] py-2 pl-9 pr-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
              placeholder="Başlangıç"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
              placeholder="Bitiş"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Logs Table */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center">
              <Activity className="mx-auto h-12 w-12 text-[var(--color-muted-foreground)]/30" />
              <p className="mt-3 text-[var(--color-muted-foreground)]">
                Filtrelere uygun log kaydı bulunamadı
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/50">
                    <th className="px-4 py-3 text-left font-medium text-[var(--color-muted-foreground)]">Tarih</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--color-muted-foreground)]">Kullanıcı</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--color-muted-foreground)]">Eylem</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--color-muted-foreground)]">Kategori</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--color-muted-foreground)]">Durum</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--color-muted-foreground)]">IP : Port</th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--color-muted-foreground)]">Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {logs.map((log) => {
                    const statusInfo = getStatusInfo(log.status);
                    const StatusIcon = statusInfo.icon;
                    const isExpanded = expandedLog === log.id;
                    return (
                      <>
                        <tr
                          key={log.id}
                          className="hover:bg-[var(--color-muted)]/30 cursor-pointer transition-colors"
                          onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="text-xs">{formatDate(log.created_at)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {log.profiles ? (
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-muted)]">
                                  <User className="h-3.5 w-3.5 text-[var(--color-muted-foreground)]" />
                                </div>
                                <div>
                                  <p className="font-medium text-[var(--color-foreground)] text-xs">
                                    {log.profiles.first_name} {log.profiles.last_name}
                                  </p>
                                  <p className="text-xs text-[var(--color-muted-foreground)]">
                                    {log.profiles.role}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--color-muted-foreground)] italic">Anonim</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-[var(--color-foreground)]">
                              {ACTION_LABELS[log.action_type] || log.action_type}
                            </span>
                            {log.entity_type && (
                              <p className="text-xs text-[var(--color-muted-foreground)]">
                                {log.entity_type} {log.entity_id ? `#${log.entity_id.substring(0, 8)}` : ""}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryColor(log.action_category)}`}>
                              {CATEGORIES.find(c => c.value === log.action_category)?.label || log.action_category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-[var(--color-muted-foreground)] font-mono">
                              {log.ip_address || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button className="text-xs text-[var(--color-primary)] hover:underline">
                              {isExpanded ? "Gizle" : "Göster"}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${log.id}-detail`}>
                            <td colSpan={7} className="bg-[var(--color-muted)]/20 px-6 py-4">
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                                <div>
                                  <p className="font-medium text-[var(--color-muted-foreground)] mb-1">Log ID</p>
                                  <p className="font-mono text-[var(--color-foreground)]">{log.id}</p>
                                </div>
                                {log.user_id && (
                                  <div>
                                    <p className="font-medium text-[var(--color-muted-foreground)] mb-1">Kullanıcı ID</p>
                                    <p className="font-mono text-[var(--color-foreground)]">{log.user_id}</p>
                                  </div>
                                )}
                                {log.profiles?.edu_email && (
                                  <div>
                                    <p className="font-medium text-[var(--color-muted-foreground)] mb-1">E-posta</p>
                                    <p className="text-[var(--color-foreground)]">{log.profiles.edu_email}</p>
                                  </div>
                                )}
                                {log.user_agent && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <p className="font-medium text-[var(--color-muted-foreground)] mb-1">Tarayıcı Bilgisi</p>
                                    <p className="text-[var(--color-foreground)] break-all">{log.user_agent}</p>
                                  </div>
                                )}
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <p className="font-medium text-[var(--color-muted-foreground)] mb-1">Metadata</p>
                                    <pre className="rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] p-3 overflow-x-auto text-[var(--color-foreground)]">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Sayfa {page} / {totalPages} ({total.toLocaleString("tr-TR")} kayıt)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Önceki
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] disabled:opacity-50 transition-colors"
              >
                Sonraki
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Veri Saklama Politikası</p>
              <ul className="space-y-0.5 text-xs text-blue-600">
                <li>• 90 günden eski loglar arşivleme ile Azure Blob&apos;a taşınır</li>
                <li>• 2 yıldan eski log kayıtları otomatik olarak tüm sistemlerden silinir</li>
                <li>• İndirme linkleri 15 dakika geçerlidir</li>
                <li>• Bu sayfaya yalnızca admin rolü erişebilir</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
