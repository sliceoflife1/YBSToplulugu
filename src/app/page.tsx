import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  FolderKanban,
  FileText,
  MessageSquare,
  Users,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Award,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Building2,
  BookOpen,
  Calendar,
  Megaphone,
} from "lucide-react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  const supabase = await createClient();

  const [
    studentsRes,
    facultyRes,
    projectsRes,
    employersRes,
    organizationsRes,
    cvsRes,
    announcementsRes
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "faculty"),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("organizations").select("id", { count: "exact", head: true }).eq("type", "employer").eq("approval_status", "approved"),
    supabase.from("organizations").select("id", { count: "exact", head: true }).in("type", ["foundation", "association", "other"]).eq("approval_status", "approved"),
    supabase.from("cv_data").select("certifications"),
    supabase.from("announcements").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(3),
  ]);

  const announcements = announcementsRes?.data || [];

  const studentCount = studentsRes.count || 0;
  const facultyCount = facultyRes.count || 0;
  const projectCount = projectsRes.count || 0;
  const employerCount = employersRes.count || 0;
  const organizationCount = organizationsRes.count || 0;

  const certificateCount = (cvsRes.data || []).reduce((acc, curr) => {
    const certs = curr.certifications;
    if (Array.isArray(certs)) {
      return acc + certs.length;
    }
    return acc;
  }, 0);

  const features = [
    {
      icon: FolderKanban,
      title: t("featureProjects"),
      description: t("featureProjectsDesc"),
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: FileText,
      title: t("featureCV"),
      description: t("featureCVDesc"),
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: MessageSquare,
      title: t("featureCommunity"),
      description: t("featureCommunityDesc"),
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-500/10",
    },
    {
      icon: Users,
      title: t("featureNetwork"),
      description: t("featureNetworkDesc"),
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-500/10",
    },
  ];

  const stats = [
    { icon: GraduationCap, label: t("student"), value: studentCount, suffix: "" },
    { icon: BookOpen, label: t("faculty"), value: facultyCount, suffix: "" },
    { icon: FolderKanban, label: t("project"), value: projectCount, suffix: "" },
    { icon: Briefcase, label: t("employer"), value: employerCount, suffix: "" },
    { icon: Building2, label: t("organization"), value: organizationCount, suffix: "" },
    { icon: Award, label: t("certificate"), value: certificateCount, suffix: "" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 via-transparent to-[var(--color-secondary)]/5" />
            <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-[var(--color-secondary)]/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pt-32">
            <div className="text-center">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-4 py-1.5 text-sm font-medium text-[var(--color-primary)]">
                <Sparkles className="h-4 w-4" />
                Dokuz Eylül Üniversitesi
              </div>

              {/* Title */}
              <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-5xl lg:text-6xl">
                {t("heroTitle").split(" ").map((word, i) =>
                  word === "Topluluğu" || word === "Community" ? (
                    <span key={i} className="gradient-text">
                      {" "}{word}
                    </span>
                  ) : (
                    <span key={i}> {word}</span>
                  )
                )}
              </h1>

              {/* Subtitle */}
              <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--color-muted-foreground)] sm:text-xl">
                {t("heroSubtitle")}
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-xl gradient-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                >
                  {t("ctaRegister")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-8 py-3.5 text-base font-semibold text-[var(--color-foreground)] transition-all hover:bg-[var(--color-muted)] hover:-translate-y-0.5"
                >
                  {t("ctaExplore")}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="mx-auto mt-20 grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
                  >
                    <Icon className="h-6 w-6 text-[var(--color-primary)]" />
                    <span className="text-2xl font-bold text-[var(--color-foreground)]">
                      {stat.value}
                    </span>
                    <span className="text-sm text-[var(--color-muted-foreground)]">
                      {stat.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/30 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[var(--color-foreground)] sm:text-4xl">
                Neler <span className="gradient-text">Yapabilirsin?</span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--color-muted-foreground)]">
                Projelerini paylaş, CV&apos;ni oluştur, toplulukla etkileşime geç ve
                kariyerini şekillendir.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                  >
                    <div
                      className={`mb-4 inline-flex rounded-xl ${feature.bgColor} p-3`}
                    >
                      <Icon className="h-6 w-6 text-[var(--color-foreground)]" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-[var(--color-foreground)]">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Events & Announcements Section */}
        {announcements.length > 0 && (
          <section className="border-t border-[var(--color-border)] bg-[var(--color-card)] py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-[var(--color-foreground)] sm:text-4xl">
                  Etkinlikler & <span className="gradient-text">Duyurular</span>
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--color-muted-foreground)]">
                  Topluluğumuzdaki en güncel etkinliklerden, eğitimlerden ve önemli duyurulardan haberdar olun.
                </p>
              </div>

              <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {announcements.map((ann: any) => (
                  <Link
                    key={ann.id}
                    href={`/announcements/${ann.id}`}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                  >
                    {/* Görsel */}
                    <div className="relative aspect-video w-full overflow-hidden bg-[var(--color-muted)]">
                      {ann.image_url ? (
                        <img
                          src={ann.image_url}
                          alt={ann.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/5 to-purple-500/10">
                          <Megaphone className="h-10 w-10 text-[var(--color-primary)] opacity-40" />
                        </div>
                      )}
                      
                      {ann.event_date && (
                        <span className="absolute right-4 top-4 rounded-lg bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(ann.event_date).toLocaleDateString("tr-TR")}
                        </span>
                      )}
                    </div>

                    {/* Gövde */}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-bold text-[var(--color-foreground)] transition-colors group-hover:text-[var(--color-primary)] line-clamp-1">
                        {ann.title}
                      </h3>
                      <p className="mt-2 flex-1 text-xs text-[var(--color-muted-foreground)] line-clamp-3 whitespace-pre-wrap">
                        {ann.content}
                      </p>

                      <span
                        className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:opacity-85 transition-opacity"
                      >
                        Detayları Gör
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How It Works */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[var(--color-foreground)] sm:text-4xl">
                Nasıl <span className="gradient-text">Çalışır?</span>
              </h2>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Kayıt Ol",
                  description:
                    "DEÜ e-posta adresinle kayıt ol ve profilini oluştur. Bilgilerini doldur ve topluluğa katıl.",
                },
                {
                  step: "02",
                  title: "Profilini Zenginleştir",
                  description:
                    "Projelerini ekle, CV bilgilerini doldur, yeteneklerini listele. Andıç'ında tüm gelişimini sergile.",
                },
                {
                  step: "03",
                  title: "Bağlan ve Büyü",
                  description:
                    "Topluluk forumlarında paylaşım yap, işverenlerle bağlantı kur ve kariyerinde bir adım öne geç.",
                },
              ].map((item, index) => (
                <div key={index} className="relative text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-xl font-bold text-white shadow-lg shadow-blue-500/25">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-[var(--color-foreground)]">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-[var(--color-border)] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              DEÜ Topluluğuna Katıl
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
              Geleceğini bugünden inşa et. Projelerini paylaş, profesyonel ağını
              genişlet ve fırsatları yakala.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register/student"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-[var(--color-primary)] shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
              >
                <GraduationCap className="h-5 w-5" />
                Öğrenci Olarak Katıl
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/register/organization"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10 hover:-translate-y-0.5"
              >
                <Briefcase className="h-5 w-5" />
                İşveren / Kuruluş
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
