"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, X, Loader2, Calendar, Link as LinkIcon, Image, Edit2, Trash2, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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

export default function AnnouncementsClient({
  initialAnnouncements,
  userId,
}: {
  initialAnnouncements: Announcement[];
  userId: string;
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [eventDate, setEventDate] = useState("");

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      title,
      content,
      image_url: imageUrl || null,
      external_link: externalLink || null,
      event_date: eventDate ? new Date(eventDate).toISOString() : null,
      created_by: userId,
    };

    if (editingId) {
      // UPDATE
      const { data, error } = await supabase
        .from("announcements")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();

      setLoading(false);

      if (error) {
        setError(error.message);
        toast.error("Duyuru güncellenirken hata: " + error.message);
      } else if (data) {
        setAnnouncements(
          announcements.map((ann) => (ann.id === editingId ? data : ann))
        );
        toast.success("Duyuru başarıyla güncellendi!");
        resetForm();
        router.refresh();
      }
    } else {
      // INSERT
      const { data, error } = await supabase
        .from("announcements")
        .insert({ ...payload, is_active: true })
        .select()
        .single();

      setLoading(false);

      if (error) {
        setError(error.message);
        toast.error("Duyuru eklenirken hata: " + error.message);
      } else if (data) {
        setAnnouncements([data, ...announcements]);
        toast.success("Duyuru başarıyla eklendi!");
        resetForm();
        router.refresh();
      }
    }
  };

  const startEdit = (ann: Announcement) => {
    setEditingId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    setImageUrl(ann.image_url || "");
    setExternalLink(ann.external_link || "");
    setEventDate(
      ann.event_date ? new Date(ann.event_date).toISOString().slice(0, 16) : ""
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImageUrl("");
    setExternalLink("");
    setEventDate("");
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("announcements")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (!error) {
      setAnnouncements(
        announcements.map((ann) =>
          ann.id === id ? { ...ann, is_active: !currentStatus } : ann
        )
      );
      toast.success("Duyuru durumu güncellendi!");
      router.refresh();
    } else {
      toast.error("Duyuru durumu güncellenirken hata oluştu.");
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Bu duyuruyu silmek istediğinizden emin misiniz?")) return;

    const { error } = await supabase.from("announcements").delete().eq("id", id);

    if (!error) {
      setAnnouncements(announcements.filter((ann) => ann.id !== id));
      toast.success("Duyuru silindi.");
      router.refresh();
    } else {
      toast.error("Duyuru silinirken hata oluştu: " + error.message);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Sol Panel: Ekleme & Düzenleme Formu */}
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-4">
            {editingId ? "Duyuruyu Düzenle" : "Yeni Duyuru & Etkinlik Ekle"}
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Başlık *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: YBS Kariyer Zirvesi 2026"
                className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                İçerik Açıklaması *
              </label>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Duyuru veya etkinlik detaylarını yazın..."
                className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Görsel URL
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Etkinlik afişi görsel URL adresi"
                className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Detay / Kayıt Linki (Harici Bağlantı)
              </label>
              <input
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://form.deu.edu.tr/ybs-kayit"
                className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Etkinlik Tarihi (Opsiyonel)
              </label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId ? (
                  "Güncelle"
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Ekle
                  </>
                )}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-sm font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
                >
                  İptal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Sağ Panel: Mevcut Duyurular Listesi */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-4">
            Yayındaki Duyuru ve Etkinlikler ({announcements.length})
          </h2>

          {announcements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center text-[var(--color-muted-foreground)] italic">
              Henüz eklenmiş bir duyuru bulunmuyor.
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 transition-all hover:shadow-md"
                >
                  <div className="flex gap-4 items-start sm:items-center min-w-0 flex-1 mr-4">
                    {/* Duyuru Görseli / İkonu */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-[var(--color-border)] overflow-hidden">
                      {ann.image_url ? (
                        <img
                          src={ann.image_url}
                          alt={ann.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Megaphone className="h-5 w-5 text-indigo-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-[var(--color-foreground)] truncate">
                          {ann.title}
                        </h3>
                      </div>
                      <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2 mt-0.5 whitespace-pre-wrap">
                        {ann.content}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-[var(--color-muted-foreground)]">
                        {ann.event_date && (
                          <span className="flex items-center gap-1 text-amber-600 font-medium">
                            <Calendar className="h-3 w-3" />
                            Etkinlik: {new Date(ann.event_date).toLocaleString("tr-TR")}
                          </span>
                        )}
                        {ann.external_link && (
                          <span className="flex items-center gap-1 text-indigo-500 font-medium">
                            <LinkIcon className="h-3 w-3" />
                            Kayıt Linki Var
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 sm:mt-0 justify-end shrink-0">
                    {/* Aktif/İnaktif Butonu */}
                    <button
                      onClick={() => toggleActive(ann.id, ann.is_active)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                        ann.is_active
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                          : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                      }`}
                    >
                      {ann.is_active ? (
                        <>
                          <Check className="h-3 w-3" />
                          Aktif
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3" />
                          Pasif
                        </>
                      )}
                    </button>

                    {/* Düzenle Butonu */}
                    <button
                      onClick={() => startEdit(ann)}
                      className="rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 p-1.5 text-xs font-semibold text-indigo-600 transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {/* Sil Butonu */}
                    <button
                      onClick={() => deleteAnnouncement(ann.id)}
                      className="rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 p-1.5 text-xs font-semibold text-red-600 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
