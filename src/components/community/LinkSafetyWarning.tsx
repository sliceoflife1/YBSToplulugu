"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";

export default function LinkSafetyWarning() {
  const [isOpen, setIsOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");

  useEffect(() => {
    const handleLinkInteraction = (e: MouseEvent) => {
      // Tıklanan veya fareyle üzerine gelinen elementi bul
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Sadece dış bağlantıları denetle (http ile başlayıp mevcut domaini içermeyenler)
      const isExternal =
        href.startsWith("http://") || href.startsWith("https://");
      
      if (!isExternal) return;

      // Mevcut domain kontrolü
      try {
        const url = new URL(href);
        const currentHost = window.location.host;
        if (url.host === currentHost) return;
      } catch {
        // Geçersiz URL ise denetlemeyi atla
        return;
      }

      // Tıklama durumunda uyarımızı göster ve gitmesini engelle
      if (e.type === "click") {
        e.preventDefault();
        setTargetUrl(href);
        setIsOpen(true);
      }
    };

    // Tüm sayfada tıklamaları intercept et
    document.addEventListener("click", handleLinkInteraction, true);

    return () => {
      document.removeEventListener("click", handleLinkInteraction, true);
    };
  }, []);

  const handleProceed = () => {
    setIsOpen(false);
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl animate-scale-in"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-md font-bold text-[var(--color-foreground)]">
              Dış Bağlantı Güvenlik Uyarısı
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
              Bu bağlantı harici bir web sitesine yönlendiriyor. Diğer kullanıcılara zararlı içerik olabileceği ihtimaline karşı lütfen dikkatli olun.
            </p>
            <div className="mt-3.5 rounded-xl bg-[var(--color-muted)]/50 p-3 border border-[var(--color-border)]/50">
              <p className="text-[10px] font-mono break-all text-[var(--color-foreground)] select-all flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5 text-[var(--color-muted-foreground)] shrink-0" />
                {targetUrl}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[var(--color-border)]/50 pt-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
          >
            İptal Et
          </button>
          <button
            type="button"
            onClick={handleProceed}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            Onayla ve Devam Et
          </button>
        </div>
      </div>
    </div>
  );
}
