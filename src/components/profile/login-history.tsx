"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Monitor, Smartphone, Globe, Clock, MapPin, RefreshCw, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface LoginLog {
  id: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any> | null;
  status: string;
}

function parseUserAgent(uaString: string | null): { device: string; icon: "desktop" | "mobile" | "globe" } {
  if (!uaString) return { device: "Bilinmeyen Cihaz", icon: "globe" };

  const ua = uaString.toLowerCase();
  let os = "Bilinmeyen İşletim Sistemi";
  let browser = "Tarayıcı";
  let isMobile = false;

  // OS
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os") || ua.includes("macintosh")) os = "macOS";
  else if (ua.includes("android")) { os = "Android"; isMobile = true; }
  else if (ua.includes("iphone") || ua.includes("ipad")) { os = "iOS"; isMobile = true; }
  else if (ua.includes("linux")) os = "Linux";

  // Browser
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome") && !ua.includes("edg/")) browser = "Chrome";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("firefox")) browser = "Firefox";

  return {
    device: `${browser} (${os})`,
    icon: isMobile ? "mobile" : "desktop",
  };
}

export function LoginHistory() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/login-history");
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
      } else {
        setError(data.error || "Oturum geçmişi yüklenemedi.");
      }
    } catch (err) {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="flex items-start gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">
            Son Giriş Yaptığınız Cihazlar ve IP Adresleri
          </h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Hesabınızda gerçekleştirilen son başarılı oturum açma eylemleri aşağıda listelenmektedir. Tanımadığınız bir IP veya cihaz fark ederseniz hemen şifrenizi güncelleyiniz.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Yenile
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/30" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Henüz kayıtlı bir giriş oturumu bulunmuyor.
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const { device, icon } = parseUserAgent(log.user_agent);
            const formattedDate = new Date(log.created_at).toLocaleString("tr-TR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={log.id}
                className="flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    {icon === "mobile" ? (
                      <Smartphone className="h-5 w-5" />
                    ) : icon === "desktop" ? (
                      <Monitor className="h-5 w-5" />
                    ) : (
                      <Globe className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--color-foreground)]">{device}</span>
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                        Başarılı Oturum
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" />
                        IP: {log.ip_address || "Bilinmiyor"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formattedDate}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
