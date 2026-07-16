import Link from "next/link";
import { notFound } from "next/navigation";
import { GitBranch, UserCircle, Briefcase, GraduationCap, Calendar, FileText, Code2 } from "lucide-react";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import CvDownloadButton from "./cv-download";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Profil Verisini Çek
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) {
    notFound();
  }

  // 2. Kullanıcının Projelerini Çek (Kronolojik)
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", id)
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  // 3. Kullanıcının CV verisini Çek
  let cvData = null;
  if (profile.is_cv_public) {
    const { data } = await supabase
      .from("cv_data")
      .select("*")
      .eq("user_id", id)
      .single();
    cvData = data;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          
          {/* Üst Kısım: Profil Kartı */}
          <div className="relative mb-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden">
            {/* Banner (Görsel Zenginlik) */}
            <div className="h-32 bg-gradient-to-r from-[var(--color-primary)]/80 to-purple-600/80"></div>
            
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12 mb-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-[var(--color-card)] bg-[var(--color-background)] text-3xl font-bold text-[var(--color-primary)] shadow-md">
                  {(profile.first_name || "?").charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
                    {profile.first_name} {profile.last_name}
                  </h1>
                  <p className="text-sm font-medium text-[var(--color-primary)] mt-1">
                    {profile.role === "student" ? "Öğrenci" : profile.role === "faculty" ? "Akademisyen" : profile.role === "alumni" ? "Mezun" : profile.role}
                    {profile.department && ` • ${profile.department}`}
                  </p>
                </div>

                <div className="flex gap-3 mt-4 sm:mt-0">
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-muted)] transition-colors">
                      <UserCircle className="h-4 w-4 text-blue-600" /> LinkedIn
                    </a>
                  )}
                  {profile.github_url && (
                    <a href={profile.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-muted)] transition-colors">
                      <GitBranch className="h-4 w-4" /> GitHub
                    </a>
                  )}
                </div>
              </div>

              {profile.bio && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">Hakkında</h3>
                  <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--color-muted-foreground)] border-t border-[var(--color-border)] pt-6">
                {profile.class_year && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>{profile.class_year}. Sınıf</span>
                  </div>
                )}
                {profile.karma_points !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600">★</div>
                    <span>{profile.karma_points} Karma Puanı</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Sol Kolon: Projeler / Andıç */}
            <div className="md:col-span-2 space-y-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--color-foreground)]">
                <Briefcase className="h-5 w-5 text-[var(--color-primary)]" /> Projeler & Andıç
              </h2>

              {projects && projects.length > 0 ? (
                <div className="relative border-l-2 border-[var(--color-muted)] ml-3 pl-6 space-y-8 py-2">
                  {projects.map((project) => (
                    <div key={project.id} className="relative">
                      {/* Timeline Noktası */}
                      <span className="absolute -left-[35px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] ring-4 ring-[var(--color-background)]"></span>
                      
                      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-lg text-[var(--color-foreground)]">{project.title}</h3>
                          <span className="text-xs font-medium bg-[var(--color-muted)] text-[var(--color-muted-foreground)] px-2 py-1 rounded-md">
                            {project.year} {project.semester === "fall" ? "Güz" : project.semester === "spring" ? "Bahar" : project.semester === "summer" ? "Yaz" : ""}
                          </span>
                        </div>
                        
                        {project.description && (
                          <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
                            {project.description}
                          </p>
                        )}

                        {project.technologies && project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {project.technologies.map((tech: string) => (
                              <span key={tech} className="inline-flex items-center rounded bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-3 border-t border-[var(--color-border)] pt-3">
                          {project.github_url && (
                            <a href={project.github_url} target="_blank" rel="noreferrer" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
                              <GitBranch className="h-4 w-4" />
                            </a>
                          )}
                          {project.external_url && (
                            <a href={project.external_url} target="_blank" rel="noreferrer" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors text-xs font-medium flex items-center gap-1">
                              Projeye Git &rarr;
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center bg-[var(--color-card)]">
                  <Code2 className="mx-auto h-8 w-8 text-[var(--color-muted-foreground)] opacity-50" />
                  <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">Henüz eklenmiş bir proje bulunmuyor.</p>
                </div>
              )}
            </div>

            {/* Sağ Kolon: CV ve Diğer Bilgiler */}
            <div className="space-y-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--color-foreground)]">
                <FileText className="h-5 w-5 text-[var(--color-primary)]" /> Özgeçmiş (CV)
              </h2>
              
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
                {profile.is_cv_public ? (
                  <div className="text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10 mx-auto">
                      <FileText className="h-8 w-8 text-[var(--color-primary)]" />
                    </div>
                    <h3 className="font-medium text-[var(--color-foreground)] mb-1">Açık Özgeçmiş</h3>
                    <p className="text-xs text-[var(--color-muted-foreground)] mb-4">Bu kullanıcının detaylı özgeçmişi ve deneyimleri herkese açıktır.</p>
                    <CvDownloadButton profile={profile} cvData={cvData} />
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-muted)] mx-auto">
                      <FileText className="h-8 w-8 text-[var(--color-muted-foreground)] opacity-50" />
                    </div>
                    <h3 className="font-medium text-[var(--color-foreground)] mb-1">Gizli Özgeçmiş</h3>
                    <p className="text-xs text-[var(--color-muted-foreground)]">Bu kullanıcı özgeçmişini herkese açık olarak paylaşmamış.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
