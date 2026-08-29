"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { Search, Trash2, Edit, KeyRound, AlertTriangle, X, Check, Power } from "lucide-react";
import { toast } from "sonner";

export default function UsersClient({ initialUsers }: { initialUsers: Profile[] }) {
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal State'leri
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [userToEdit, setUserToEdit] = useState<Profile | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<Profile | null>(null);

  // Düzenleme Form State
  const [editFormData, setEditFormData] = useState<{
    first_name: string;
    last_name: string;
    edu_email: string;
    role: Profile["role"];
    department: string;
    phone: string;
    student_no: string;
    is_active: boolean;
    admin_gmail: string;
  }>({
    first_name: "",
    last_name: "",
    edu_email: "",
    role: "student",
    department: "",
    phone: "",
    student_no: "",
    is_active: true,
    admin_gmail: "",
  });

  const supabase = createClient();
  const router = useRouter();

  // 1. Silme İşlemi
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    const deletedName = `${userToDelete.first_name || ''} ${userToDelete.last_name || ''}`.trim() || userToDelete.edu_email;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error || "Kullanıcı silinemedi"));
      }

      toast.success(`${deletedName} isimli kullanıcı başarıyla silindi.`);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
      router.refresh();
    } catch (err: any) {
      const errMsg = typeof err === "string" ? err : err?.message || "Kullanıcı silinirken bir hata oluştu.";
      toast.error(errMsg && errMsg !== "{}" ? errMsg : "Kullanıcı silinirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Düzenleme Modalını Açma
  const openEditModal = (user: Profile) => {
    setUserToEdit(user);
    setEditFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      edu_email: user.edu_email || "",
      role: user.role,
      department: user.department || "",
      phone: user.phone || "",
      student_no: user.student_no || "",
      is_active: user.is_active ?? true,
      admin_gmail:
        user.admin_gmail ||
        (user.personal_email?.toLowerCase().endsWith("@gmail.com")
          ? user.personal_email
          : ""),
    });
  };

  // 3. Düzenleme Kaydetme İşlemi
  const handleSaveEdit = async () => {
    if (!userToEdit) return;
    setLoading(true);

    try {
      const payload = {
        ...editFormData,
        admin_gmail:
          editFormData.admin_gmail && editFormData.admin_gmail.trim() !== ""
            ? editFormData.admin_gmail.trim().toLowerCase()
            : null,
        student_no:
          editFormData.student_no && editFormData.student_no.trim() !== ""
            ? editFormData.student_no.trim()
            : null,
      };

      const res = await fetch(`/api/admin/users/${userToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Güncelleme başarısız");
      }

      toast.success("Kullanıcı bilgileri başarıyla güncellendi.");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userToEdit.id
            ? { ...u, ...editFormData, admin_gmail: payload.admin_gmail }
            : u
        )
      );
      setUserToEdit(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Güncelleme hatası");
    } finally {
      setLoading(false);
    }
  };

  // 4. Şifre Sıfırlama E-Postası Gönderme İşlemi
  const handleSendResetPassword = async () => {
    if (!userToResetPassword) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${userToResetPassword.id}/reset-password`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Şifre sıfırlama e-postası gönderilemedi");
      }

      toast.success(data.message || "Şifre sıfırlama bağlantısı e-posta ile gönderildi.");
      setUserToResetPassword(null);
    } catch (err: any) {
      toast.error(err?.message || "E-posta gönderim hatası");
    } finally {
      setLoading(false);
    }
  };

  // 5. Hızlı Aktif/Engelli Toggle
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!res.ok) throw new Error("Durum değiştirilemedi");

      setUsers(users.map((u) => (u.id === id ? { ...u, is_active: !currentStatus } : u)));
      toast.success(!currentStatus ? "Kullanıcı aktife alındı" : "Kullanıcı engellendi");
      router.refresh();
    } catch {
      toast.error("Durum güncellenirken bir hata oluştu");
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.toLowerCase();
    return (
      (u.first_name || "").toLowerCase().includes(term) ||
      (u.last_name || "").toLowerCase().includes(term) ||
      (u.edu_email || "").toLowerCase().includes(term) ||
      (u.student_no || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            placeholder="İsim, e-posta veya öğrenci no ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-4 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Toplam {filteredUsers.length} kullanıcı listeleniyor
        </p>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--color-muted-foreground)]">
            <thead className="bg-[var(--color-muted)]/50 text-xs uppercase text-[var(--color-foreground)]">
              <tr>
                <th className="px-6 py-4 font-medium">Kullanıcı</th>
                <th className="px-6 py-4 font-medium">İletişim / No</th>
                <th className="px-6 py-4 font-medium">Rol</th>
                <th className="px-6 py-4 font-medium text-center">Durum</th>
                <th className="px-6 py-4 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">Kullanıcı bulunamadı.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--color-muted)]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/u/${user.id}`}
                          target="_blank"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg gradient-primary text-white font-bold transition-transform hover:scale-105"
                          title="Profilini görüntüle"
                        >
                          {(user.first_name || "?").charAt(0).toUpperCase()}
                        </Link>
                        <div className="min-w-0">
                          <Link
                            href={`/u/${user.id}`}
                            target="_blank"
                            className="font-semibold text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors truncate block"
                            title="Profilini görüntüle"
                          >
                            {user.first_name} {user.last_name}
                          </Link>
                          <p className="text-xs truncate">{user.department || "Bölüm Yok"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[var(--color-foreground)] font-mono text-xs">{user.edu_email}</p>
                      <p className="text-xs">{user.student_no || user.phone || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-primary)]">
                        {user.role === "student"
                          ? "Öğrenci"
                          : user.role === "alumni"
                          ? "Mezun"
                          : user.role === "faculty"
                          ? "Akademisyen"
                          : user.role === "employer"
                          ? "İşveren"
                          : user.role === "moderator"
                          ? "Moderatör"
                          : "Admin"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${user.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                        {user.is_active ? 'Aktif' : 'Engelli'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Düzenle Button */}
                        <button
                          onClick={() => openEditModal(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)]"
                          title="Bilgileri Düzenle"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        {/* Şifre Sıfırlama Button */}
                        <button
                          onClick={() => setUserToResetPassword(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-amber-600 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/20"
                          title="Şifre Sıfırlama Bağlantısı Gönder"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>

                        {/* Engelle / Aktife Al Button */}
                        <button
                          onClick={() => toggleActive(user.id, user.is_active ?? false)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] transition-colors ${
                            user.is_active
                              ? "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                          }`}
                          title={user.is_active ? "Engelle" : "Aktife Al"}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>

                        {/* Tamamen Sil Button */}
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600 transition-colors hover:bg-red-500/20"
                          title="Kullanıcıyı Tamamen Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* 🔴 SİLME ONAY MODALI */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="rounded-full bg-red-500/10 p-2.5">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-foreground)]">Kullanıcıyı Tamamen Sil</h3>
            </div>
            <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed mb-4">
              <strong className="text-[var(--color-foreground)]">
                {userToDelete.first_name} {userToDelete.last_name} ({userToDelete.edu_email})
              </strong>{" "}
              isimli kullanıcıyı ve kullanıcıya ait tüm projeleri, başvuruları ve profili sistemden tamamen silmek istediğinizden emin misiniz?
            </p>
            <div className="rounded-lg bg-red-500/10 p-3 text-xs font-semibold text-red-600 mb-6">
              ⚠️ Uyarı: Bu işlem GERİ ALINAMAZ ve veriler kurtarılamaz!
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={loading}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={loading}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700 shadow-md shadow-red-500/20 disabled:opacity-50"
              >
                {loading ? "Siliniyor..." : "Evet, Kullanıcıyı Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ DÜZENLEME MODALI */}
      {userToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl my-8">
            <div className="flex items-center justify-between mb-4 border-b border-[var(--color-border)] pb-3">
              <h3 className="text-lg font-bold text-[var(--color-foreground)] flex items-center gap-2">
                <Edit className="h-5 w-5 text-[var(--color-primary)]" />
                Kullanıcı Bilgilerini Düzenle
              </h3>
              <button
                onClick={() => setUserToEdit(null)}
                className="rounded-lg p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-muted-foreground)]">
                    Ad *
                  </label>
                  <input
                    type="text"
                    value={editFormData.first_name}
                    onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-muted-foreground)]">
                    Soyad *
                  </label>
                  <input
                    type="text"
                    value={editFormData.last_name}
                    onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-muted-foreground)]">
                  E-Posta Adresi *
                </label>
                <input
                  type="email"
                  value={editFormData.edu_email}
                  onChange={(e) => setEditFormData({ ...editFormData, edu_email: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center justify-between text-xs font-medium text-[var(--color-muted-foreground)]">
                  <span>İkincil / Admin E-Postası (@gmail.com)</span>
                  {editFormData.role === "admin" && (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">* Admin için Zorunlu</span>
                  )}
                </label>
                <input
                  type="email"
                  placeholder="ornek@gmail.com"
                  value={editFormData.admin_gmail}
                  onChange={(e) => setEditFormData({ ...editFormData, admin_gmail: e.target.value })}
                  className={`w-full rounded-lg border bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none ${
                    editFormData.role === "admin" && (!editFormData.admin_gmail || !editFormData.admin_gmail.toLowerCase().endsWith("@gmail.com"))
                      ? "border-amber-500 ring-1 ring-amber-500/30 focus:border-amber-500"
                      : "border-[var(--color-border)] focus:border-[var(--color-primary)]"
                  }`}
                />
                <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
                  Admin 2FA ve güvenlik ayarları için @gmail.com uzantılı olmalıdır.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-muted-foreground)]">
                    Kullanıcı Rolü *
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as Profile["role"] })}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
                  >
                    <option value="student">Öğrenci</option>
                    <option value="alumni">Mezun</option>
                    <option value="faculty">Akademisyen</option>
                    <option value="employer">İşveren</option>
                    <option value="moderator">Moderatör</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-muted-foreground)]">
                    Hesap Durumu
                  </label>
                  <select
                    value={editFormData.is_active ? "active" : "disabled"}
                    onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value === "active" })}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
                  >
                    <option value="active">Aktif</option>
                    <option value="disabled">Engelli</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-muted-foreground)]">
                  Bölüm / Birim
                </label>
                <input
                  type="text"
                  value={editFormData.department}
                  onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-muted-foreground)]">
                    Öğrenci No
                  </label>
                  <input
                    type="text"
                    value={editFormData.student_no}
                    onChange={(e) => setEditFormData({ ...editFormData, student_no: e.target.value })}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--color-muted-foreground)]">
                    Telefon
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-[var(--color-border)] pt-4">
              <button
                onClick={() => setUserToEdit(null)}
                disabled={loading}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
              >
                İptal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="rounded-xl gradient-primary px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔑 ŞİFRE SIFIRLAMA ONAY MODALI */}
      {userToResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="rounded-full bg-amber-500/10 p-2.5">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-foreground)]">Şifre Sıfırlama Gönderimi</h3>
            </div>
            <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed mb-6">
              <strong className="text-[var(--color-foreground)]">
                {userToResetPassword.first_name} {userToResetPassword.last_name}
              </strong>{" "}
              isimli kullanıcının{" "}
              <strong className="text-[var(--color-primary)] font-mono">{userToResetPassword.edu_email}</strong>{" "}
              adresine şifre sıfırlama bağlantısı e-posta ile gönderilecektir. Onaylıyor musunuz?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setUserToResetPassword(null)}
                disabled={loading}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
              >
                İptal
              </button>
              <button
                onClick={handleSendResetPassword}
                disabled={loading}
                className="rounded-xl gradient-primary px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Gönderiliyor..." : "Evet, Bağlantıyı Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
