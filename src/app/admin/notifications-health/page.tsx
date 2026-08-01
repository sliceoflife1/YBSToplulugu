"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Users,
  Bell,
} from "lucide-react";

interface HealthcheckResult {
  healthcheck_function_exists: boolean;
  notifications_table_exists?: boolean;
  organizations_table_exists?: boolean;
  dedup_key_column_exists?: boolean;
  trigger_new_role_exists?: boolean;
  trigger_email_verified_exists?: boolean;
  organizations_owner_unique_exists?: boolean;
  admin_moderator_count?: number;
  pending_employer_faculty_count?: number;
  system_notifications_last_30_days?: number;
  checked_at?: string;
  error?: string;
  hint?: string;
}

function StatusRow({
  label,
  ok,
  okLabel,
  failLabel,
}: {
  label: string;
  ok: boolean | undefined;
  okLabel: string;
  failLabel: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] py-3 last:border-b-0">
      <span className="text-sm text-[var(--color-foreground)]">{label}</span>
      {ok ? (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> {okLabel}
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
          <XCircle className="h-4 w-4" /> {failLabel}
        </span>
      )}
    </div>
  );
}

export default function NotificationsHealthPage() {
  const [result, setResult] = useState<HealthcheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/diagnostics/notifications");
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Sağlık kontrolü alınamadı.");
        setResult(null);
      } else {
        setResult(data);
      }
    } catch {
      setErrorMsg("Sağlık kontrolü sırasında bir ağ hatası oluştu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
        <ArrowLeft className="h-4 w-4" /> Yönetim Paneline Dön
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--color-foreground)]">
            <ShieldCheck className="h-6 w-6 text-indigo-500" />
            Bildirim Sistemi Sağlık Kontrolü
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Canlı veritabanında bildirim tablosu, tetikleyicileri ve gerekli kısıtlamaların
            gerçekten kurulu olup olmadığını doğrular.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchHealth();
          }}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-muted)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Yenile
        </button>
      </div>

      {loading && !result && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          {errorMsg}
        </div>
      )}

      {result && !result.healthcheck_function_exists && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          <p className="font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Sağlık kontrolü fonksiyonu bulunamadı</p>
          <p className="mt-1">{result.hint}</p>
          {result.error && <p className="mt-2 font-mono text-xs opacity-80">{result.error}</p>}
        </div>
      )}

      {result && result.healthcheck_function_exists && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Şema & Tetikleyiciler
            </h2>
            <StatusRow label="notifications tablosu" ok={result.notifications_table_exists} okLabel="Mevcut" failLabel="Eksik" />
            <StatusRow label="organizations tablosu" ok={result.organizations_table_exists} okLabel="Mevcut" failLabel="Eksik" />
            <StatusRow label="notifications.dedup_key kolonu (atomik mükerrer önleme)" ok={result.dedup_key_column_exists} okLabel="Mevcut" failLabel="Eksik (migrations/039 uygulanmamış)" />
            <StatusRow label="Trigger: yeni işveren/akademisyen kaydı" ok={result.trigger_new_role_exists} okLabel="Kurulu" failLabel="Kurulu değil" />
            <StatusRow label="Trigger: e-posta doğrulama" ok={result.trigger_email_verified_exists} okLabel="Kurulu" failLabel="Kurulu değil" />
            <StatusRow label="organizations.owner_id UNIQUE kısıtlaması" ok={result.organizations_owner_unique_exists} okLabel="Mevcut" failLabel="Yok (muhtemelen mükerrer kayıtlar var)" />
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              Veri Durumu
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-[var(--color-foreground)]">
                  <Users className="h-5 w-5 text-indigo-500" /> {result.admin_moderator_count ?? "—"}
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">Admin / Moderatör</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-[var(--color-foreground)]">
                  {result.pending_employer_faculty_count ?? "—"}
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">Bekleyen İşveren/Akademisyen</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-[var(--color-foreground)]">
                  <Bell className="h-5 w-5 text-amber-500" /> {result.system_notifications_last_30_days ?? "—"}
                </div>
                <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">Son 30 Gün Sistem Bildirimi</p>
              </div>
            </div>

            {result.admin_moderator_count === 0 && (
              <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-xs text-red-600">
                Sistemde hiç admin/moderatör profili bulunamadı — bildirimler doğru şekilde
                oluşturulsa bile gönderilecek kimse yok.
              </p>
            )}
          </div>

          <p className="text-xs text-[var(--color-muted-foreground)] text-right">
            Son kontrol: {result.checked_at ? new Date(result.checked_at).toLocaleString("tr-TR") : "—"}
          </p>
        </div>
      )}
    </div>
  );
}
