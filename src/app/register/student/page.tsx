"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Phone,
  Hash,
  ArrowLeft,
  BookOpen,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  studentRegisterSchema,
  type StudentRegisterInput,
} from "@/lib/validations/auth";

const DEPARTMENTS = [
  "Yönetim Bilişim Sistemleri",
  "Bilgisayar Mühendisliği",
  "Elektrik-Elektronik Mühendisliği",
  "Endüstri Mühendisliği",
  "İşletme",
  "İktisat",
  "Maliye",
  "Uluslararası İlişkiler",
  "Hukuk",
  "Tıp",
  "Diğer",
];

export default function StudentRegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentRegisterInput>({
    resolver: zodResolver(studentRegisterSchema),
    defaultValues: {
      kvkkConsent: false as unknown as true,
    },
  });

  const onSubmit = async (data: StudentRegisterInput) => {
    setLoading(true);
    const supabase = createClient();

    // Sign up with Supabase Auth
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          student_no: data.studentNo,
          personal_email: data.personalEmail,
          phone: data.phone,
          department: data.department,
          class_year: data.classYear,
        },
      },
    });

    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
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
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <GraduationCap className="h-6 w-6 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
              {t("auth.studentRegister")}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              DEÜ öğrenci e-posta adresiniz ile kayıt olun
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

            {/* Student number */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {t("auth.studentNo")} *
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <input
                  {...register("studentNo")}
                  placeholder="2020123456"
                  className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                />
              </div>
              {errors.studentNo && (
                <p className="mt-1 text-xs text-[var(--color-error)]">
                  {errors.studentNo.message}
                </p>
              )}
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
                  placeholder="ornek@ogr.deu.edu.tr"
                  className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-[var(--color-error)]">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Personal Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {t("auth.personalEmail")} *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <input
                  {...register("personalEmail")}
                  type="email"
                  placeholder="ornek@gmail.com"
                  className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                />
              </div>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                Mezuniyet sonrası hesap kurtarma için gereklidir
              </p>
              {errors.personalEmail && (
                <p className="mt-1 text-xs text-[var(--color-error)]">
                  {errors.personalEmail.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {t("auth.phone")}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="+905551234567"
                  className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-[var(--color-error)]">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Department & Class Year */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("auth.department")} *
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <select
                    {...register("department")}
                    className="w-full appearance-none rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                  >
                    <option value="">Seçiniz</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.department && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.department.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {t("auth.classYear")}
                </label>
                <select
                  {...register("classYear")}
                  className="w-full appearance-none rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 px-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                >
                  <option value="">Seçiniz</option>
                  <option value="1">1. Sınıf</option>
                  <option value="2">2. Sınıf</option>
                  <option value="3">3. Sınıf</option>
                  <option value="4">4. Sınıf</option>
                  <option value="5">Yüksek Lisans</option>
                  <option value="6">Doktora</option>
                </select>
              </div>
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

            {/* KVKK Consent */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/50 p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  {...register("kvkkConsent")}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--color-input)] text-[var(--color-primary)] focus:ring-[var(--color-ring)]"
                />
                <span className="text-sm text-[var(--color-muted-foreground)]">
                  <Link
                    href="/kvkk"
                    target="_blank"
                    className="font-medium text-[var(--color-primary)] underline"
                  >
                    {t("auth.kvkkTitle")}
                  </Link>
                  &apos;ni okudum ve kabul ediyorum. *
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
