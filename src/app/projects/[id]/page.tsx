import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import ProjectDetailClient from "@/components/projects/project-detail-client";
import ProjectCommentSection from "@/components/projects/project-comment-section";
import LinkSafetyWarning from "@/components/community/LinkSafetyWarning";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminSupabase = createAdminClient();
  const supabase = await createClient();

  // Fetch Project details
  const { data: project } = await adminSupabase
    .from("projects")
    .select("*, profiles!projects_user_id_fkey(id, first_name, last_name, avatar_url, role)")
    .eq("id", id)
    .single<any>();

  if (!project) notFound();

  // Fetch comments of this project
  const { data: comments } = await adminSupabase
    .from("project_comments")
    .select("*, profiles!project_comments_author_id_fkey(id, first_name, last_name, avatar_url)")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();

  // Rol kontrolü yapalım
  let userRole: string | null = null;
  if (user) {
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profile?.role || null;
  }

  // Check upvote state for logged in user
  let userUpvoted = false;
  if (user) {
    const { data: upvote } = await adminSupabase
      .from("project_upvotes")
      .select("project_id")
      .eq("project_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    userUpvoted = !!upvote;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-muted)]/30">
      <Navbar />
      <main className="flex-1 pb-16">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 animate-fade-in">
          {/* Geri Dön */}
          <Link
            href="/projects"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-4 w-4" /> Projelere geri dön
          </Link>

          {/* Proje Detay Kartı (Client Component wrapper for interactive edits/deletes) */}
          <ProjectDetailClient
            project={{
              id: project.id,
              title: project.title,
              description: project.description || "",
              technologies: project.technologies,
              github_url: project.github_url,
              youtube_url: project.youtube_url,
              behance_url: project.behance_url,
              external_url: project.external_url,
              semester: project.semester,
              year: project.year,
              media_urls: project.media_urls,
              created_at: project.created_at,
              user_id: project.user_id,
              upvote_count: project.upvote_count || 0,
            }}
            profiles={project.profiles}
            currentUser={user ? { id: user.id, role: userRole } : null}
            userUpvoted={userUpvoted}
          />

          {/* Project Comment Section Component */}
          <ProjectCommentSection
            projectId={project.id}
            initialComments={(comments || []).map((c: any) => ({
              id: c.id,
              project_id: c.project_id,
              author_id: c.author_id,
              parent_id: c.parent_id,
              content: c.content,
              created_at: c.created_at,
              profiles: c.profiles,
            }))}
            isLoggedIn={!!user}
            currentUser={user ? { id: user.id, role: userRole } : null}
          />
        </div>
      </main>

      {/* Dış Bağlantı Güvenlik Interceptor'ı */}
      <LinkSafetyWarning />
    </div>
  );
}
