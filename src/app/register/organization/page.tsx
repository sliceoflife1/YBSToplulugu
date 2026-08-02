"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  Globe,
  FileText,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  organizationRegisterSchema,
  type OrganizationRegisterInput,
} from "@/lib/validations/auth";
import { notifyNewRegistration } from "@/lib/notifications/client";

const ORG_TYPES = [
  { value: "employer", label: "İşveren / Şirket" },
  { value: "foundation", label: "Vakıf" },
  { value: "association", label: "Dernek" },
  { value: "other", label: "Diğer" },
];

export default function OrganizationRegisterPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationRegisterInput>({
    resolver: zodResolver(organizationRegisterSchema),
    defaultValues: {
      kvkkConsent: false as unknown as true,
      website: "",
    },
  });

  const onSubmit = async (data: OrganizationRegisterInput) => {
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

    // Signup organization (with role "employer" and user metadata)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: data.orgName, // Profiles expects first_name for org name
          last_name: "",
          org_type: data.orgType,
          contact_name: data.contactName,
          phone: data.contactPhone,
          website: data.website,
          bio: data.description, // We can store description in bio field
          role: "employer",
        },
      },
    });

    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    // Yöneticilere anında bildirim gönder (e-posta doğrulamasını beklemeden).
    // Bu, veritabanı tetikleyicilerinden bağımsız çalışır ve hata alınsa/ağ
    // sorunu yaşansa bile kullanıcının kaydını tamamlamasını ASLA engellemez
    // (retry mantığı notifyNewRegistration içinde yönetiliyor).
    if (authData.user?.id) {
      void notifyNewRegistration(authData.user.id);
    }

    setEmailSent(true);
    toast.success("Başvurunuz alındı! E-posta doğrulaması sonrası admin onayı beklenecektir.");
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md animate-scale-in rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
            <CheckCircle className="h-8 w-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-foreground)]">
            E-posta Doğrulaması Gerekli
          </h2>
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
            Lütfen e-posta adresinizi doğrulayın. Doğrulama sonrası başvurunuz yöneticilerimiz tarafından incelenecek ve onaylandığında bilgilendirileceksiniz.
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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
              <Building2 className="h-6 w-6 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
              Kuruluş / İşveren Başvurusu
            </h1>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              YBS Topluluğu platformuna işveren, vakıf veya dernek olarak katılın
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Org Name & Type */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Kuruluş Adı *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    {...register("orgName")}
                    placeholder="Şirket, Vakıf veya Dernek Adı"
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                  />
                </div>
                {errors.orgName && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.orgName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Kuruluş Türü *
                </label>
                <select
                  {...register("orgType")}
                  className="w-full appearance-none rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 px-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                >
                  <option value="">Seçiniz</option>
                  {ORG_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.orgType && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.orgType.message}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Person Name & Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Yetkili İletişim Kişisi *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    {...register("contactName")}
                    placeholder="Ad Soyad"
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                  />
                </div>
                {errors.contactName && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.contactName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  İletişim Telefonu *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    {...register("contactPhone")}
                    placeholder="+905551234567"
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                  />
                </div>
                {errors.contactPhone && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.contactPhone.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email & Website */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  E-posta Adresi *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="ik@sirketiniz.com"
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Web Sitesi
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                  <input
                    {...register("website")}
                    placeholder="https://sirketiniz.com"
                    className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                  />
                </div>
                {errors.website && (
                  <p className="mt-1 text-xs text-[var(--color-error)]">
                    {errors.website.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Kuruluş Hakkında Açıklama *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-[var(--color-muted-foreground)]" />
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Kuruluşunuzun faaliyet alanı, sunduğu kariyer fırsatları vb. hakkında bilgi verin."
                  className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                />
              </div>
              {errors.description && (
                <p className="mt-1 text-xs text-[var(--color-error)]">
                  {errors.description.message}
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
              className="w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:shadow-orange-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? t("common.loading") : "Başvuruyu Gönder"}
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
