"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { KeyRound, ArrowRight, Lock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  confirmPassword: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler uyuşmuyor",
  path: ["confirmPassword"],
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function checkSession() {
      // Kullanıcının e-posta linkiyle geldiğinde geçerli bir oturumu olduğunu doğrula
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Geçersiz veya süresi dolmuş oturum. Lütfen tekrar şifre sıfırlama talebi oluşturun.");
        router.push("/forgot-password");
        return;
      }
      setCheckingSession(false);
    }
    checkSession();
  }, [router]);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true);
    const supabase = createClient();

    // Supabase Auth kullanıcının şifresini güncelle
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      console.error("Şifre güncelleme hatası:", error);
      toast.error(error.message || "Şifre güncellenirken bir hata oluştu.");
      setLoading(false);
      return;
    }

    toast.success("Şifreniz başarıyla güncellendi!");
    setSuccess(true);
    setLoading(false);

    // Oturumu kapatıp login sayfasına yönlendir (kullanıcı isteği doğrultusunda)
    await supabase.auth.signOut();
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-muted)]/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-muted)]/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-lg">
        
        {success ? (
          <div className="text-center space-y-4 py-4 animate-fade-in">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <h2 className="text-2xl font-bold text-[var(--color-foreground)]">Şifreniz Yenilendi</h2>
            <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
              Şifreniz başarıyla sıfırlandı. Artık yeni şifrenizle giriş yapabilirsiniz.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-md hover:opacity-90"
              >
                Giriş Sayfasına Git <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                Yeni Şifre Belirleyin
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                Güvenliğiniz için lütfen yeni bir şifre girin.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
                  {t("auth.password")} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    type="password"
                    required
                    {...register("password")}
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                    placeholder="••••••"
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
                  {t("auth.confirmPassword")} *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    type="password"
                    required
                    {...register("confirmPassword")}
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                    placeholder="••••••"
                  />
                </div>
                {errors.confirmPassword && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all"
              >
                {loading ? t("common.loading") : "Şifreyi Güncelle"}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
