"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Save, User, Mail, Phone, BookOpen, Link2, Globe, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validations/profile";
import type { Profile } from "@/types/database";

export default function ProfileEditPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
  });

  useEffect(() => {
    const supabase = createClient();
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
      if (data) {
        setProfile(data);
        reset({
          firstName: data.first_name,
          lastName: data.last_name,
          bio: data.bio || "",
          phone: data.phone || "",
          department: data.department || "",
          linkedinUrl: data.linkedin_url || "",
          githubUrl: data.github_url || "",
          personalEmail: data.personal_email || "",
          isCvPublic: data.is_cv_public,
        });
      }
    }
    loadProfile();
  }, [reset, router]);

  const onSubmit = async (data: ProfileUpdateInput) => {
    if (!profile) return;
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: data.firstName,
        last_name: data.lastName,
        bio: data.bio || null,
        phone: data.phone || null,
        department: data.department || null,
        linkedin_url: data.linkedinUrl || null,
        github_url: data.githubUrl || null,
        personal_email: data.personalEmail || null,
        is_cv_public: data.isCvPublic ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Profil güncellenirken bir hata oluştu");
      setLoading(false);
      return;
    }

    toast.success("Profil başarıyla güncellendi!");
    router.push("/profile");
    router.refresh();
  };

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </Link>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold">{t("profile.editProfile")}</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("auth.firstName")} *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <input {...register("firstName")} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" />
              </div>
              {errors.firstName && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("auth.lastName")} *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <input {...register("lastName")} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" />
              </div>
              {errors.lastName && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("profile.bio")}</label>
            <textarea {...register("bio")} rows={3} maxLength={500} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" placeholder="Kendinizi kısaca tanıtın..." />
            {errors.bio && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.bio.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("auth.department")}</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              <input {...register("department")} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("auth.phone")}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <input {...register("phone")} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("auth.personalEmail")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <input {...register("personalEmail")} type="email" className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">LinkedIn URL</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <input {...register("linkedinUrl")} placeholder="https://linkedin.com/in/..." className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" />
              </div>
              {errors.linkedinUrl && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.linkedinUrl.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">GitHub URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
                <input {...register("githubUrl")} placeholder="https://github.com/..." className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" />
              </div>
              {errors.githubUrl && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.githubUrl.message}</p>}
            </div>
          </div>

          {/* CV Visibility Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/50 p-4">
            <div className="flex items-center gap-3">
              {profile.is_cv_public ? <Eye className="h-5 w-5 text-emerald-500" /> : <EyeOff className="h-5 w-5 text-[var(--color-muted-foreground)]" />}
              <div>
                <p className="text-sm font-medium">{t("cv.toggleVisibility")}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">CV&apos;niz herkese açık mı olsun?</p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" {...register("isCvPublic")} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-[var(--color-border)] transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-[var(--color-primary)] peer-checked:after:translate-x-full" />
            </label>
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50">
            {loading ? t("common.loading") : t("common.save")}
          </button>
        </form>
      </div>
    </div>
  );
}
