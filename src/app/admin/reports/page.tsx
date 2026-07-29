"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  User,
  AlertCircle,
  ExternalLink,
  Trash2,
  Check,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ReportEntry {
  id: string;
  reporter_id: string;
  content_type: "post" | "project";
  content_id: string;
  reason_category: string;
  reason_details: string;
  status: "pending" | "actioned" | "dismissed";
  created_at: string;
  resolved_at: string | null;
  reporter?: {
    id: string;
    first_name: string;
    last_name: string;
    edu_email: string;
    role: string;
  } | null;
  contentDetails?: {
    id: string;
    title: string;
    content?: string;
    description?: string;
    slug?: string;
  } | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  spam: "Spam veya Reklam",
  harassment: "Nefret Söylemi / Taciz",
  misinformation: "Yanıltıcı Bilgi / Telif",
  inappropriate: "Uygunsuz / Cinsel İçerik",
  other: "Diğer Sebepler",
};

function formatDateUTC(dateStr: string) {
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

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [authorized, setAuthorized] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const fetchReports = useCallback(async () => {
    if (!authorized) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/reports?status=${statusFilter}`);
      if (!res.ok) throw new Error("Şikayetler yüklenirken hata oluştu");
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authorized, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleAction(reportId: string, action: "resolve" | "dismiss", deleteContent: boolean = false) {
    if (deleteContent && !confirm("Bu içeriği kalıcı olarak silmek istediğinizden emin misiniz?")) {
      return;
    }

    setActionLoading(reportId);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action, deleteContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İşlem başarısız");
      fetchReports();
    } catch (err: any) {
      alert("Hata: " + err.message);
    } finally {
      setActionLoading(null);
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
            <div className="rounded-lg bg-red-500/10 p-2.5">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
                İçerik Bildirimleri (Şikayetler)
              </h1>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Kullanıcılar tarafından bildirilen içeriklerin modülasyonu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchReports()}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Yenile
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
          <button
            onClick={() => setStatusFilter("pending")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              statusFilter === "pending"
                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            }`}
          >
            Bekleyenler
          </button>
          <button
            onClick={() => setStatusFilter("actioned")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              statusFilter === "actioned"
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            }`}
          >
            İşlem Yapılanlar
          </button>
          <button
            onClick={() => setStatusFilter("dismissed")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              statusFilter === "dismissed"
                ? "bg-gray-500/10 text-gray-600 border border-gray-500/20"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            }`}
          >
            Yoksayılanlar
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Reports list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] py-20 text-center shadow-sm">
            <ShieldAlert className="mx-auto h-12 w-12 text-[var(--color-muted-foreground)]/30" />
            <p className="mt-3 text-[var(--color-muted-foreground)]">
              Bu kategoride henüz bildirilen bir içerik bulunmuyor
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const isPending = report.status === "pending";
              const isActioned = report.status === "actioned";
              const isDismissed = report.status === "dismissed";
              const isPost = report.content_type === "post";

              return (
                <div
                  key={report.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:border-[var(--color-border)]/80"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2 max-w-3xl">
                      {/* Badge and Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-red-500/10 text-red-600 px-2.5 py-0.5 font-semibold">
                          {isPost ? "Topluluk Gönderisi" : "Proje"}
                        </span>
                        <span className="rounded-full bg-blue-500/10 text-blue-600 px-2.5 py-0.5 font-medium">
                          {CATEGORY_LABELS[report.reason_category] || report.reason_category}
                        </span>
                        <div className="flex items-center gap-1 text-[var(--color-muted-foreground)]">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDateUTC(report.created_at)}</span>
                        </div>
                      </div>

                      {/* Content details box */}
                      <div className="rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] p-3.5">
                        {report.contentDetails ? (
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-[var(--color-foreground)]">
                                {report.contentDetails.title}
                              </h4>
                              {isPost && report.contentDetails.slug ? (
                                <Link
                                  href={`/community`}
                                  target="_blank"
                                  className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 shrink-0"
                                >
                                  Görüntüle <ExternalLink className="h-3 w-3" />
                                </Link>
                              ) : (
                                <Link
                                  href={`/projects/${report.content_id}`}
                                  target="_blank"
                                  className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 shrink-0"
                                >
                                  Görüntüle <ExternalLink className="h-3 w-3" />
                                </Link>
                              )}
                            </div>
                            <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2">
                              {report.contentDetails.content || report.contentDetails.description}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-600 text-xs italic">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>Bu içerik daha önce silinmiş veya erişilemiyor.</span>
                          </div>
                        )}
                      </div>

                      {/* Reason details */}
                      <div className="text-xs">
                        <p className="font-semibold text-[var(--color-foreground)] mb-1">
                          Şikayet Sebebi:
                        </p>
                        <p className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-2.5 text-[var(--color-foreground)] break-words">
                          "{report.reason_details}"
                        </p>
                      </div>

                      {/* Reporter info */}
                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] pt-1">
                        <User className="h-3.5 w-3.5" />
                        <span>Bildiren Kullanıcı: </span>
                        {report.reporter ? (
                          <span className="font-medium text-[var(--color-foreground)]">
                            {report.reporter.first_name} {report.reporter.last_name} ({report.reporter.edu_email})
                          </span>
                        ) : (
                          <span className="italic">Bilinmiyor</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                      {isPending ? (
                        <>
                          {report.contentDetails && (
                            <button
                              onClick={() => handleAction(report.id, "resolve", true)}
                              disabled={actionLoading === report.id}
                              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              İçeriği Sil & Onayla
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(report.id, "resolve", false)}
                            disabled={actionLoading === report.id}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            İçeriği Koru & Onayla
                          </button>
                          <button
                            onClick={() => handleAction(report.id, "dismiss", false)}
                            disabled={actionLoading === report.id}
                            className="flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3.5 py-2 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5 text-gray-500" />
                            Şikayeti Yoksay
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                          {isActioned && (
                            <>
                              <CheckCircle className="h-4 w-4 text-emerald-500" />
                              <span>İşlem Yapıldı</span>
                            </>
                          )}
                          {isDismissed && (
                            <>
                              <XCircle className="h-4 w-4 text-gray-400" />
                              <span>Yoksayıldı</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
