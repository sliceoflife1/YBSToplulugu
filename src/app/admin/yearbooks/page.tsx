"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, BookOpen, Plus, Trash2, ShieldAlert, Check, X, ToggleLeft, ToggleRight, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import { toast } from "sonner";

export default function AdminYearbooksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [yearbooks, setYearbooks] = useState<any[]>([]);
  const [newYear, setNewYear] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function checkAuthAndLoad() {
      // 1. Kullanıcı kontrolü
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 2. Rol kontrolü
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || !["admin", "moderator", "faculty"].includes(profile.role)) {
        toast.error("Bu sayfaya erişim yetkiniz bulunmamaktadır.");
        router.push("/dashboard");
        return;
      }

      // 3. Yılları yükle
      await loadYearbooks();
      setLoading(false);
    }
    checkAuthAndLoad();
  }, [router]);

  async function loadYearbooks() {
    try {
      const res = await fetch("/api/admin/yearbooks");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yıllar yüklenemedi");
      setYearbooks(data.yearbooks || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // Yeni Yıl Ekle
  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYear.trim() || isNaN(Number(newYear))) {
      toast.error("Lütfen geçerli bir yıl girin (Örn: 2026)");
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/yearbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: Number(newYear), isActive: true })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Ekleme başarısız");

      toast.success(`${newYear} mezuniyet yılı başarıyla eklendi!`);
      setNewYear("");
      await loadYearbooks();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Aktif/Pasif Durumunu Değiştir
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/yearbooks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Güncelleme başarısız");

      toast.success(currentStatus ? "Yıllık dönemi pasifleştirildi." : "Yıllık dönemi aktifleştirildi.");
      
      setYearbooks((prev) =>
        prev.map((y) => (y.id === id ? { ...y, is_active: !currentStatus } : y))
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Yılı Sil
  const handleDeleteYear = async (id: string, yearValue: number) => {
    if (!confirm(`${yearValue} mezuniyet yılını silmek istediğinize emin misiniz? Bu yıla kayıtlı öğrencilerin andıçları silinmeyecek fakat bu yıla ait listelemeler pasif kalacaktır.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/yearbooks?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Silme başarısız");

      toast.success(`${yearValue} yılı silindi.`);
      setYearbooks((prev) => prev.filter((y) => y.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        {/* Back Link */}
        <Link href="/admin" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
          <ArrowLeft className="h-4 w-4" /> Yönetici Paneline Dön
        </Link>

        {/* Header */}
        <div className="mb-8 border-b border-[var(--color-border)] pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-indigo-500" />
              Andıç Dönemi (Yıllık) Yönetimi
            </h1>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              Öğrencilerin andıç modülünde seçebileceği mezuniyet yıllarını yönetin, aktif/pasif durumlarını değiştirin veya silin.
            </p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Sol: Yeni Yıl Ekleme Formu */}
          <div className="md:col-span-1">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-md">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Plus className="h-5 w-5 text-indigo-500" />
                Yeni Dönem Ekle
              </h2>
              <form onSubmit={handleAddYear} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5">Mezuniyet Yılı</label>
                  <input
                    type="number"
                    min="2020"
                    max="2050"
                    placeholder="Örn: 2026"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
                >
                  {submitting ? "Ekleniyor..." : "Yıllık Ekle"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 shadow-sm mt-4 text-xs text-yellow-700 dark:text-yellow-400 space-y-2 flex flex-col">
              <span className="font-bold flex items-center gap-1.5"><ShieldAlert className="h-4 w-4 shrink-0" /> Otomatik Oluşturma</span>
              <p>
                Sistem, her yılın 1 Ocak tarihinde yeni yılın andıç kaydını (örn: 2026) otomatik olarak oluşturacaktır. Yöneticinin manuel olarak yeni yıl eklemesine (çok acil durumlar dışında) gerek yoktur.
              </p>
            </div>
          </div>

          {/* Sağ: Yıllar Listesi */}
          <div className="md:col-span-2">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/50 shadow-md overflow-hidden backdrop-blur-md">
              <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-between">
                <span className="font-bold text-md text-[var(--color-foreground)]">Kayıtlı Yıllık Dönemleri</span>
                <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-500/20">{yearbooks.length} Toplam</span>
              </div>

              {yearbooks.length === 0 ? (
                <div className="p-8 text-center bg-[var(--color-card)]/30">
                  <BookOpen className="mx-auto h-8 w-8 text-[var(--color-muted-foreground)] opacity-50" />
                  <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">Henüz eklenmiş bir yıllık dönemi bulunmuyor.</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border)] bg-[var(--color-card)]/30">
                  {yearbooks.map((yb) => (
                    <div key={yb.id} className="flex items-center justify-between p-4 hover:bg-[var(--color-muted)]/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 font-extrabold text-indigo-600 border border-indigo-500/20">
                          {yb.year}
                        </span>
                        <div>
                          <p className="font-bold text-sm">{yb.year} Mezuniyet Yıllığı</p>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${yb.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                            {yb.is_active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {yb.is_active ? "Aktif (Yayında)" : "Pasif (Gizli)"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Toggle Active Switch */}
                        <button
                          onClick={() => handleToggleActive(yb.id, yb.is_active)}
                          title={yb.is_active ? "Pasifleştir" : "Aktifleştir"}
                          className="text-[var(--color-muted-foreground)] hover:text-indigo-600 transition-colors"
                        >
                          {yb.is_active ? (
                            <ToggleRight className="h-7 w-7 text-emerald-500 shrink-0 cursor-pointer" />
                          ) : (
                            <ToggleLeft className="h-7 w-7 text-[var(--color-muted-foreground)] shrink-0 cursor-pointer" />
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteYear(yb.id, yb.year)}
                          title="Sil"
                          className="rounded-lg p-2 text-red-500 hover:bg-red-500/10 transition-colors"
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
      </main>
    </div>
  );
}
