import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  Globe,
  ArrowLeft,
  Users,
  Edit,
  Trash2,
} from "lucide-react";
import type { JobListing, Profile } from "@/types/database";
import {
  JOB_CATEGORY_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  WORK_MODE_LABELS,
} from "@/constants/job-categories";
import type { JobCategory, EmploymentType, WorkMode } from "@/constants/job-categories";
import CountdownTimer from "@/components/jobs/countdown-timer";
import ApplyButton from "@/components/jobs/apply-button";
import JobDetailActions from "./job-detail-actions";

import { SAMPLE_JOB_LISTINGS } from "@/constants/sample-jobs";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // İlan detayını çek
  const { data: dbListing } = await supabase
    .from("job_listings")
    .select(
      "*, profiles!employer_id(id, first_name, last_name, avatar_url), organizations(id, name, logo_url, website_url, contact_email, contact_phone, description)"
    )
    .eq("id", id)
    .maybeSingle();

  // DB'de yoksa sample listesinden kontrol et
  const listing = dbListing || SAMPLE_JOB_LISTINGS.find((item) => item.id === id);

  if (!listing) {
    notFound();
  }

  // Kullanıcı bilgisi
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentProfile: Profile | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    currentProfile = profile;
  }

  const isOwner = user?.id === listing.employer_id;
  const isAdmin =
    currentProfile?.role === "admin" || currentProfile?.role === "moderator";
  const canManage = isOwner || isAdmin;
  const isEmployer = currentProfile?.role === "employer";

  // Başvuranları çek (sadece ilan sahibi ve admin)
  let applicants: Array<{
    id: string;
    applicant_id: string;
    status: string;
    created_at: string;
    profiles: { id: string; first_name: string; last_name: string; department: string | null; avatar_url: string | null; is_cv_public: boolean };
  }> = [];

  if (canManage) {
    const { data } = await supabase
      .from("job_applications")
      .select(
        "id, applicant_id, status, created_at, profiles!applicant_id(id, first_name, last_name, department, avatar_url, is_cv_public)"
      )
      .eq("job_listing_id", id)
      .order("created_at", { ascending: false });
    applicants = (data as unknown as typeof applicants) || [];
  }

  const typedListing = listing as unknown as JobListing;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Geri */}
          <Link
            href="/jobs"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            İş İlanlarına Dön
          </Link>

          {/* Ana Kart */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
            {/* Üst Renkli Şerit */}
            <div
              className={`h-2 ${
                typedListing.employment_type === "internship"
                  ? "bg-emerald-500"
                  : typedListing.employment_type === "part_time"
                  ? "bg-amber-500"
                  : "bg-[var(--color-primary)]"
              }`}
            />

            <div className="p-6 sm:p-8">
              {/* Başlık ve Yönetim */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
                <div className="flex items-start gap-4">
                  {/* Şirket Logosu */}
                  <div className="h-14 w-14 shrink-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] overflow-hidden flex items-center justify-center">
                    {(listing.organizations as { logo_url?: string })?.logo_url ? (
                      <img
                        src={(listing.organizations as { logo_url: string }).logo_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-7 w-7 text-[var(--color-muted-foreground)]" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
                      {listing.title}
                    </h1>
                    <p className="mt-1 text-sm font-medium text-[var(--color-primary)]">
                      {(listing.organizations as { name?: string })?.name || "Şirket"}
                    </p>
                  </div>
                </div>

                {canManage && (
                  <JobDetailActions listingId={listing.id} isActive={listing.is_active} />
                )}
              </div>

              {/* Etiketler */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
                  {JOB_CATEGORY_LABELS[listing.category as JobCategory]}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    listing.employment_type === "internship"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : listing.employment_type === "part_time"
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-blue-500/10 text-blue-600"
                  }`}
                >
                  {EMPLOYMENT_TYPE_LABELS[listing.employment_type as EmploymentType]}
                </span>
                <span className="inline-flex items-center rounded-full bg-[var(--color-muted)] px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
                  {WORK_MODE_LABELS[listing.work_mode as WorkMode]}
                </span>
                {listing.location && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-muted)] px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
                    <MapPin className="h-3 w-3" />
                    {listing.location}
                  </span>
                )}
              </div>

              {/* Pasif İlan Uyarısı */}
              {!listing.is_active && (
                <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                  Bu ilan şu anda pasif durumda.
                </div>
              )}

              {/* Geri Sayım */}
              {listing.deadline && listing.is_active && (
                <div className="mb-6">
                  <CountdownTimer deadline={listing.deadline} />
                </div>
              )}

              {/* Açıklama */}
              {listing.description && (
                <div className="mb-6">
                  <h2 className="mb-3 text-lg font-semibold text-[var(--color-foreground)]">
                    İlan Detayı
                  </h2>
                  <div className="prose prose-sm max-w-none text-[var(--color-muted-foreground)] whitespace-pre-wrap">
                    {listing.description}
                  </div>
                </div>
              )}

              {/* Gereksinimler */}
              {listing.requirements && listing.requirements.length > 0 && (
                <div className="mb-6">
                  <h2 className="mb-3 text-lg font-semibold text-[var(--color-foreground)]">
                    Gereksinimler
                  </h2>
                  <ul className="space-y-2">
                    {listing.requirements.map((req: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-[var(--color-muted-foreground)]"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Başvuru Bilgileri */}
              <div className="flex items-center gap-4 border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-muted-foreground)]">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {listing.application_count} başvuru
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {new Date(listing.created_at).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              {/* Başvur Butonu */}
              {!isEmployer && (
                <div className="mt-6">
                  <ApplyButton
                    listingId={listing.id}
                    deadline={listing.deadline}
                    isActive={listing.is_active}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Şirket Bilgi Kartı */}
          {listing.organizations && (
            <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
                Şirket Hakkında
              </h2>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] overflow-hidden flex items-center justify-center">
                  {(listing.organizations as { logo_url?: string }).logo_url ? (
                    <img
                      src={(listing.organizations as { logo_url: string }).logo_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-[var(--color-muted-foreground)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--color-foreground)]">
                    {(listing.organizations as { name: string }).name}
                  </h3>
                  {(listing.organizations as { description?: string }).description && (
                    <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                      {(listing.organizations as { description: string }).description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3">
                    {(listing.organizations as { website_url?: string }).website_url && (
                      <a
                        href={(listing.organizations as { website_url: string }).website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)] hover:underline"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Web Sitesi
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Başvuranlar (Sadece İlan Sahibi / Admin) */}
          {canManage && (
            <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[var(--color-foreground)]">
                <Users className="h-5 w-5 text-[var(--color-primary)]" />
                Başvuranlar
                {applicants.length > 0 && (
                  <span className="rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                    {applicants.length}
                  </span>
                )}
              </h2>

              {applicants.length > 0 ? (
                <div className="space-y-3">
                  {applicants.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[var(--color-muted)] overflow-hidden flex items-center justify-center">
                          {app.profiles?.avatar_url ? (
                            <img
                              src={app.profiles.avatar_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-[var(--color-primary)]">
                              {(app.profiles?.first_name || "?").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/u/${app.applicant_id}`}
                            className="font-medium text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors"
                          >
                            {app.profiles?.first_name} {app.profiles?.last_name}
                          </Link>
                          <p className="text-xs text-[var(--color-muted-foreground)]">
                            {app.profiles?.department || "Bölüm belirtilmemiş"} •{" "}
                            {new Date(app.created_at).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            app.status === "pending"
                              ? "bg-amber-500/10 text-amber-600"
                              : app.status === "reviewed"
                              ? "bg-blue-500/10 text-blue-600"
                              : app.status === "accepted"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-red-500/10 text-red-600"
                          }`}
                        >
                          {app.status === "pending"
                            ? "Beklemede"
                            : app.status === "reviewed"
                            ? "İncelendi"
                            : app.status === "accepted"
                            ? "Kabul Edildi"
                            : "Reddedildi"}
                        </span>
                        {app.profiles?.is_cv_public && (
                          <a
                            href={`/api/cv/pdf?userId=${app.applicant_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
                          >
                            CV İndir
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center">
                  <Users className="mx-auto h-8 w-8 text-[var(--color-muted-foreground)] opacity-50" />
                  <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                    Henüz başvuru bulunmuyor.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
