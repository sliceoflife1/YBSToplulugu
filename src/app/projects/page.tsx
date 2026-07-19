import { createClient, createAdminClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import ProjectsClient from "./projects-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all projects along with author profiles and stats
  const { data: projects, error } = await adminSupabase
    .from("projects")
    .select(`
      id,
      title,
      description,
      technologies,
      github_url,
      youtube_url,
      behance_url,
      external_url,
      semester,
      year,
      created_at,
      upvote_count,
      comment_count,
      media_urls,
      profiles (
        id,
        first_name,
        last_name,
        avatar_url,
        role,
        department,
        karma_points,
        edu_email
      )
    `)
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
  }

  // Check upvotes for current user
  let userUpvotes: string[] = [];
  if (user && projects && projects.length > 0) {
    const projectIds = projects.map(p => p.id);
    const { data: upvotes } = await adminSupabase
      .from("project_upvotes")
      .select("project_id")
      .eq("user_id", user.id)
      .in("project_id", projectIds);
    userUpvotes = (upvotes || []).map((u: { project_id: string }) => u.project_id);
  }

  // Define Project type matching what we get from DB
  const formattedProjects = (projects || []).map(p => ({
    ...p,
    profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
    hasUpvoted: userUpvotes.includes(p.id)
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl text-[var(--color-foreground)]">Projeler</h1>
              <p className="mt-1 text-[var(--color-muted-foreground)]">
                Öğrencilerimiz tarafından geliştirilen projeleri keşfedin
              </p>
            </div>
          </div>

          <ProjectsClient 
            initialProjects={formattedProjects as any} 
            isLoggedIn={!!user}
          />
        </div>
      </main>
    </div>
  );
}
