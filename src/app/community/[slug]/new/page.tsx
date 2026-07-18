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
  Eye,
  EyeOff,
  Upload,
  X,
  FileText,
  FileArchive,
  Paperclip,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { postSchema, type PostInput } from "@/lib/validations/community";
import { createPost } from "@/app/community/actions";
import RichTextEditor from "@/components/community/RichTextEditor";

const MAX_TITLE = 200;
const MAX_CONTENT = 10000;
const MAX_FILES = 10;

// İzin verilen görsel uzantıları ve diğer uzantılar
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"];
const OTHER_EXTENSIONS = [".zip", ".rar", ".odt", ".txt", ".rtf", ".docx", ".xls", ".pptx", ".pdf"];
const ALL_ALLOWED_EXTENSIONS = [...IMAGE_EXTENSIONS, ...OTHER_EXTENSIONS];

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  blobUrl?: string;
  type: string;
}

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

  // Dosya Yükleme Durumları
  const [attachedFiles, setAttachedFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // YouTube URL State
  const [youtubeUrlInput, setYoutubeUrlInput] = useState("");

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
    defaultValues: {
      title: "",
      content: "",
      mediaUrls: [],
      youtubeUrl: "",
    },
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

  // TipTap içeriğini react-hook-form'a yazma
  const handleEditorChange = useCallback(
    (html: string) => {
      setValue("content", html, { shouldValidate: true });
    },
    [setValue]
  );

  // Dosya Formatı ve Boyutu Kontrolü
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    // 1. Format Kontrolü
    if (!ALL_ALLOWED_EXTENSIONS.includes(ext)) {
      return { 
        valid: false, 
        error: `Desteklenmeyen dosya formatı. İzin verilen formatlar: ${ALL_ALLOWED_EXTENSIONS.join(", ")}` 
      };
    }

    // 2. Boyut Kontrolü
    const isImage = IMAGE_EXTENSIONS.includes(ext);
    const maxSize = isImage ? 10 * 1024 * 1024 : 30 * 1024 * 1024; // 10MB vs 30MB
    
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: isImage 
          ? `Görsel dosyaları en fazla 10MB olabilir (${file.name})` 
          : `Doküman/arşiv dosyaları en fazla 30MB olabilir (${file.name})` 
      };
    }

    return { valid: true };
  };

  // Azure Blob'a Dosya Yükleme Mantığı
  const uploadToAzure = async (file: File, fileId: string) => {
    setAttachedFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, status: "uploading", progress: 10 } : f)
    );

    try {
      // 1. SAS Token Al
      const sasRes = await fetch("/api/storage/sas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      const sasData = await sasRes.json();
      if (!sasRes.ok) throw new Error(sasData.error || "SAS token alınamadı");

      const { uploadUrl, blobUrl } = sasData;

      // 2. XMLHttpRequest kullanarak doğrudan Azure Blob'a yükle (Progress takibi için)
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 90) + 10; // SAS alma adımından sonra 10-100% arası
          setAttachedFiles(prev => 
            prev.map(f => f.id === fileId ? { ...f, progress: percentComplete } : f)
          );
        }
      };

      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 201 || xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Yükleme hatası (Status: ${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Ağ hatası oluştu"));
      });

      xhr.send(file);
      await uploadPromise;

      // Yükleme Başarılı
      setAttachedFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, status: "success", progress: 100, blobUrl } : f)
      );

      // React Hook Form payload'ını güncelle
      setAttachedFiles(latest => {
        const urls = latest.filter(f => f.status === "success" && f.blobUrl).map(f => f.blobUrl!);
        setValue("mediaUrls", urls);
        return latest;
      });

    } catch (err: any) {
      console.error(err);
      toast.error(`Dosya yüklenemedi: ${file.name}`);
      setAttachedFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, status: "error", progress: 0 } : f)
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);

    if (attachedFiles.length + selected.length > MAX_FILES) {
      toast.error(`En fazla ${MAX_FILES} dosya yükleyebilirsiniz.`);
      return;
    }

    selected.forEach(file => {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      const fileId = crypto.randomUUID();
      const newFile: UploadingFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "idle",
        type: file.type,
      };

      setAttachedFiles(prev => [...prev, newFile]);
      uploadToAzure(file, fileId);
    });
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      const urls = updated.filter(f => f.status === "success" && f.blobUrl).map(f => f.blobUrl!);
      setValue("mediaUrls", urls);
      return updated;
    });
  };

  const onSubmit = async (data: PostInput) => {
    // Devam eden yükleme varsa uyar
    const isUploading = attachedFiles.some(f => f.status === "uploading");
    if (isUploading) {
      toast.error("Lütfen tüm dosyaların yüklenmesini bekleyin.");
      return;
    }

    setLoading(true);

    // Zod şeması ve SQL uyumluluğu için youtubeUrl set et
    const finalData = {
      ...data,
      youtubeUrl: youtubeUrlInput || undefined,
    };

    const result = await createPost(finalData, slug);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("🎉 Gönderi başarıyla paylaşıldı!");
    router.push(`/community/${slug}`);
    router.refresh();
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext)) {
      return <ImageIcon className="h-5 w-5 text-emerald-500 shrink-0" />;
    }
    if ([".zip", ".rar"].includes(ext)) {
      return <FileArchive className="h-5 w-5 text-amber-500 shrink-0" />;
    }
    return <FileText className="h-5 w-5 text-indigo-500 shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-[var(--color-muted)]/30 pb-12">
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
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-md animate-glow-pulse"
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
                <span className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
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
                className="w-full bg-transparent text-xl font-bold text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]/30 focus:outline-none"
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

            {/* Content section */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3.5">
                <AlignLeft className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                <span className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide">
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
                <div 
                  className="prose prose-sm min-h-[200px] max-w-none rounded-xl bg-[var(--color-muted)]/50 p-4 text-[var(--color-foreground)]"
                  dangerouslySetInnerHTML={{ __html: contentValue || `<p class="text-[var(--color-muted-foreground)] italic">Önizlenecek içerik yok...</p>` }}
                />
              ) : (
                <RichTextEditor
                  content={contentValue}
                  onChange={handleEditorChange}
                />
              )}
              {errors.content && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                  {errors.content.message}
                </p>
              )}
            </div>

            {/* Media & YouTube Section */}
            {!preview && (
              <div className="border-t border-[var(--color-border)] p-5 space-y-4 bg-[var(--color-muted)]/5">
                {/* File Attachment Dropzone */}
                <div>
                  <label className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide block mb-2">
                    Dosya & Fotoğraf Ekle (En Fazla {MAX_FILES} Adet)
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] hover:border-indigo-500/50 rounded-xl p-6 bg-[var(--color-background)] hover:bg-indigo-500/5 transition-all cursor-pointer group"
                  >
                    <Upload className="h-8 w-8 text-[var(--color-muted-foreground)] group-hover:text-indigo-500 transition-colors mb-2" />
                    <p className="text-xs font-medium text-[var(--color-foreground)] mb-1">
                      Dosya seçmek için tıklayın
                    </p>
                    <p className="text-[10px] text-[var(--color-muted-foreground)] text-center max-w-md leading-relaxed">
                      Resimler için maks 10MB (.png, .jpg, .webp, .svg, .gif) <br />
                      Arşiv ve dokümanlar için maks 30MB (.zip, .rar, .pdf, .docx, .xls, .pptx, .txt vb.)
                    </p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange}
                      multiple
                      className="hidden" 
                      accept={ALL_ALLOWED_EXTENSIONS.join(",")}
                    />
                  </div>
                </div>

                {/* Uploaded Files List */}
                {attachedFiles.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {attachedFiles.map((file) => {
                      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
                      const isImg = IMAGE_EXTENSIONS.includes(ext) && file.status === "success" && file.blobUrl;
                      
                      return (
                        <div 
                          key={file.id}
                          className="flex items-center gap-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] p-3 relative group/file overflow-hidden"
                        >
                          {/* File Thumbnail or Icon */}
                          {isImg ? (
                            <img 
                              src={file.blobUrl} 
                              alt={file.name} 
                              className="h-10 w-10 rounded-lg object-cover border border-[var(--color-border)]"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-muted)] shrink-0">
                              {getFileIcon(file.name)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-xs font-medium text-[var(--color-foreground)] truncate">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-[var(--color-muted-foreground)]">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            {/* Progress bar */}
                            {file.status === "uploading" && (
                              <div className="w-full bg-[var(--color-muted)] h-1 rounded-full mt-1.5 overflow-hidden">
                                <div 
                                  className="bg-indigo-500 h-full transition-all duration-300"
                                  style={{ width: `${file.progress}%` }}
                                />
                              </div>
                            )}
                            {file.status === "error" && (
                              <span className="text-[9px] text-red-500 font-semibold mt-1 block">Yüklenemedi</span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* YouTube Video URL Input */}
                <div className="border-t border-[var(--color-border)] pt-4">
                  <label className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <svg className="h-4 w-4 text-red-500 fill-red-500 shrink-0" viewBox="0 0 24 24">
                      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg> YouTube Videosu Ekle
                  </label>
                  <div className="relative">
                    <input 
                      type="url" 
                      placeholder="https://www.youtube.com/watch?v=... veya https://youtu.be/..."
                      value={youtubeUrlInput}
                      onChange={(e) => setYoutubeUrlInput(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-2.5 pl-3 pr-10 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                    {youtubeUrlInput && (
                      <button
                        type="button"
                        onClick={() => setYoutubeUrlInput("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Footer / Submit */}
            <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-muted)]/30 px-5 py-4">
              <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Medya & Zengin Biçimlendirme Hazır</span>
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
              Paylaşacağınız dış bağlantıların güvenilir olmasına dikkat edin, sistem dış bağlantılarda güvenlik uyarısı gösterecektir.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
