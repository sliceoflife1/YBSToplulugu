"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Upload, 
  FileText, 
  FileArchive, 
  Paperclip 
} from "lucide-react";
import { useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { projectSchema, type ProjectInput } from "@/lib/validations/profile";
import RichTextEditor from "@/components/community/RichTextEditor";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"];
const DOCUMENT_EXTENSIONS = [".zip", ".rar", ".odt", ".txt", ".rtf", ".docx", ".xls", ".pptx", ".pdf"];
const ALL_ALLOWED_EXTENSIONS = [...IMAGE_EXTENSIONS, ...DOCUMENT_EXTENSIONS];
const MAX_FILES = 10;

interface AttachedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
  blobUrl?: string;
  errorMessage?: string;
}

export default function NewProjectPage() {
  const t = useTranslations();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [techInput, setTechInput] = useState("");
  const [techs, setTechs] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: { technologies: [], mediaUrls: [] },
  });

  const descriptionValue = watch("description");

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

  const handleEditorChange = useCallback(
    (html: string) => {
      setValue("description", html, { shouldValidate: true });
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
          const percentComplete = Math.round((event.loaded / event.total) * 90) + 10;
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
      setAttachedFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, status: "error", errorMessage: err.message || "Yüklenemedi" } : f)
      );
      toast.error(`${file.name} yüklenirken hata oluştu: ${err.message || ""}`);
    }
  };

  // Sürükle-bırak veya Seçim Sonrası Tetiklenen Metot
  const handleFileSelection = (files: FileList | null) => {
    if (!files) return;

    const fileList = Array.from(files);
    
    // Toplam dosya adedi sınırını aşma kontrolü
    if (attachedFiles.length + fileList.length > MAX_FILES) {
      toast.error(`En fazla ${MAX_FILES} dosya ekleyebilirsiniz.`);
      return;
    }

    const newAttachments: AttachedFile[] = [];

    fileList.forEach(file => {
      const { valid, error } = validateFile(file);
      const fileId = Math.random().toString(36).substring(7);

      if (!valid) {
        toast.error(error);
        return;
      }

      const newAttach: AttachedFile = {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        status: "idle",
        progress: 0
      };

      newAttachments.push(newAttach);
    });

    if (newAttachments.length === 0) return;

    setAttachedFiles(prev => [...prev, ...newAttachments]);

    // Her bir yeni dosyayı sırayla yükle
    newAttachments.forEach(attach => {
      uploadToAzure(attach.file, attach.id);
    });
  };

  // Ekli Dosyayı Kaldırma
  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles(prev => {
      const filtered = prev.filter(f => f.id !== fileId);
      const urls = filtered.filter(f => f.status === "success" && f.blobUrl).map(f => f.blobUrl!);
      setValue("mediaUrls", urls);
      return filtered;
    });
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
    if ([".zip", ".rar"].includes(ext)) {
      return <FileArchive className="h-5 w-5 text-amber-500 shrink-0" />;
    }
    return <FileText className="h-5 w-5 text-indigo-500 shrink-0" />;
  };

  const onSubmit = async (data: ProjectInput) => {
    // Yüklemesi devam eden dosya kontrolü
    const isUploading = attachedFiles.some(f => f.status === "uploading");
    if (isUploading) {
      toast.error("Lütfen tüm dosyaların yüklenmesini bekleyin.");
      return;
    }

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
      media_urls: data.mediaUrls || [],
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
        <h1 className="mb-6 text-2xl font-bold text-[var(--color-foreground)]">Yeni Proje Ekle</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Proje Başlığı *</label>
            <input 
              {...register("title")} 
              className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
              placeholder="Örn: E-Ticaret Web Uygulaması" 
            />
            {errors.title && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Açıklama *</label>
            <RichTextEditor
              content={descriptionValue || ""}
              onChange={handleEditorChange}
              minHeight="min-h-[160px]"
            />
            {errors.description && <p className="mt-1.5 text-xs text-[var(--color-error)]">{errors.description.message}</p>}
          </div>

          {/* Dosya & Fotoğraf Ekleme Alanı */}
          <div>
            <label className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide block mb-2">
              Proje Dosyaları & Fotoğraflar (En Fazla {MAX_FILES} Adet)
            </label>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelection(e.dataTransfer.files);
              }}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/10 p-6 text-center hover:bg-[var(--color-muted)]/20 hover:border-indigo-500/50 transition-all cursor-pointer group"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="h-8 w-8 text-[var(--color-muted-foreground)] group-hover:text-indigo-500 transition-colors mb-2" />
              <p className="text-xs font-semibold text-[var(--color-foreground)]">
                Dosyaları sürükleyip bırakın veya seçmek için tıklayın
              </p>
              <p className="text-[10px] text-[var(--color-muted-foreground)] mt-1.5">
                Resimler en fazla 10MB, döküman ve arşivler (.zip, .rar vb.) en fazla 30MB
              </p>
              <input 
                id="file-input"
                type="file" 
                multiple
                className="hidden" 
                onChange={(e) => handleFileSelection(e.target.files)}
                accept={ALL_ALLOWED_EXTENSIONS.join(",")}
              />
            </div>

            {/* Dosya Yükleme İlerleme Listesi */}
            {attachedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachedFiles.map((file) => {
                  const filename = file.name;
                  const isImg = IMAGE_EXTENSIONS.includes(file.name.substring(file.name.lastIndexOf(".")).toLowerCase());
                  
                  return (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3 text-xs bg-[var(--color-card)] shadow-sm animate-fade-in"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
                        {isImg ? (
                          file.status === "success" && file.blobUrl ? (
                            <img 
                              src={file.blobUrl} 
                              alt="Ekli resim" 
                              className="h-8 w-8 rounded object-cover shrink-0 border border-[var(--color-border)]"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-muted-foreground)] shrink-0 font-bold">IMG</div>
                          )
                        ) : (
                          getFileIcon(file.name)
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate text-[var(--color-foreground)]">{filename}</p>
                          <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">
                            {Math.round(file.size / 1024)} KB 
                            {file.status === "uploading" && ` • Yükleniyor... %${file.progress}`}
                            {file.status === "success" && " • Yüklendi"}
                            {file.status === "error" && ` • Hata: ${file.errorMessage}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {file.status === "uploading" && (
                          <div className="h-3 w-20 rounded-full bg-[var(--color-muted)] overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 transition-all duration-300"
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAttachedFile(file.id)}
                          className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Technologies */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Teknolojiler *</label>
            <div className="flex gap-2">
              <input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
                className="flex-1 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="React, TypeScript..."
              />
              <button type="button" onClick={addTech} className="rounded-xl bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {techs.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {techs.map((tech) => (
                  <span key={tech} className="flex items-center gap-1.5 rounded-lg bg-indigo-500/10 px-2.5 py-1.5 text-xs font-semibold text-indigo-500">
                    {tech}
                    <button type="button" onClick={() => removeTech(tech)} className="hover:text-red-500 transition-colors">
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
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Dönem</label>
              <select {...register("semester")} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-indigo-500 focus:outline-none">
                <option value="">Seçiniz</option>
                <option value="fall">Güz</option>
                <option value="spring">Bahar</option>
                <option value="summer">Yaz</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Yıl</label>
              <input {...register("year", { valueAsNumber: true })} type="number" min="2000" max="2030" className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-indigo-500 focus:outline-none" placeholder="2025" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">GitHub URL</label>
            <input {...register("githubUrl")} placeholder="https://github.com/..." className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">YouTube URL</label>
            <input {...register("youtubeUrl")} placeholder="https://youtube.com/watch?v=..." className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Demo / Harici URL</label>
            <input {...register("externalUrl")} placeholder="https://..." className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
            {loading ? t("common.loading") : "Projeyi Ekle"}
          </button>
        </form>
      </div>
    </div>
  );
}
