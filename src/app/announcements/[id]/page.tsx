import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Megaphone, ExternalLink, Globe } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";

export const dynamic = "force-dynamic";

interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  external_link: string | null;
  event_date: string | null;
  is_active: boolean;
  created_at: string;
}

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminSupabase = createAdminClient();

  // Duyuru detayını çek
  const { data: ann } = await adminSupabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single<Announcement>();

  if (!ann) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]/30">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Geri Dön Butonu */}
          <Link
            href="/announcements"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-4 w-4" /> Tüm Duyurulara Geri Dön
          </Link>

          {/* Kart Gövdesi */}
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg">
            {/* Kapak Resmi */}
            <div className="relative aspect-video w-full bg-[var(--color-muted)]">
              {ann.image_url ? (
                <img
                  src={ann.image_url}
                  alt={ann.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/5 to-purple-500/10">
                  <Megaphone className="h-16 w-16 text-[var(--color-primary)] opacity-30" />
                </div>
              )}
            </div>

            {/* İçerik Alanı */}
            <div className="p-6 sm:p-8">
              {/* Tarih ve Rozet */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                  {ann.event_date ? "Etkinlik" : "Duyuru"}
                </span>
                <span className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                  <Calendar className="h-3.5 w-3.5" />
                  Yayınlanma: {new Date(ann.created_at).toLocaleDateString("tr-TR")}
                </span>
              </div>

              {/* Başlık */}
              <h1 className="mt-4 text-2xl font-bold text-[var(--color-foreground)] sm:text-3xl lg:text-4xl">
                {ann.title}
              </h1>

              {/* Detay Açıklaması */}
              <div className="mt-6 border-t border-[var(--color-border)]/50 pt-6">
                <p className="text-sm text-[var(--color-foreground)] leading-relaxed whitespace-pre-wrap">
                  {ann.content}
                </p>
              </div>

              {/* Ek Detaylar / Aksiyonlar */}
              {(ann.event_date || ann.external_link) && (
                <div className="mt-8 grid gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-5 sm:grid-cols-2">
                  {/* Etkinlik Tarihi */}
                  {ann.event_date && (
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-muted-foreground)]">Etkinlik Zamanı</span>
                      <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-amber-600">
                        <Calendar className="h-4.5 w-4.5" />
                        {new Date(ann.event_date).toLocaleString("tr-TR")}
                      </span>
                    </div>
                  )}

                  {/* Harici Bağlantı Düğmesi */}
                  {ann.external_link && (
                    <div className="flex items-center sm:justify-end">
                      <a
                        href={ann.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Detaylar & Kayıt
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
