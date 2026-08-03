"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, X, Loader2, Pencil, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Subreddit } from "@/types/database";

export default function SubredditsClient({
  initialSubreddits,
  userId,
}: {
  initialSubreddits: Subreddit[];
  userId: string;
}) {
  const [subreddits, setSubreddits] = useState<Subreddit[]>(initialSubreddits);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [icon, setIcon] = useState("");

  const supabase = createClient();

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setColor("#3B82F6");
    setIcon("");
    setError(null);
  };

  const startEdit = (sub: Subreddit) => {
    setEditingId(sub.id);
    setName(sub.name);
    setSlug(sub.slug);
    setDescription(sub.description || "");
    setColor(sub.color || "#3B82F6");
    setIcon(sub.icon || "");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (editingId) {
      // UPDATE
      const { data, error } = await supabase
        .from("subreddits")
        .update({
          name,
          slug,
          description,
          color,
          icon,
        })
        .eq("id", editingId)
        .select()
        .single();

      setLoading(false);

      if (error) {
        setError(error.message);
      } else if (data) {
        setSubreddits(subreddits.map((s) => (s.id === editingId ? { ...s, ...data } : s)));
        resetForm();
        router.refresh();
      }
    } else {
      // INSERT
      const { data, error } = await supabase
        .from("subreddits")
        .insert({
          name,
          slug,
          description,
          color,
          icon,
          created_by: userId,
          is_active: true,
        })
        .select()
        .single();

      setLoading(false);

      if (error) {
        setError(error.message);
      } else if (data) {
        setSubreddits([data, ...subreddits]);
        resetForm();
        router.refresh();
      }
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("subreddits")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (!error) {
      setSubreddits(subreddits.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
      router.refresh();
    } else {
      alert("Durum güncellenirken bir hata oluştu.");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Ekleme / Düzenleme Formu */}
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--color-foreground)]">
              {editingId ? "Forum Düzenle" : "Yeni Forum Ekle"}
            </h2>
            {editingId && (
              <button
                onClick={resetForm}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Vazgeç
              </button>
            )}
          </div>
          
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Forum Adı</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingId && (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''));
                  }
                }}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
                placeholder="Örn: Yazılım Geliştirme"
              />
            </div>
            
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">URL Kısaltması (Slug)</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
                placeholder="yazilim-gelistirme"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Açıklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none resize-none"
                placeholder="Bu forum ne hakkında?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Tema Rengi</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">İkon (Emoji)</label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  maxLength={2}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none text-center text-xl"
                  placeholder="💻"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : editingId ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                {loading
                  ? editingId
                    ? "Güncelleniyor..."
                    : "Ekleniyor..."
                  : editingId
                  ? "Güncelle"
                  : "Forum Oluştur"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Liste */}
      <div className="lg:col-span-2">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--color-muted-foreground)]">
              <thead className="bg-[var(--color-muted)]/50 text-xs uppercase text-[var(--color-foreground)]">
                <tr>
                  <th className="px-6 py-4 font-medium">Forum</th>
                  <th className="px-6 py-4 font-medium">Gönderiler</th>
                  <th className="px-6 py-4 font-medium text-center">Durum</th>
                  <th className="px-6 py-4 font-medium text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {subreddits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">Henüz forum oluşturulmamış.</td>
                  </tr>
                ) : (
                  subreddits.map((sub) => (
                    <tr key={sub.id} className={`transition-colors hover:bg-[var(--color-muted)]/30 ${editingId === sub.id ? "bg-[var(--color-primary)]/5" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold shrink-0"
                            style={{ backgroundColor: sub.color }}
                          >
                            {sub.icon || sub.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--color-foreground)]">{sub.name}</p>
                            <p className="text-xs">/{sub.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {sub.post_count}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${sub.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                          {sub.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(sub)}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-muted)] text-[var(--color-foreground)]"
                            title="Düzenle"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Düzenle
                          </button>
                          <button
                            onClick={() => toggleActive(sub.id, sub.is_active)}
                            className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-muted)]"
                          >
                            {sub.is_active ? "Pasife Al" : "Aktife Al"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
