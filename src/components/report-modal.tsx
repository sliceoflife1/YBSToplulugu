"use client";

import { useState } from "react";
import { AlertTriangle, X, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { submitContentReport } from "@/app/actions/report-actions";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: "post" | "project";
  contentId: string;
  contentTitle?: string;
}

const REPORT_CATEGORIES = [
  { id: "spam", label: "Spam veya Reklam" },
  { id: "harassment", label: "Nefret Söylemi / Taciz" },
  { id: "misinformation", label: "Yanıltıcı Bilgi / Telif İhlali" },
  { id: "inappropriate", label: "Uygunsuz / Cinsel İçerik" },
  { id: "other", label: "Diğer Sebepler" },
];

export function ReportModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentTitle,
}: ReportModalProps) {
  const [category, setCategory] = useState("other");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const contentLabel = contentType === "post" ? "Topluluk Gönderisi" : "Proje";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (details.trim().length < 10) {
      setError("Lütfen bildiriniz için en az 10 karakterlik bir açıklama yazınız.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    const res = await submitContentReport({
      contentType,
      contentId,
      reasonCategory: category,
      reasonDetails: details,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || "Bildirim iletilemedi.");
    } else {
      setSuccessMsg(res.message || "Bildiriminiz başarıyla iletildi.");
      setTimeout(() => {
        setSuccessMsg("");
        setDetails("");
        setCategory("other");
        onClose();
      }, 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--color-foreground)]">
              Yöneticiye Bildir
            </h3>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {contentLabel} {contentTitle ? `"${contentTitle.substring(0, 35)}..."` : ""}
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-0.5">Bu içerik yöneticilere bildirilecektir.</p>
            <p>
              İçeriğin topluluk kurallarını ihlal ettiğini düşünüyorsanız lütfen sebebini açıklayınız. 
              Asılsız şikayetler hesabınızın kısıtlanmasına yol açabilir.
            </p>
          </div>
        </div>

        {/* Success Message */}
        {successMsg ? (
          <div className="my-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {successMsg}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600">
                {error}
              </div>
            )}

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-[var(--color-foreground)] mb-2">
                Bildirim Kategorisi
              </label>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all ${
                      category === cat.id
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold"
                        : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Details textarea */}
            <div>
              <label htmlFor="report-details" className="block text-xs font-semibold text-[var(--color-foreground)] mb-1.5">
                Neden bu içeriği bildiriyorsunuz? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Lütfen içeriğin neden uygunsuz olduğunu detaylıca açıklayınız..."
                rows={4}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                maxLength={500}
                required
              />
              <p className="mt-1 text-right text-[10px] text-[var(--color-muted-foreground)]">
                {details.length}/500 karakter
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors disabled:opacity-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || details.trim().length < 10}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Yöneticilere Bildir
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
