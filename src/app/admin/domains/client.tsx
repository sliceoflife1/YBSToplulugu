"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Define the Domain type directly since it might not be in database types properly
type Domain = {
  id: string;
  domain: string;
  role_hint: string;
  university_name: string | null;
  is_active: boolean;
  created_at: string;
};

export default function DomainsClient({ initialDomains }: { initialDomains: Domain[] }) {
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form State
  const [domain, setDomain] = useState("");
  const [roleHint, setRoleHint] = useState("student");
  const [universityName, setUniversityName] = useState("");

  const supabase = createClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("allowed_email_domains")
      .insert({
        domain,
        role_hint: roleHint,
        university_name: universityName || null,
        is_active: true,
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      setError(error.message);
    } else if (data) {
      setDomains([data as Domain, ...domains]);
      setDomain("");
      setRoleHint("student");
      setUniversityName("");
      router.refresh();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("allowed_email_domains")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (!error) {
      setDomains(domains.map(d => d.id === id ? { ...d, is_active: !currentStatus } : d));
      router.refresh();
    } else {
      alert("Durum güncellenirken bir hata oluştu.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu domain'i silmek istediğinize emin misiniz? (Önceden kayıt olan kullanıcılar etkilenmez)")) return;

    const { error } = await supabase
      .from("allowed_email_domains")
      .delete()
      .eq("id", id);

    if (!error) {
      setDomains(domains.filter(d => d.id !== id));
      router.refresh();
    } else {
      alert("Silinirken bir hata oluştu: " + error.message);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Yeni Ekleme Formu */}
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-4">Yeni Domain Ekle</h2>
          
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Domain</label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
                placeholder="Örn: metu.edu.tr"
              />
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">@ işaretini eklemeyin.</p>
            </div>
            
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Üniversite Adı</label>
              <input
                type="text"
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
                placeholder="Orta Doğu Teknik Üniversitesi"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Varsayılan Rol</label>
              <select
                value={roleHint}
                onChange={(e) => setRoleHint(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="student">Öğrenci</option>
                <option value="faculty">Akademisyen</option>
                <option value="any">Her İkisi</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg gradient-primary px-4 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-4"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              {loading ? "Ekleniyor..." : "Domain Ekle"}
            </button>
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
                  <th className="px-6 py-4 font-medium">Domain</th>
                  <th className="px-6 py-4 font-medium">Kurum</th>
                  <th className="px-6 py-4 font-medium">Varsayılan Rol</th>
                  <th className="px-6 py-4 font-medium text-center">Durum</th>
                  <th className="px-6 py-4 font-medium text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {domains.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">Henüz domain eklenmemiş.</td>
                  </tr>
                ) : (
                  domains.map((dom) => (
                    <tr key={dom.id} className="hover:bg-[var(--color-muted)]/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-[var(--color-foreground)]">
                        @{dom.domain}
                      </td>
                      <td className="px-6 py-4">
                        {dom.university_name || "-"}
                      </td>
                      <td className="px-6 py-4 capitalize">
                        {dom.role_hint}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${dom.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                          {dom.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => toggleActive(dom.id, dom.is_active)}
                            className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-muted)]"
                          >
                            {dom.is_active ? "Kapat" : "Aç"}
                          </button>
                          <button
                            onClick={() => handleDelete(dom.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20"
                          >
                            Sil
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
