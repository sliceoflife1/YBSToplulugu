import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import SubredditsClient from "./client";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminSubredditsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
    redirect("/dashboard");
  }

  // Fetch all subreddits
  const { data: subreddits } = await supabase
    .from("subreddits")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Forum Yönetimi</h1>
            <p className="mt-1 text-[var(--color-muted-foreground)]">
              Yeni topluluk alanları (subreddit) oluşturun ve mevcut alanları yönetin.
            </p>
          </div>

          <SubredditsClient initialSubreddits={subreddits || []} userId={user.id} />
        </div>
      </main>
    </div>
  );
}
