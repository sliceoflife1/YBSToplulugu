"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Navbar from "@/components/layout/navbar";

export default function TwoFactorChallengePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = code.trim();
    if (cleanCode.length < 6) {
      toast.error("Lütfen 6 haneli doğrulama kodunu veya 8 karakterli yedek kodu giriniz.");
      return;
    }

    setLoading(true);

    try {
      // Server-side doğrulama API'sini çağır
      const response = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data.error === "Oturum zaman aşımına uğradı") {
          toast.error("Oturum zaman aşımına uğradı. Lütfen tekrar giriş yapın.");
          router.push("/login");
          return;
        }
        toast.error(data.error || "Girdiğiniz 2FA doğrulama kodu veya yedek kod geçersiz.");
        setLoading(false);
        return;
      }

      // Doğrulama başarılı
      if (data.usedBackupCode) {
        toast.info("Yedek kurtarma kodu kullanıldı. Kalan yedek kodlarınız güncellendi.");
      }

      // Giriş logunu yaz (fire-and-forget)
      fetch("/api/auth/log-login", { method: "POST" }).catch(() => {});

      toast.success("Google Authenticator doğrulaması başarılı! Yönetim paneline aktarılıyorsunuz...");
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Giriş Ekranına Dön
          </Link>

          <div className="rounded-2xl border border-red-500/20 bg-[var(--color-card)] p-8 shadow-xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 border border-red-500/20">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h1 className="text-xl font-bold text-[var(--color-foreground)]">
                Admin 2FA Doğrulaması
              </h1>
              <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
                Google Authenticator uygulamanızdaki 6 haneli doğrulama kodunu giriniz.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold text-[var(--color-foreground)] text-center">
                  6 Haneli Kod veya Yedek Kurtarma Kodu
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.trim())}
                    placeholder="123456"
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-3 pl-10 pr-4 text-center text-lg font-mono tracking-widest text-[var(--color-foreground)] focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Doğrula ve Giriş Yap"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
