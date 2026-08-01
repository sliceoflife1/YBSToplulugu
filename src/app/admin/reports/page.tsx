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
  FileText,
  Edit3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ReportEntry {
  id: string;
  reporter_id: string;
  content_type: "post" | "project";
  content_id: string;
  reason_category: string;
  reason_details: string;
  admin_note?: string | null;
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
    subreddits?: { slug?: string } | null;
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

  // Modal State'leri
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [targetReport, setTargetReport] = useState<ReportEntry | null>(null);
  const [pendingAction, setPendingAction] = useState<"actioned" | "dismissed" | "edit">("actioned");
  const [pendingDeleteContent, setPendingDeleteContent] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState("");

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
    setError("");
    try {
      const res = await fetch(`/api/admin/reports?status=${statusFilter}`);
      if (!res.ok) throw new Error("Şikayetler yüklenirken hata oluştu");
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [authorized, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  function openNoteModal(
    report: ReportEntry,
    actionType: "actioned" | "dismissed" | "edit",
    deleteContent: boolean = false
  ) {
    setTargetReport(report);
    setPendingAction(actionType);
    setPendingDeleteContent(deleteContent);
    const existingNote = report.admin_note || (report.reason_details?.includes("[YÖNETİCİ NOTU]:") ? report.reason_details.split("[YÖNETİCİ NOTU]:")[1]?.trim() : "");
    setAdminNoteInput(existingNote || "");
    setNoteModalOpen(true);
  }

  async function submitReportActionWithNote() {
    if (!targetReport) return;
    const reportId = targetReport.id;
    setActionLoading(reportId);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          action: pendingAction === "dismissed" ? "dismiss" : "resolve",
          deleteContent: pendingDeleteContent,
          adminNote: adminNoteInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "İşlem başarısız");
      setNoteModalOpen(false);
      setTargetReport(null);
      fetchReports();
    } catch (err: unknown) {
      alert("Hata: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setActionLoading(null);
    }
  }

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
    } catch (err: unknown) {
      alert("Hata: " + (err instanceof Error ? err.message : String(err)));
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
                Kullanıcılar tarafından bildirilen içeriklerin moderasyonu ve yönetimi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLoading(true);
                fetchReports();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Yenile
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex border-b border-[var(--color-border)]">
          <button
            onClick={() => setStatusFilter("pending")}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              statusFilter === "pending"
                ? "border-red-600 text-red-600"
                : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            Bekleyenler
          </button>
          <button
            onClick={() => setStatusFilter("actioned")}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              statusFilter === "actioned"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            İşlem Yapılanlar
          </button>
          <button
            onClick={() => setStatusFilter("dismissed")}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              statusFilter === "dismissed"
                ? "border-gray-500 text-gray-500"
                : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            }`}
          >
            Yoksayılanlar
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
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
              const cleanReasonDetails = (report.reason_details || "").split("\n\n[YÖNETİCİ NOTU]:")[0];
              const displayAdminNote = report.admin_note || (report.reason_details?.includes("[YÖNETİCİ NOTU]:") ? report.reason_details.split("[YÖNETİCİ NOTU]:")[1]?.trim() : null);

              return (
                <div
                  key={report.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:border-[var(--color-border)]/80"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3 max-w-3xl flex-1">
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
                              {isPost ? (
                                <Link
                                  href={
                                    report.contentDetails?.subreddits?.slug
                                      ? `/community/${report.contentDetails.subreddits.slug}/${report.content_id}`
                                      : `/community`
                                  }
                                  target="_blank"
                                  className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 shrink-0 font-semibold"
                                >
                                  Gönderiyi Görüntüle <ExternalLink className="h-3 w-3" />
                                </Link>
                              ) : (
                                <Link
                                  href={`/projects/${report.content_id}`}
                                  target="_blank"
                                  className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 shrink-0 font-semibold"
                                >
                                  Projeyi Görüntüle <ExternalLink className="h-3 w-3" />
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
                          &quot;{cleanReasonDetails}&quot;
                        </p>
                      </div>

                      {/* Display Admin Note if present */}
                      {displayAdminNote && (
                        <div className="text-xs">
                          <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" /> Yönetici Notu / Açıklaması:
                          </p>
                          <p className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2.5 text-[var(--color-foreground)] break-words font-medium">
                            &quot;{displayAdminNote}&quot;
                          </p>
                        </div>
                      )}

                      {/* Reporter info */}
                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] pt-1">
                        <User className="h-3.5 w-3.5" />
                        <span>Bildiren Kullanıcı: </span>
                        {report.reporter ? (
                          <Link
                            href={`/profile/${report.reporter.id}`}
                            target="_blank"
                            className="font-medium text-[var(--color-primary)] hover:underline"
                          >
                            {report.reporter.first_name} {report.reporter.last_name} ({report.reporter.edu_email})
                          </Link>
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
                              onClick={() => openNoteModal(report, "actioned", true)}
                              disabled={actionLoading === report.id}
                              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              İçeriği Sil &amp; İşlem Yap
                            </button>
                          )}
                          <button
                            onClick={() => openNoteModal(report, "actioned", false)}
                            disabled={actionLoading === report.id}
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            İşlem Yapıldı &amp; Not Ekle
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
                        <div className="flex flex-col gap-2 items-end">
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
                          <button
                            onClick={() => openNoteModal(report, "edit", false)}
                            className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline font-semibold"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Notu Düzenle
                          </button>
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

      {/* Admin Note Modal */}
      {noteModalOpen && targetReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h3 className="font-bold text-base text-[var(--color-foreground)] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[var(--color-primary)]" />
                {pendingAction === "edit" ? "Yönetici Notunu Düzenle" : "Şikayet İşlem Notu Ekle"}
              </h3>
              <button
                onClick={() => setNoteModalOpen(false)}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                {pendingAction === "edit"
                  ? "Bu şikayet kaydı için daha önce yazılan yönetici notunu aşağıdan güncelleyebilirsiniz."
                  : "Bu şikayeti 'İşlem Yapılanlar' listesine taşımak için yapılan işlemi ve alınan kararı açıklayınız:"}
              </p>
              <textarea
                rows={4}
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="Örn: Kullanıcı uyarıldı, gönderideki ihlal içeren kısım kaldırıldı / incelendi..."
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold hover:bg-[var(--color-muted)] transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={submitReportActionWithNote}
                disabled={actionLoading === targetReport.id}
                className="rounded-xl bg-[var(--color-primary)] px-5 py-2 text-xs font-semibold text-white shadow-md hover:opacity-90 transition-all disabled:opacity-50"
              >
                {actionLoading === targetReport.id ? "Kaydediliyor..." : "Kaydet & İşlem Yapılanlara Taşı"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
