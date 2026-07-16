import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import ProjectsClient from "./projects-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = await createClient();

  // Fetch all projects along with author profiles
  const { data: projects, error } = await supabase
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
      profiles (
        first_name,
        last_name,
        avatar_url,
        role
      )
    `)
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
  }

  // Define Project type matching what we get from DB
  const formattedProjects = (projects || []).map(p => ({
    ...p,
    profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold sm:text-3xl text-[var(--color-foreground)]">Projeler</h1>
            <p className="mt-1 text-[var(--color-muted-foreground)]">
              Öğrencilerimiz tarafından geliştirilen projeleri keşfedin
            </p>
          </div>

          <ProjectsClient initialProjects={formattedProjects as any} />
        </div>
      </main>
    </div>
  );
}
