"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { postSchema, type PostInput } from "@/lib/validations/community";

export default function NewPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");
  const [subredditId, setSubredditId] = useState("");

  useEffect(() => {
    params.then(async (p) => {
      setSlug(p.slug);
      const supabase = createClient();
      const { data } = await supabase.from("subreddits").select("id").eq("slug", p.slug).single();
      if (data) setSubredditId(data.id);
    });
  }, [params]);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<PostInput>({
    resolver: zodResolver(postSchema),
  });

  useEffect(() => {
    if (subredditId) setValue("subredditId", subredditId);
  }, [subredditId, setValue]);

  const onSubmit = async (data: PostInput) => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase.from("posts").insert({
      subreddit_id: data.subredditId,
      author_id: user.id,
      title: data.title,
      content: data.content,
    });

    if (error) {
      toast.error("Gönderi oluşturulurken bir hata oluştu");
      setLoading(false);
      return;
    }

    toast.success("Gönderi başarıyla paylaşıldı!");
    router.push(`/community/${slug}`);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href={`/community/${slug}`} className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </Link>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-lg animate-fade-in">
        <h1 className="mb-6 text-2xl font-bold">Yeni Gönderi</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input type="hidden" {...register("subredditId")} />

          <div>
            <label className="mb-1.5 block text-sm font-medium">Başlık *</label>
            <input {...register("title")} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" placeholder="Gönderi başlığı..." />
            {errors.title && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">İçerik *</label>
            <textarea {...register("content")} rows={8} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/20" placeholder="Düşüncelerinizi paylaşın..." />
            {errors.content && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.content.message}</p>}
          </div>

          <button type="submit" disabled={loading || !subredditId} className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50">
            <Send className="h-4 w-4" />
            {loading ? t("common.loading") : "Paylaş"}
          </button>
        </form>
      </div>
    </div>
  );
}
