"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  BookOpen,
  Mail,
  Lock,
  User,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  facultyRegisterSchema,
  type FacultyRegisterInput,
} from "@/lib/validations/auth";
import { notifyNewRegistration } from "@/lib/notifications/client";

import { DEU_FACULTIES } from "@/constants/deu-departments";
import { useLocale } from "next-intl";

const TITLES = [
  "Prof. Dr.",
  "Doç. Dr.",
  "Dr. Öğr. Üyesi",
  "Arş. Gör.",
  "Öğr. Gör.",
  "Dr.",
  "Diğer",
];

export default function FacultyRegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const isEn = locale === "en";
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FacultyRegisterInput>({
    resolver: zodResolver(facultyRegisterSchema),
    defaultValues: {
      kvkkConsent: false as unknown as true,
    },
  });

  const onSubmit = async (data: FacultyRegisterInput) => {
    setLoading(true);
    const supabase = createClient();

    // Mükerrer e-posta kontrolü
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("edu_email", data.email)
      .maybeSingle();

    if (existingProfile) {
      toast.error("Bu e-posta adresi ile zaten kayıtlı bir hesap bulunmaktadır.");
      setLoading(false);
      return;
    }

    const redirectUrl = typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "https://ybs-toplulugu.vercel.app/auth/callback";

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          department: data.department,
          title: data.title,
          role: "faculty",
        },
      },
    });

    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    // Yöneticilere anında bildirim gönder (e-posta doğrulamasını beklemeden);
    // hata alınsa bile kayıt akışını engellemez (retry mantığı dahilidir).
    if (authData.user?.id) {
      void notifyNewRegistration(authData.user.id);
    }

    setEmailSent(true);
    toast.success("Doğrulama e-postası gönderildi!");
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md animate-scale-in rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-foreground)]">
            {t("auth.verifyEmail")}
          </h2>
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
            {t("auth.verifyEmailMessage")}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
          >
            {t("common.login")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <Link
          href="/register"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("common.back")}
        </Link>

        <div className="animate-fade-in rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-lg">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <BookOpen className="h-6 w-6 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
              {t("auth.facultyRegister") || "Akademisyen Kaydı"}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              DEÜ akademisyen e-posta adresiniz ile kayıt olun
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("auth.firstName")} *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    {...register("firstName")}
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("auth.lastName")} *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    {...register("lastName")}
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* DEÜ Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                DEÜ {t("auth.email")} *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="ornek@deu.edu.tr"
                  className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-[var(--color-error)]">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Title & Department */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Unvan *
                </label>
                <select
                  {...register("title")}
                  className="w-full appearance-none rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 px-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                >
                  <option value="">Seçiniz</option>
                  {TITLES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.title && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {isEn ? "Faculty *" : "Fakülte *"}
                </label>
                <select
                  value={selectedFaculty}
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 px-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                >
                  <option value="">{isEn ? "Select Faculty" : "Fakülte Seçiniz"}</option>
                  {DEU_FACULTIES.map((fac) => (
                    <option key={fac.name} value={fac.name}>
                      {isEn ? fac.nameEn : fac.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {t("auth.department")} *
              </label>
              <select
                {...register("department")}
                disabled={!selectedFaculty}
                className="w-full appearance-none rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 px-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20 disabled:opacity-50"
              >
                <option value="">{isEn ? "Select Department" : "Bölüm Seçiniz"}</option>
                {selectedFaculty &&
                  DEU_FACULTIES.find((fac) => fac.name === selectedFaculty)
                    ?.departments.map((dept) => (
                      <option key={dept.name} value={dept.name}>
                        {isEn ? dept.nameEn : dept.name}
                      </option>
                    ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-xs text-[var(--color-error)]">
                  {errors.department.message}
                </p>
              )}
            </div>

            {/* Password fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("auth.password")} *
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
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("auth.confirmPassword")} *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    {...register("confirmPassword")}
                    type="password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* KVKK & Yasal Onaylar */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/50 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  {...register("kvkkConsent")}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--color-input)] text-[var(--color-primary)] focus:ring-[var(--color-ring)]"
                />
                <span className="text-xs sm:text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                  <Link href="/kvkk" target="_blank" className="font-medium text-[var(--color-primary)] underline">
                    KVKK Aydınlatma Metni
                  </Link>
                  &apos;ni,{" "}
                  <Link href="/terms" target="_blank" className="font-medium text-[var(--color-primary)] underline">
                    Kullanım Koşulları
                  </Link>
                  &apos;nı,{" "}
                  <Link href="/privacy" target="_blank" className="font-medium text-[var(--color-primary)] underline">
                    Gizlilik Politikası
                  </Link>
                  &apos;nı ve{" "}
                  <Link href="/cookies" target="_blank" className="font-medium text-[var(--color-primary)] underline">
                    Çerez Politikası
                  </Link>
                  &apos;nı okudum, kabul ediyorum. *
                </span>
              </label>
              {errors.kvkkConsent && (
                <p className="mt-2 text-xs text-[var(--color-error)]">
                  {errors.kvkkConsent.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t("common.loading") : t("common.register")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--color-muted-foreground)]">
            {t("auth.hasAccount")}{" "}
            <Link
              href="/login"
              className="font-medium text-[var(--color-primary)] transition-colors hover:underline"
            >
              {t("common.login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
