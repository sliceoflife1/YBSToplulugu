"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, X, Loader2, Tag, Calendar, Edit2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
  created_at: string;
}

export default function OpportunitiesClient({
  initialOpportunities,
}: {
  initialOpportunities: Opportunity[];
}) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [conditionsText, setConditionsText] = useState("");
  const [category, setCategory] = useState("education");
  const [brandName, setBrandName] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [endDate, setEndDate] = useState("");

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Split conditions text by newline
    const conditions = conditionsText
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);

    const payload = {
      title,
      summary: summary || null,
      description: description || null,
      conditions,
      category,
      brand_name: brandName,
      brand_logo_url: brandLogoUrl || null,
      image_url: imageUrl || null,
      discount_code: discountCode || null,
      external_link: externalLink || null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
    };

    if (editingId) {
      // UPDATE
      const { data, error } = await supabase
        .from("opportunities")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();

      setLoading(false);

      if (error) {
        setError(error.message);
        toast.error("Fırsat güncellenirken hata: " + error.message);
      } else if (data) {
        setOpportunities(
          opportunities.map((opp) => (opp.id === editingId ? data : opp))
        );
        toast.success("Öğrenci fırsatı başarıyla güncellendi!");
        resetForm();
        router.refresh();
      }
    } else {
      // INSERT
      const { data, error } = await supabase
        .from("opportunities")
        .insert({ ...payload, is_active: true })
        .select()
        .single();

      setLoading(false);

      if (error) {
        setError(error.message);
        toast.error("Fırsat oluşturulurken hata: " + error.message);
      } else if (data) {
        setOpportunities([data, ...opportunities]);
        toast.success("Öğrenci fırsatı başarıyla oluşturuldu!");
        resetForm();
        router.refresh();
      }
    }
  };

  const startEdit = (opp: Opportunity) => {
    setEditingId(opp.id);
    setTitle(opp.title);
    setSummary(opp.summary || "");
    setDescription(opp.description || "");
    setConditionsText(opp.conditions ? opp.conditions.join("\n") : "");
    setCategory(opp.category);
    setBrandName(opp.brand_name);
    setBrandLogoUrl(opp.brand_logo_url || "");
    setImageUrl(opp.image_url || "");
    setDiscountCode(opp.discount_code || "");
    setExternalLink(opp.external_link || "");
    setEndDate(
      opp.end_date ? new Date(opp.end_date).toISOString().slice(0, 16) : ""
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSummary("");
    setDescription("");
    setConditionsText("");
    setCategory("education");
    setBrandName("");
    setBrandLogoUrl("");
    setImageUrl("");
    setDiscountCode("");
    setExternalLink("");
    setEndDate("");
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("opportunities")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (!error) {
      setOpportunities(
        opportunities.map((opp) =>
          opp.id === id ? { ...opp, is_active: !currentStatus } : opp
        )
      );
      toast.success("Fırsat durumu güncellendi!");
      router.refresh();
    } else {
      toast.error("Durum güncellenirken hata oluştu.");
    }
  };

  const deleteOpportunity = async (id: string) => {
    if (!confirm("Bu fırsatı silmek istediğinizden emin misiniz?")) return;

    const { error } = await supabase.from("opportunities").delete().eq("id", id);

    if (!error) {
      setOpportunities(opportunities.filter((opp) => opp.id !== id));
      toast.success("Fırsat silindi.");
      router.refresh();
    } else {
      toast.error("Fırsat silinirken hata oluştu: " + error.message);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Sol Panel: Yeni Ekleme / Düzenleme Formu */}
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-4">
            {editingId ? "Avantajı Düzenle" : "Yeni Avantaj Ekle"}
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Fırsat Başlığı *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Digiturk Yıldız Dolu Paket İndirimi"
                className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                  Marka Adı *
                </label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Örn: Digiturk"
                  className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                  Kategori *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
                >
                  <option value="education">Kariyer & Eğitim</option>
                  <option value="entertainment">Spor & Sanat</option>
                  <option value="food">Yiyecek & İçecek</option>
                  <option value="travel">Seyahat & Yaşam</option>
                  <option value="technology">Teknoloji & Yazılım</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Kısa Özet *
              </label>
              <input
                type="text"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Örn: Süper Lig maçları ve filmler ayda sadece 99 TL!"
                className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Açıklama / Detaylar *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fırsat detaylarını detaylıca buraya yazın..."
                className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Kampanya Koşulları (Her satıra bir koşul yazın)
              </label>
              <textarea
                rows={3}
                value={conditionsText}
                onChange={(e) => setConditionsText(e.target.value)}
                placeholder="Örn: Kampanya 31 Aralık 2026'ya kadar geçerlidir.&#10;Kişi başı kullanım limiti 1 adettir."
                className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                  İndirim/Kupon Kodu
                </label>
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Örn: AKBANKISIC"
                  className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                  Son Katılım Tarihi
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Dış Bağlantı / Yönlendirme URL'si
              </label>
              <input
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="https://akbank.com/isic"
                className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                  Kapak Görseli URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Kampanya afiş görsel URL adresi"
                  className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                  Marka Logo URL
                </label>
                <input
                  type="text"
                  value={brandLogoUrl}
                  onChange={(e) => setBrandLogoUrl(e.target.value)}
                  placeholder="Marka logo URL adresi"
                  className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none"
                />
              </div>
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
                    <Plus className="h-4 w-4" /> Oluştur
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

      {/* Sağ Panel: Mevcut Fırsatlar Listesi */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-4">
            Mevcut Avantajlar ({opportunities.length})
          </h2>

          {opportunities.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center text-[var(--color-muted-foreground)] italic">
              Henüz eklenmiş bir avantaj bulunmuyor.
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 transition-all hover:shadow-md"
                >
                  <div className="flex gap-4 items-start sm:items-center min-w-0 flex-1 mr-4">
                    {/* Marka Görseli */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-[var(--color-border)] p-1">
                      {opp.brand_logo_url ? (
                        <img
                          src={opp.brand_logo_url}
                          alt={opp.brand_name}
                          className="h-full w-full object-contain rounded-lg"
                        />
                      ) : (
                        <Tag className="h-5 w-5 text-[var(--color-primary)]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-[var(--color-foreground)] truncate">
                          {opp.title}
                        </h3>
                        <span className="rounded bg-[var(--color-primary)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">
                          {opp.category === "education" && "Eğitim & Kariyer"}
                          {opp.category === "entertainment" && "Spor & Sanat"}
                          {opp.category === "food" && "Yiyecek & İçecek"}
                          {opp.category === "travel" && "Seyahat & Yaşam"}
                          {opp.category === "technology" && "Teknoloji & Yazılım"}
                          {opp.category === "other" && "Diğer"}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-1 mt-0.5">
                        {opp.brand_name} • {opp.summary}
                      </p>
                      {opp.end_date && (
                        <p className="flex items-center gap-1 text-[10px] text-amber-500 mt-1 font-medium">
                          <Calendar className="h-3 w-3" /> Son Katılım:{" "}
                          {new Date(opp.end_date).toLocaleDateString("tr-TR")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 sm:mt-0 justify-end shrink-0">
                    {/* Aktif/İnaktif Butonu */}
                    <button
                      onClick={() => toggleActive(opp.id, opp.is_active)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                        opp.is_active
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                          : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                      }`}
                    >
                      {opp.is_active ? (
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
                      onClick={() => startEdit(opp)}
                      className="rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 p-1.5 text-xs font-semibold text-indigo-600 transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {/* Sil Butonu */}
                    <button
                      onClick={() => deleteOpportunity(opp.id)}
                      className="rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 p-1.5 text-xs font-semibold text-red-600 transition-colors"
                      title="Sil"
                    >
                      <X className="h-4 w-4" />
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
