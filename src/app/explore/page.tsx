import Link from "next/link";
import { Search, Users, FolderKanban, Star, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/navbar";
import type { Profile } from "@/types/database";

export default async function ExplorePage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .in("role", ["student", "faculty"])
    .order("karma_points", { ascending: false })
    .limit(20);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--color-muted)]/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold sm:text-3xl">Keşfet</h1>
            <p className="mt-1 text-[var(--color-muted-foreground)]">DEÜ topluluğundaki öğrenci ve akademisyenleri keşfet</p>
          </div>

          {profiles && profiles.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(profiles as Profile[]).map((p) => (
                <Link
                  key={p.id}
                  href={`/u/${p.id}`}
                  className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-lg font-bold text-white">
                      {(p.first_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                        {p.first_name} {p.last_name}
                      </h3>
                      <p className="text-sm text-[var(--color-muted-foreground)] truncate">
                        {p.department || "Bölüm belirtilmemiş"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 font-medium text-[var(--color-primary)]">
                      {p.role === "student" ? "Öğrenci" : p.role === "faculty" ? "Akademisyen" : p.role}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500" /> {p.karma_points}
                    </span>
                  </div>
                  {p.bio && (
                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)] line-clamp-2">{p.bio}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)]" />
              <h3 className="mt-3 font-medium">Henüz kullanıcı yok</h3>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
