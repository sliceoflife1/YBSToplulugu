"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setLoading(true);
    const supabase = createClient();

    // Supabase Auth e-posta ile şifre sıfırlama talebi
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      console.error("Şifre sıfırlama e-postası gönderme hatası:", error);
      toast.error(t("common.error"));
      setLoading(false);
      return;
    }

    toast.success("Şifre sıfırlama bağlantısı e-postanıza gönderildi.");
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-muted)]/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-lg">
        
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Link>

        {submitted ? (
          <div className="text-center space-y-4 py-4 animate-fade-in">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <h2 className="text-2xl font-bold text-[var(--color-foreground)]">E-posta Gönderildi</h2>
            <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
              Şifre sıfırlama bağlantısını içeren bir e-postayı adresinize gönderdik. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-block w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-md hover:opacity-90"
              >
                {t("common.login")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                {t("auth.forgotPassword")}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                Hesabınıza ait e-posta adresini girin, şifrenizi sıfırlamanız için size bir bağlantı gönderelim.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
                  {t("auth.email")} *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    id="email"
                    type="email"
                    required
                    {...register("email")}
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                    placeholder="ornek@ogr.deu.edu.tr"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all"
              >
                <Send className="h-4 w-4" />
                {loading ? t("common.loading") : t("common.submit")}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
