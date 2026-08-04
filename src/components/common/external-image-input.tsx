"use client";

import { useState } from "react";
import { Link2, Plus, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ExternalImageInputProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  maxCount?: number;
}

export default function ExternalImageInput({
  urls,
  onChange,
  maxCount = 10,
}: ExternalImageInputProps) {
  const [inputUrl, setInputUrl] = useState("");
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  const handleAddUrl = () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      toast.error("Görsel URL'si http:// veya https:// ile başlamalıdır.");
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      toast.error("Lütfen geçerli bir web adresi (URL) giriniz.");
      return;
    }

    if (urls.includes(trimmed)) {
      toast.error("Bu görsel URL'si zaten eklenmiş.");
      return;
    }

    if (urls.length >= maxCount) {
      toast.error(`En fazla ${maxCount} harici görsel URL'si ekleyebilirsiniz.`);
      return;
    }

    onChange([...urls, trimmed]);
    setInputUrl("");
    toast.success("Harici görsel bağlantısı eklendi!");
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    onChange(urls.filter((u) => u !== urlToRemove));
  };

  const handleImageError = (url: string) => {
    setFailedUrls((prev) => ({ ...prev, [url]: true }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide flex items-center gap-1.5">
          <Link2 className="h-4 w-4 text-indigo-500 shrink-0" /> Harici Görsel URL'si Ekle (Sunucuda Yer Kaplamaz)
        </label>
        <span className="text-[10px] text-[var(--color-muted-foreground)] font-medium">
          {urls.length}/{maxCount}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            placeholder="https://images.unsplash.com/... veya https://i.imgur.com/..."
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-2 px-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[var(--color-foreground)]"
          />
        </div>
        <button
          type="button"
          onClick={handleAddUrl}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-500 hover:bg-indigo-500/20 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          Ekle
        </button>
      </div>

      {urls.length > 0 && (
        <div className="grid gap-2.5 sm:grid-cols-2 mt-3">
          {urls.map((url, idx) => {
            const hasError = failedUrls[url];

            return (
              <div
                key={`${url}-${idx}`}
                className="relative flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-2.5 shadow-sm overflow-hidden group"
              >
                {hasError ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-500 shrink-0 border border-red-500/20">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                ) : (
                  <img
                    src={url}
                    alt="Harici Görsel"
                    referrerPolicy="no-referrer"
                    onError={() => handleImageError(url)}
                    className="h-12 w-12 rounded-lg object-cover border border-[var(--color-border)] shrink-0 bg-[var(--color-muted)]"
                  />
                )}

                <div className="flex-1 min-w-0 pr-6">
                  <span className="inline-block rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-500 mb-0.5">
                    Harici Web Görseli
                  </span>
                  <p className="text-xs text-[var(--color-foreground)] font-medium truncate" title={url}>
                    {url}
                  </p>
                  {hasError && (
                    <p className="text-[10px] text-red-500 font-medium">Görsel yüklenemedi / Bağlantı bozuk</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveUrl(url)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-muted-foreground)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  title="Görseli Kaldır"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
