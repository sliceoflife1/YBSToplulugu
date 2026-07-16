import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Link2,
  Calendar,
  Star,
  FolderKanban,
  FileText,
  ExternalLink,
  Edit,
  Globe,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import type { Profile, Project } from "@/types/database";
import { formatDate } from "@/lib/utils";

export default async function ProfilePage() {
  const supabase = await createClient();
  const t = await getTranslations("profile");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("year", { ascending: false });

  if (!profile) redirect("/login");

  const fullName = `${profile.first_name} ${profile.last_name}`.trim() || "İsimsiz Kullanıcı";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm sm:p-8">
            <div className="flex flex-col items-start gap-6 sm:flex-row">
              {/* Avatar */}
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl gradient-primary text-3xl font-bold text-white shadow-lg">
                {fullName.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
                      {fullName}
                    </h1>
                    <p className="mt-1 text-[var(--color-muted-foreground)]">
                      {profile.department || "Bölüm belirtilmemiş"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted-foreground)]">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                        {profile.role === "student" ? "Öğrenci" : profile.role === "faculty" ? "Akademisyen" : profile.role}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        {profile.karma_points} karma
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(profile.created_at)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/profile/edit"
                    className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
                  >
                    <Edit className="h-4 w-4" />
                    {t("editProfile")}
                  </Link>
                </div>

                {profile.bio && (
                  <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                    {profile.bio}
                  </p>
                )}

                {/* Contact & Links */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-[var(--color-muted)] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--color-border)]"
                    >
                      <Link2 className="h-4 w-4 text-blue-600" />
                      LinkedIn
                    </a>
                  )}
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-[var(--color-muted)] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--color-border)]"
                    >
                      <Globe className="h-4 w-4" />
                      GitHub
                    </a>
                  )}
                  <span className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]">
                    <Mail className="h-4 w-4" />
                    {profile.edu_email}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Timeline */}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                {t("timeline")}
              </h2>
              <Link
                href="/projects/new"
                className="rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
              >
                Proje Ekle
              </Link>
            </div>

            {projects && projects.length > 0 ? (
              <div className="relative space-y-6 before:absolute before:left-6 before:top-0 before:h-full before:w-0.5 before:bg-[var(--color-border)] sm:before:left-8">
                {(projects as Project[]).map((project, index) => (
                  <div key={project.id} className="relative flex gap-4 pl-4 sm:pl-6">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-background)] mt-6" />

                    {/* Card */}
                    <div className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-[var(--color-foreground)]">
                            {project.title}
                          </h3>
                          {project.semester && project.year && (
                            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                              {project.semester === "fall" ? "Güz" : project.semester === "spring" ? "Bahar" : "Yaz"} {project.year}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {project.github_url && (
                            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                              <Globe className="h-4 w-4" />
                            </a>
                          )}
                          {project.external_url && (
                            <a href={project.external_url} target="_blank" rel="noopener noreferrer" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                      {project.description && (
                        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                          {project.description}
                        </p>
                      )}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {project.technologies.map((tech) => (
                            <span
                              key={tech}
                              className="rounded-md bg-[var(--color-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-muted-foreground)]"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-12 text-center">
                <FolderKanban className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)]" />
                <h3 className="mt-3 font-medium text-[var(--color-foreground)]">
                  Henüz proje eklenmemiş
                </h3>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  İlk projeni ekleyerek andıcını oluşturmaya başla!
                </p>
                <Link
                  href="/projects/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-white"
                >
                  Proje Ekle
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
