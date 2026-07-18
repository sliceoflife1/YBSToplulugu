"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag, Copy, Check, ExternalLink, ShieldAlert, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";

interface Opportunity {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  conditions: string[] | null;
  category: string;
  brand_name: string;
  brand_logo_url: string | null;
  image_url: string | null;
  discount_code: string | null;
  external_link: string | null;
  end_date: string | null;
  is_active: boolean;
  views_count: number;
}

export default function OpportunityDetailClient({
  opportunity,
  isLoggedIn,
}: {
  opportunity: Opportunity;
  isLoggedIn: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  // Geri sayım sayacı mantığı
  useEffect(() => {
    if (!opportunity.end_date) return;

    const targetDate = new Date(opportunity.end_date).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [opportunity.end_date]);

  const handleCopy = () => {
    if (!opportunity.discount_code) return;
    navigator.clipboard.writeText(opportunity.discount_code);
    setCopied(true);
    toast.success("Kupon kodu kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Geri Butonu */}
      <Link
        href="/opportunities"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" /> Tüm Fırsatlara Geri Dön
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Sol 2 Kolon: Fırsat Detayları */}
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg">
            {/* Kampanya Kapak Görseli */}
            <div className="relative aspect-video w-full bg-[var(--color-muted)]">
              {opportunity.image_url ? (
                <img
                  src={opportunity.image_url}
                  alt={opportunity.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/5 to-purple-500/10">
                  <Tag className="h-16 w-16 text-[var(--color-primary)] opacity-30" />
                </div>
              )}
            </div>

            {/* İçerik */}
            <div className="p-6">
              {/* Kategori ve Marka */}
              <div className="flex items-center gap-3">
                {opportunity.brand_logo_url && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[var(--color-border)] p-0.5">
                    <img
                      src={opportunity.brand_logo_url}
                      alt={opportunity.brand_name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
                <span className="font-semibold text-sm text-[var(--color-foreground)]">
                  {opportunity.brand_name}
                </span>
                <span className="rounded bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                  {opportunity.category === "education" && "Kariyer & Eğitim"}
                  {opportunity.category === "entertainment" && "Spor & Sanat"}
                  {opportunity.category === "food" && "Yiyecek & İçecek"}
                  {opportunity.category === "travel" && "Seyahat & Yaşam"}
                  {opportunity.category === "technology" && "Teknoloji & Yazılım"}
                  {opportunity.category === "other" && "Diğer"}
                </span>
              </div>

              {/* Başlık */}
              <h1 className="mt-4 text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl">
                {opportunity.title}
              </h1>

              {/* Açıklama */}
              <div className="mt-6 border-t border-[var(--color-border)]/50 pt-6">
                <h3 className="text-base font-bold text-[var(--color-foreground)] mb-3">
                  Kampanya Detayları
                </h3>
                <p className="text-sm text-[var(--color-foreground)] leading-relaxed whitespace-pre-wrap">
                  {opportunity.description}
                </p>
              </div>

              {/* Koşullar */}
              {opportunity.conditions && opportunity.conditions.length > 0 && (
                <div className="mt-6 border-t border-[var(--color-border)]/50 pt-6">
                  <h3 className="text-base font-bold text-[var(--color-foreground)] mb-3">
                    Kampanya Koşulları
                  </h3>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--color-muted-foreground)]">
                    {opportunity.conditions.map((cond, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {cond}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sağ 1 Kolon: Fırsatı Kullan & Zamanlayıcı */}
        <div className="lg:col-span-1 space-y-6">
          {/* Fırsat Kartı Aksiyonları */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-lg">
            <h3 className="text-base font-bold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              Fırsatı Yakala
            </h3>

            {isLoggedIn ? (
              <div className="space-y-4">
                {/* İndirim Kodu Varsa Göster */}
                {opportunity.discount_code && (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/50 p-4 text-center">
                    <p className="text-xs text-[var(--color-muted-foreground)] font-medium mb-2">
                      Kampanya Kodu / Kupon Kodu
                    </p>
                    <div className="flex items-center gap-2 bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] px-3 py-2 justify-between">
                      <span className="font-mono font-bold text-sm tracking-wider text-[var(--color-foreground)]">
                        {opportunity.discount_code}
                      </span>
                      <button
                        onClick={handleCopy}
                        className="text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                        title="Kopyala"
                      >
                        {copied ? (
                          <Check className="h-4.5 w-4.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-4.5 w-4.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Yönlendirme Linki Varsa Göster */}
                {opportunity.external_link && (
                  <a
                    href={opportunity.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Fırsatı Kullan
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/20 text-center">
                <ShieldAlert className="mx-auto h-6 w-6 text-amber-600 mb-2" />
                <p className="text-xs text-amber-700 font-medium">
                  Bu öğrenci fırsatından yararlanmak ve kampanya kodunu görüntülemek için giriş yapmalısınız.
                </p>
                <div className="mt-4 flex gap-2 justify-center">
                  <Link
                    href={`/login?redirect=/opportunities/${opportunity.id}`}
                    className="rounded-lg gradient-primary px-4 py-2 text-xs font-bold text-white shadow"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-xs font-bold"
                  >
                    Kayıt Ol
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Geri Sayım Sayacı */}
          {opportunity.end_date && timeLeft && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-lg">
              <h3 className="text-sm font-bold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Kampanyanın Bitmesine Kalan Süre
              </h3>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-[var(--color-muted)] p-2">
                  <span className="block font-mono text-lg font-bold text-[var(--color-foreground)]">
                    {timeLeft.days}
                  </span>
                  <span className="text-[9px] text-[var(--color-muted-foreground)] uppercase">Gün</span>
                </div>
                <div className="rounded-lg bg-[var(--color-muted)] p-2">
                  <span className="block font-mono text-lg font-bold text-[var(--color-foreground)]">
                    {timeLeft.hours}
                  </span>
                  <span className="text-[9px] text-[var(--color-muted-foreground)] uppercase">Saat</span>
                </div>
                <div className="rounded-lg bg-[var(--color-muted)] p-2">
                  <span className="block font-mono text-lg font-bold text-[var(--color-foreground)]">
                    {timeLeft.minutes}
                  </span>
                  <span className="text-[9px] text-[var(--color-muted-foreground)] uppercase">Dk</span>
                </div>
                <div className="rounded-lg bg-[var(--color-muted)] p-2">
                  <span className="block font-mono text-lg font-bold text-[var(--color-foreground)]">
                    {timeLeft.seconds}
                  </span>
                  <span className="text-[9px] text-[var(--color-muted-foreground)] uppercase">Sn</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 justify-center text-[10px] text-[var(--color-muted-foreground)]">
                <Calendar className="h-3.5 w-3.5" />
                Son Tarih: {new Date(opportunity.end_date).toLocaleDateString("tr-TR")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
