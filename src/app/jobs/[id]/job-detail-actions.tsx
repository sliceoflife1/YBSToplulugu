"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";

interface JobDetailActionsProps {
  listingId: string;
  isActive: boolean;
}

export default function JobDetailActions({ listingId, isActive }: JobDetailActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggleActive = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (!res.ok) throw new Error("Güncelleme başarısız");
      toast.success(isActive ? "İlan pasife alındı" : "İlan aktif edildi");
      router.refresh();
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${listingId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Silme başarısız");
      toast.success("İlan silindi");
      router.push("/jobs");
    } catch {
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => router.push(`/jobs/${listingId}/edit`)}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
      >
        <Edit className="h-3.5 w-3.5" />
        Düzenle
      </button>

      <button
        onClick={handleToggleActive}
        disabled={loading}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
            : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
        }`}
      >
        {isActive ? (
          <>
            <PowerOff className="h-3.5 w-3.5" />
            Pasife Al
          </>
        ) : (
          <>
            <Power className="h-3.5 w-3.5" />
            Aktif Yap
          </>
        )}
      </button>

      {showDeleteConfirm ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-500/20"
          >
            Evet, Sil
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
          >
            İptal
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Sil
        </button>
      )}
    </div>
  );
}
