"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LogIn, Mail, Lock, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import Navbar from "@/components/layout/navbar";

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "E-posta veya şifre hatalı"
          : error.message
      );
      setLoading(false);
      return;
    }

    toast.success("Giriş başarılı! Yönlendiriliyorsunuz...");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Back link */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Link>

          {/* Card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-lg">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                <LogIn className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
                {t("auth.loginTitle")}
              </h1>
              <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                {t("auth.loginSubtitle")}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                  {t("auth.email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="ornek@ogr.deu.edu.tr"
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-[var(--color-error)]">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                  {t("auth.password")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    {...register("password")}
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-[var(--color-error)]">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? t("common.loading") : t("common.login")}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 space-y-3 text-center text-sm">
              <Link
                href="/forgot-password"
                className="text-[var(--color-primary)] transition-colors hover:underline"
              >
                {t("auth.forgotPassword")}
              </Link>
              <p className="text-[var(--color-muted-foreground)]">
                {t("auth.noAccount")}{" "}
                <Link
                  href="/register"
                  className="font-medium text-[var(--color-primary)] transition-colors hover:underline"
                >
                  {t("common.register")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
