"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { Search } from "lucide-react";

export default function UsersClient({ initialUsers }: { initialUsers: Profile[] }) {
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();
  const router = useRouter();

  const handleRoleChange = async (id: string, newRole: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", id);

    if (!error) {
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole as Profile["role"] } : u));
      router.refresh();
    } else {
      alert("Rol güncellenirken bir hata oluştu: " + error.message);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (!error) {
      setUsers(users.map(u => u.id === id ? { ...u, is_active: !currentStatus } : u));
      router.refresh();
    } else {
      alert("Durum güncellenirken bir hata oluştu: " + error.message);
    }
  };

  const filteredUsers = users.filter(u => {
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
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
          <input
            type="text"
            placeholder="İsim, e-posta veya no ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-4 py-2 focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--color-muted-foreground)]">
            <thead className="bg-[var(--color-muted)]/50 text-xs uppercase text-[var(--color-foreground)]">
              <tr>
                <th className="px-6 py-4 font-medium">Kullanıcı</th>
                <th className="px-6 py-4 font-medium">İletişim / No</th>
                <th className="px-6 py-4 font-medium">Rol</th>
                <th className="px-6 py-4 font-medium text-center">Durum</th>
                <th className="px-6 py-4 font-medium text-right">İşlem</th>
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
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-white font-bold">
                          {(user.first_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--color-foreground)]">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs">{user.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[var(--color-foreground)]">{user.edu_email}</p>
                      <p className="text-xs">{user.student_no || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs focus:border-[var(--color-primary)] focus:outline-none"
                      >
                        <option value="student">Öğrenci</option>
                        <option value="alumni">Mezun</option>
                        <option value="faculty">Akademisyen</option>
                        <option value="employer">İşveren</option>
                        <option value="moderator">Moderatör</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${user.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                        {user.is_active ? 'Aktif' : 'Engelli'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleActive(user.id, user.is_active ?? false)}
                        className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-muted)]"
                      >
                        {user.is_active ? "Engelle" : "Aktife Al"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
