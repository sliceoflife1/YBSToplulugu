import Link from "next/link";
import { Search, Calendar, ArrowRight, Megaphone } from "lucide-react";
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

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const adminSupabase = createAdminClient();
  const params = await searchParams;
  const searchQuery = params.query || "";

  // Bütün aktif duyuruları çek
  let { data: announcements } = await adminSupabase
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Arama filtrelemesi
  let filteredAnnouncements = announcements || [];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredAnnouncements = filteredAnnouncements.filter(
      (ann) =>
        ann.title.toLowerCase().includes(q) ||
        ann.content.toLowerCase().includes(q)
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]/30">
      <Navbar />
      <main className="flex-1">
        {/* Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-16 text-white shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl animate-fade-in">
              Etkinlikler & Duyurular
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-indigo-100 animate-fade-in-delay">
              Bölümümüzdeki, üniversitemizdeki ve öğrenci topluluğumuzdaki en güncel haberler, etkinlikler ve organizasyonlar.
            </p>
          </div>
        </div>

        {/* Arama Filtresi */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-6 flex-wrap gap-4">
            <h2 className="text-lg font-bold text-[var(--color-foreground)]">
              Tüm Duyurular ({filteredAnnouncements.length})
            </h2>

            <form method="GET" action="/announcements" className="relative w-full max-w-xs">
              <input
                type="text"
                name="query"
                defaultValue={searchQuery}
                placeholder="Duyurularda ara..."
                className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] py-2.5 pl-10 pr-4 text-xs focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--color-muted-foreground)]" />
            </form>
          </div>

          {/* Duyuru Listesi */}
          {filteredAnnouncements.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAnnouncements.map((ann) => (
                <Link
                  key={ann.id}
                  href={`/announcements/${ann.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Görsel */}
                  <div className="relative aspect-video w-full overflow-hidden bg-[var(--color-muted)]">
                    {ann.image_url ? (
                      <img
                        src={ann.image_url}
                        alt={ann.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/5 to-purple-500/10">
                        <Megaphone className="h-10 w-10 text-[var(--color-primary)] opacity-40" />
                      </div>
                    )}
                    
                    {ann.event_date && (
                      <span className="absolute right-4 top-4 rounded-lg bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(ann.event_date).toLocaleDateString("tr-TR")}
                      </span>
                    )}
                  </div>

                  {/* Detay */}
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">
                      {ann.event_date ? "Etkinlik" : "Duyuru"}
                    </span>
                    <h3 className="mt-2 text-base font-bold text-[var(--color-foreground)] transition-colors group-hover:text-[var(--color-primary)] line-clamp-1">
                      {ann.title}
                    </h3>
                    <p className="mt-2 flex-1 text-xs text-[var(--color-muted-foreground)] line-clamp-3 whitespace-pre-wrap">
                      {ann.content}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] group-hover:underline">
                      Devamını Oku
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-16 text-center shadow-sm">
              <Megaphone className="mx-auto h-12 w-12 text-[var(--color-muted-foreground)] opacity-50" />
              <h3 className="mt-4 text-lg font-bold text-[var(--color-foreground)]">
                Duyuru bulunamadı
              </h3>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                Şu anda yayında aktif bir duyuru bulunmuyor veya aramanızla eşleşen sonuç yok.
              </p>
              {searchQuery && (
                <Link
                  href="/announcements"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white shadow"
                >
                  Tümünü Göster
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
