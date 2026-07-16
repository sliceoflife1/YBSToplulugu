"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { projectSchema, type ProjectInput } from "@/lib/validations/profile";

export default function NewProjectPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [techInput, setTechInput] = useState("");
  const [techs, setTechs] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: { technologies: [] },
  });

  const addTech = () => {
    const trimmed = techInput.trim();
    if (trimmed && !techs.includes(trimmed)) {
      const newTechs = [...techs, trimmed];
      setTechs(newTechs);
      setValue("technologies", newTechs);
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => {
    const newTechs = techs.filter((t) => t !== tech);
    setTechs(newTechs);
    setValue("technologies", newTechs);
  };

  const onSubmit = async (data: ProjectInput) => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      title: data.title,
      description: data.description,
      technologies: data.technologies,
      github_url: data.githubUrl || null,
      youtube_url: data.youtubeUrl || null,
      behance_url: data.behanceUrl || null,
      external_url: data.externalUrl || null,
      semester: data.semester || null,
      year: data.year || null,
    });

    if (error) {
      toast.error("Proje eklenirken bir hata oluştu");
      setLoading(false);
      return;
    }

    toast.success("Proje başarıyla eklendi!");
    router.push("/profile");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </Link>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-lg animate-fade-in">
        <h1 className="mb-6 text-2xl font-bold">Yeni Proje Ekle</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Proje Başlığı *</label>
            <input {...register("title")} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" placeholder="Örn: E-Ticaret Web Uygulaması" />
            {errors.title && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Açıklama *</label>
            <textarea {...register("description")} rows={4} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" placeholder="Projenizi kısaca tanıtın..." />
            {errors.description && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.description.message}</p>}
          </div>

          {/* Technologies */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Teknolojiler *</label>
            <div className="flex gap-2">
              <input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
                className="flex-1 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20"
                placeholder="React, TypeScript..."
              />
              <button type="button" onClick={addTech} className="rounded-xl bg-[var(--color-primary)] px-4 text-sm font-medium text-white hover:opacity-90">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {techs.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {techs.map((tech) => (
                  <span key={tech} className="flex items-center gap-1 rounded-lg bg-[var(--color-primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-primary)]">
                    {tech}
                    <button type="button" onClick={() => removeTech(tech)} className="hover:text-[var(--color-error)]">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.technologies && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.technologies.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Dönem</label>
              <select {...register("semester")} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none">
                <option value="">Seçiniz</option>
                <option value="fall">Güz</option>
                <option value="spring">Bahar</option>
                <option value="summer">Yaz</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Yıl</label>
              <input {...register("year", { valueAsNumber: true })} type="number" min="2000" max="2030" className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none" placeholder="2025" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">GitHub URL</label>
            <input {...register("githubUrl")} placeholder="https://github.com/..." className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">YouTube URL</label>
            <input {...register("youtubeUrl")} placeholder="https://youtube.com/watch?v=..." className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Demo / Harici URL</label>
            <input {...register("externalUrl")} placeholder="https://..." className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-[var(--color-ring)] focus:outline-none" />
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50">
            {loading ? t("common.loading") : "Projeyi Ekle"}
          </button>
        </form>
      </div>
    </div>
  );
}
