"use client";

import { useState, useEffect } from "react";
import { Building2, Globe, Mail, Phone, Info, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OrganizationData {
  id?: string;
  name: string;
  type: string;
  description: string;
  website_url: string;
  contact_email: string;
  contact_phone: string;
  logo_url: string;
  approval_status?: string;
}

export function EmployerOrganizationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgData, setOrgData] = useState<OrganizationData>({
    name: "",
    type: "employer",
    description: "",
    website_url: "",
    contact_email: "",
    contact_phone: "",
    logo_url: "",
  });

  useEffect(() => {
    async function fetchOrg() {
      try {
        const res = await fetch("/api/user/organization");
        if (res.ok) {
          const data = await res.json();
          if (data.organization) {
            setOrgData({
              id: data.organization.id,
              name: data.organization.name || "",
              type: data.organization.type || "employer",
              description: data.organization.description || "",
              website_url: data.organization.website_url || "",
              contact_email: data.organization.contact_email || "",
              contact_phone: data.organization.contact_phone || "",
              logo_url: data.organization.logo_url || "",
              approval_status: data.organization.approval_status,
            });
          }
        }
      } catch (err) {
        console.error("Kurum bilgileri çekilirken hata:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgData.name.trim()) {
      toast.error("Lütfen şirket/kurum adını giriniz.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Şirket profili kaydedilemedi.");
      }

      toast.success("Şirket/Kurum profili başarıyla güncellendi ve hesabınıza bağlandı!");
      if (data.organization) {
        setOrgData((prev) => ({ ...prev, id: data.organization.id }));
      }
    } catch (err: any) {
      toast.error(err.message || "Bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Bilgilendirme ve Geçiş Rehberi Kutusu */}
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 text-sm text-[var(--color-foreground)]">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-base text-blue-700 dark:text-blue-400">
              İşveren Temsilcisi Hesabından Resmi Kurumsal Şirket Profiline Geçiş
            </h3>
            <p className="text-[var(--color-muted-foreground)] leading-relaxed">
              Kayıt formunda <strong>&quot;Kuruluş / İşveren&quot;</strong> seçeneğini seçtiğinizde sisteme bireysel temsilci hesabı olarak dahil olursunuz.
              Aşağıdaki form aracılığıyla temsil ettiğiniz şirketi veya kurumu platforma kaydettiğinizde hesabınız otomatik olarak resmi bir <strong>Şirket Profiline (`organizations`)</strong> bağlanır.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs">
              <div className="flex items-center gap-2 rounded-lg bg-white/60 dark:bg-black/20 p-2.5 border border-blue-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Şirketiniz Keşfet (`/explore`) sayfasındaki <strong>&quot;Kurumlar &amp; İşverenler&quot;</strong> sekmesinde resmi kart olarak listelenir.</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/60 dark:bg-black/20 p-2.5 border border-blue-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Yayınlayacağınız staj ve iş ilanları bu kurumsal profil altında resmi marka logosuyla görünür.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Şirket / Kurum Formu */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[var(--color-primary)]" />
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              {orgData.id ? "Kurumsal Şirket Bilgilerini Düzenle" : "Yeni Kurumsal Şirket Profilinizi Oluşturun"}
            </h3>
          </div>
          {orgData.id && (
            <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-3 py-1 text-xs font-medium border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Kayıtlı &amp; Onaylı Kurum
            </span>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Şirket / Kurum Adı */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-semibold text-[var(--color-foreground)]">
              Şirket / Kurum Adı <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
              <input
                type="text"
                required
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                placeholder="Örn: TeknoBilişim A.Ş. veya DEÜ Girişimcilik Kulübü"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-4 py-2.5 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Kurum Türü */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--color-foreground)]">
              Kurum Türü <span className="text-red-500">*</span>
            </label>
            <select
              value={orgData.type}
              onChange={(e) => setOrgData({ ...orgData, type: e.target.value })}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="employer">İşveren / Özel Şirket</option>
              <option value="foundation">Vakıf</option>
              <option value="association">Dernek / Sivil Toplum Kuruluşu</option>
              <option value="other">Diğer Organizasyon</option>
            </select>
          </div>

          {/* Web Sitesi URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--color-foreground)]">
              Resmi Web Sitesi URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
              <input
                type="url"
                value={orgData.website_url}
                onChange={(e) => setOrgData({ ...orgData, website_url: e.target.value })}
                placeholder="https://www.teknobilisim.com"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-4 py-2.5 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* İletişim E-Postası */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--color-foreground)]">
              Kurumsal İletişim E-Postası
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
              <input
                type="email"
                value={orgData.contact_email}
                onChange={(e) => setOrgData({ ...orgData, contact_email: e.target.value })}
                placeholder="ik@teknobilisim.com"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-4 py-2.5 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* İletişim Telefonu */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--color-foreground)]">
              Kurumsal İletişim Telefonu
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
              <input
                type="text"
                value={orgData.contact_phone}
                onChange={(e) => setOrgData({ ...orgData, contact_phone: e.target.value })}
                placeholder="+90 232 000 00 00"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-4 py-2.5 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>

          {/* Logo URL */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-semibold text-[var(--color-foreground)]">
              Şirket Logosu Görsel URL Adresi
            </label>
            <input
              type="url"
              value={orgData.logo_url}
              onChange={(e) => setOrgData({ ...orgData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Şirket Hakkında Açıklama */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-semibold text-[var(--color-foreground)]">
              Şirket / Kurum Hakkında Açıklama (Faaliyet Alanları vb.)
            </label>
            <textarea
              rows={4}
              value={orgData.description}
              onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
              placeholder="Şirketinizin vizyonu, misyonu, sunduğu staj ve kariyer olanakları hakkında kısa bilgi yazınız..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
        </div>

        {/* Kaydet Butonu */}
        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 shadow-md"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Kaydediliyor...
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4" /> Şirket Profilini Kaydet &amp; Bağla
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
