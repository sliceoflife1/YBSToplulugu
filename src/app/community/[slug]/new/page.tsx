"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Type,
  AlignLeft,
  Sparkles,
  Hash,
  Smile,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  Code,
  Link2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { postSchema, type PostInput } from "@/lib/validations/community";
import { createPost } from "@/app/community/actions";

const MAX_TITLE = 200;
const MAX_CONTENT = 10000;

export default function NewPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState("");
  const [subredditId, setSubredditId] = useState("");
  const [subredditName, setSubredditName] = useState("");
  const [subredditColor, setSubredditColor] = useState("#3B82F6");
  const [subredditIcon, setSubredditIcon] = useState("");
  const [preview, setPreview] = useState(false);
  const [titleLength, setTitleLength] = useState(0);
  const [contentLength, setContentLength] = useState(0);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    params.then(async (p) => {
      setSlug(p.slug);
      const supabase = createClient();
      const { data } = await supabase
        .from("subreddits")
        .select("id, name, color, icon")
        .eq("slug", p.slug)
        .single();
      if (data) {
        setSubredditId(data.id);
        setSubredditName(data.name);
        setSubredditColor(data.color || "#3B82F6");
        setSubredditIcon(data.icon || "");
      }
    });
  }, [params]);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<PostInput>({
    resolver: zodResolver(postSchema),
    mode: "onChange",
  });

  const titleValue = watch("title") || "";
  const contentValue = watch("content") || "";

  useEffect(() => {
    setTitleLength(titleValue.length);
  }, [titleValue]);

  useEffect(() => {
    setContentLength(contentValue.length);
  }, [contentValue]);

  useEffect(() => {
    if (subredditId) setValue("subredditId", subredditId);
  }, [subredditId, setValue]);

  // Auto-resize textarea
  const handleContentChange = useCallback(() => {
    const el = contentRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.max(200, el.scrollHeight)}px`;
    }
  }, []);

  // Formatting helpers
  const insertFormat = useCallback(
    (prefix: string, suffix: string = "") => {
      const el = contentRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = contentValue.substring(start, end);
      const newText =
        contentValue.substring(0, start) +
        prefix +
        (selected || "metin") +
        (suffix || prefix) +
        contentValue.substring(end);
      setValue("content", newText, { shouldValidate: true });
      setTimeout(() => {
        el.focus();
        const cursorPos = start + prefix.length + (selected || "metin").length;
        el.setSelectionRange(cursorPos, cursorPos);
      }, 0);
    },
    [contentValue, setValue]
  );

  const onSubmit = async (data: PostInput) => {
    setLoading(true);

    const result = await createPost(data, slug);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("🎉 Gönderi başarıyla paylaşıldı!");
    router.push(`/community/${slug}`);
    router.refresh();
  };

  // Content ref registration
  const { ref: contentRegRef, ...contentRegRest } = register("content");

  return (
    <div className="min-h-screen bg-[var(--color-muted)]/30">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href={`/community/${slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-muted-foreground)] transition-all hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              {preview ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Düzenle
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" /> Önizleme
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* Community badge */}
        {subredditName && (
          <div className="mb-5 flex items-center gap-3 animate-fade-in">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-md"
              style={{ backgroundColor: subredditColor }}
            >
              {subredditIcon || subredditName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                Gönderi paylaşılacak topluluk
              </p>
              <p className="font-semibold text-[var(--color-foreground)]">
                {subredditName}
              </p>
            </div>
          </div>
        )}

        {/* Main editor card */}
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl animate-fade-in">
          <form onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register("subredditId")} />

            {/* Title section */}
            <div className="border-b border-[var(--color-border)] p-5">
              <div className="flex items-center gap-2 mb-2">
                <Type className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                <span className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
                  Başlık
                </span>
                <span
                  className={`ml-auto text-xs font-mono tabular-nums transition-colors ${
                    titleLength > MAX_TITLE * 0.9
                      ? "text-red-500"
                      : titleLength > MAX_TITLE * 0.7
                      ? "text-amber-500"
                      : "text-[var(--color-muted-foreground)]"
                  }`}
                >
                  {titleLength}/{MAX_TITLE}
                </span>
              </div>
              <input
                {...register("title")}
                maxLength={MAX_TITLE}
                className="w-full bg-transparent text-xl font-bold text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/50 focus:outline-none"
                placeholder="Dikkat çekici bir başlık yazın..."
                autoFocus
              />
              {errors.title && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Formatting toolbar */}
            {!preview && (
              <div className="flex items-center gap-1 border-b border-[var(--color-border)] px-5 py-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => insertFormat("**")}
                  className="rounded-md p-1.5 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  title="Kalın"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat("*")}
                  className="rounded-md p-1.5 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  title="İtalik"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <div className="mx-1 h-4 w-px bg-[var(--color-border)]" />
                <button
                  type="button"
                  onClick={() => insertFormat("- ", "")}
                  className="rounded-md p-1.5 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  title="Liste"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat("`")}
                  className="rounded-md p-1.5 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  title="Kod"
                >
                  <Code className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormat("[", "](url)")}
                  className="rounded-md p-1.5 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  title="Bağlantı"
                >
                  <Link2 className="h-4 w-4" />
                </button>
                <div className="mx-1 h-4 w-px bg-[var(--color-border)]" />
                <button
                  type="button"
                  onClick={() => insertFormat("# ", "")}
                  className="rounded-md p-1.5 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  title="Başlık"
                >
                  <Hash className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Content section */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlignLeft className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                <span className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
                  İçerik
                </span>
                <span
                  className={`ml-auto text-xs font-mono tabular-nums transition-colors ${
                    contentLength > MAX_CONTENT * 0.9
                      ? "text-red-500"
                      : contentLength > MAX_CONTENT * 0.7
                      ? "text-amber-500"
                      : "text-[var(--color-muted-foreground)]"
                  }`}
                >
                  {contentLength}/{MAX_CONTENT}
                </span>
              </div>

              {preview ? (
                <div className="prose prose-sm min-h-[200px] max-w-none rounded-xl bg-[var(--color-muted)]/50 p-4 text-[var(--color-foreground)]">
                  {contentValue ? (
                    <div className="whitespace-pre-wrap">{contentValue}</div>
                  ) : (
                    <p className="text-[var(--color-muted-foreground)] italic">
                      Önizlenecek içerik yok...
                    </p>
                  )}
                </div>
              ) : (
                <textarea
                  {...contentRegRest}
                  ref={(e) => {
                    contentRegRef(e);
                    contentRef.current = e;
                  }}
                  onInput={handleContentChange}
                  maxLength={MAX_CONTENT}
                  rows={8}
                  className="w-full resize-none bg-transparent text-sm leading-relaxed text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/50 focus:outline-none"
                  placeholder="Düşüncelerinizi buraya yazın... Markdown desteklenir."
                />
              )}
              {errors.content && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                  {errors.content.message}
                </p>
              )}
            </div>

            {/* Footer / Submit */}
            <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-muted)]/30 px-5 py-4">
              <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Markdown desteklenir</span>
              </div>
              <button
                type="submit"
                disabled={loading || !subredditId || !isValid}
                className="relative flex items-center gap-2 overflow-hidden rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: `linear-gradient(135deg, ${subredditColor}, ${subredditColor}dd)`,
                }}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Paylaşılıyor...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Paylaş
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Guidelines */}
        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            📋 Topluluk Kuralları
          </h4>
          <ul className="mt-2 space-y-1.5 text-xs text-[var(--color-muted-foreground)]">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--color-muted-foreground)]" />
              Saygılı ve yapıcı bir dil kullanın
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--color-muted-foreground)]" />
              Spam ve reklam içerikli paylaşımlardan kaçının
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--color-muted-foreground)]" />
              Kişisel bilgileri paylaşmayın
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1 w-1 rounded-full bg-[var(--color-muted-foreground)]" />
              Konuyla ilgili ve anlamlı paylaşımlar yapın
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
