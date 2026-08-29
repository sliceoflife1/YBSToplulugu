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
  Globe,
  ShieldCheck,
  Code2,
  Users,
  CheckCircle2,
  Sparkles,
  Info
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { projectSchema, type ProjectInput } from "@/lib/validations/profile";
import RichTextEditor from "@/components/community/RichTextEditor";
import ExternalImageInput from "@/components/common/external-image-input";
import type { Profile } from "@/types/database";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"];
const DOCUMENT_EXTENSIONS = [".zip", ".rar", ".odt", ".txt", ".rtf", ".docx", ".xls", ".pptx", ".pdf"];
const ALL_ALLOWED_EXTENSIONS = [...IMAGE_EXTENSIONS, ...DOCUMENT_EXTENSIONS];
const MAX_FILES = 10;

const PROJECT_TYPES = [
  { value: "personal", label: "Kişisel Proje" },
  { value: "term_project", label: "Dönem Projesi" },
  { value: "graduation_thesis", label: "Bitirme Tezi" },
  { value: "hackathon", label: "Hackathon Projesi" },
  { value: "course_assignment", label: "Ders Ödevi" },
  { value: "other", label: "Diğer" },
];

const LICENSES = [
  { value: "none", label: "Özel / Lisanssız (Tüm Hakları Saklıdır)", desc: "Kodunuz tescilli kalır, izin vermez." },
  { value: "mit", label: "MIT Lisansı (En Popüler / Özgür)", desc: "Herkes serbestçe kopyalayabilir, değiştirebilir ve ticari kullanabilir." },
  { value: "apache_2", label: "Apache 2.0 Lisansı", desc: "Özgür kullanım sunar, ek olarak patent koruması sağlar." },
  { value: "gpl_v3", label: "GNU GPL v3 Lisansı", desc: "Türetilen projelerin de açık kaynak olmasını şart koşar." },
];

const YEARS = Array.from({ length: 11 }, (_, i) => 2030 - i);

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
  const [externalImageUrls, setExternalImageUrls] = useState<string[]>([]);
  
  // Takım Arkadaşları Seçimi State'leri
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Profile[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: { 
      technologies: [], 
      mediaUrls: [], 
      projectType: "personal",
      license: "none",
      year: new Date().getFullYear(),
      semester: "fall",
      teamMembers: [],
    },
  });

  const descriptionValue = watch("description");
  const selectedLicense = watch("license");

  // Topluluktaki diğer aktif öğrencileri/üyeleri çek
  useEffect(() => {
    const fetchProfiles = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .eq("is_active", true)
        .order("first_name", { ascending: true });

      if (data) {
        setAllProfiles(data as Profile[]);
      }
    };
    fetchProfiles();
  }, []);

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

  const toggleTeamMember = (profileItem: Profile) => {
    let updated: Profile[];
    if (selectedMembers.some(m => m.id === profileItem.id)) {
      updated = selectedMembers.filter(m => m.id !== profileItem.id);
    } else {
      updated = [...selectedMembers, profileItem];
    }
    setSelectedMembers(updated);
    setValue("teamMembers", updated.map(m => m.id));
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
    
    if (!ALL_ALLOWED_EXTENSIONS.includes(ext)) {
      return { 
        valid: false, 
        error: `Desteklenmeyen dosya formatı. İzin verilen formatlar: ${ALL_ALLOWED_EXTENSIONS.join(", ")}` 
      };
    }

    const isImage = IMAGE_EXTENSIONS.includes(ext);
    const maxSize = isImage ? 10 * 1024 * 1024 : 30 * 1024 * 1024;
    
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

  const uploadToAzure = async (file: File, fileId: string) => {
    setAttachedFiles(prev => 
      prev.map(f => f.id === fileId ? { ...f, status: "uploading", progress: 10 } : f)
    );

    try {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/storage/upload", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 90) + 10;
          setAttachedFiles(prev => 
            prev.map(f => f.id === fileId ? { ...f, progress: percentComplete } : f)
          );
        }
      };

      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.blobUrl) {
              resolve(data.blobUrl);
            } else {
              reject(new Error(data.error || `Yükleme hatası (Status: ${xhr.status})`));
            }
          } catch {
            reject(new Error(`Yükleme hatası (Status: ${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Ağ hatası oluştu"));
      });

      xhr.send(formData);
      const blobUrl = await uploadPromise;

      setAttachedFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, status: "success", progress: 100, blobUrl } : f)
      );

      setAttachedFiles(latest => {
        const urls = latest.filter(f => f.status === "success" && f.blobUrl).map(f => f.blobUrl!);
        setValue("mediaUrls", [...urls, ...externalImageUrls]);
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

  const handleExternalImageUrlsChange = (newExternalUrls: string[]) => {
    setExternalImageUrls(newExternalUrls);
    const blobUrls = attachedFiles.filter(f => f.status === "success" && f.blobUrl).map(f => f.blobUrl!);
    setValue("mediaUrls", [...blobUrls, ...newExternalUrls]);
  };

  const handleFileSelection = (files: FileList | null) => {
    if (!files) return;
    const fileList = Array.from(files);
    
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

      newAttachments.push({
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        status: "idle",
        progress: 0
      });
    });

    if (newAttachments.length === 0) return;

    setAttachedFiles(prev => [...prev, ...newAttachments]);
    newAttachments.forEach(attach => uploadToAzure(attach.file, attach.id));
  };

  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles(prev => {
      const filtered = prev.filter(f => f.id !== fileId);
      const urls = filtered.filter(f => f.status === "success" && f.blobUrl).map(f => f.blobUrl!);
      setValue("mediaUrls", [...urls, ...externalImageUrls]);
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
    const isUploading = attachedFiles.some(f => f.status === "uploading");
    if (isUploading) {
      toast.error("Lütfen tüm dosyaların yüklenmesini bekleyin.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const teamMemberIds = selectedMembers.map(m => m.id);

    const { data: insertedProject, error } = await supabase.from("projects").insert({
      user_id: user.id,
      title: data.title,
      description: data.description,
      technologies: data.technologies,
      project_type: data.projectType,
      github_url: data.githubUrl,
      youtube_url: data.youtubeUrl,
      behance_url: data.behanceUrl || null,
      external_url: data.externalUrl,
      semester: data.semester,
      year: data.year,
      team_members: teamMemberIds,
      license: data.license || "none",
      media_urls: data.mediaUrls || [],
    }).select().single();

    if (error) {
      toast.error("Proje eklenirken bir hata oluştu: " + error.message);
      setLoading(false);
      return;
    }

    // Etiketlenen Takım Arkadaşlarina Sistem Bildirimi Gönder
    if (teamMemberIds.length > 0 && insertedProject) {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();

      const authorName = currentProfile
        ? `${currentProfile.first_name} ${currentProfile.last_name}`
        : "Bir topluluk üyesi";

      for (const memberId of teamMemberIds) {
        await supabase.from("notifications").insert({
          recipient_id: memberId,
          type: "system",
          title: "Grup Projesinde Etiketlendiniz 🚀",
          message: `${authorName} seni '${data.title}' projesine takım arkadaşı olarak ekledi. Profilinde görüntüleyebilirsin. (İstersen profilin üzerinden etiketi kaldırabilirsin).`,
          metadata: { link: `/u/${user.id}`, project_id: insertedProject.id },
          is_read: false,
        });
      }
    }

    toast.success("Proje başarıyla eklendi!");
    router.push("/profile");
    router.refresh();
  };

  const filteredProfiles = allProfiles.filter(p => {
    const q = memberSearch.toLowerCase();
    return (
      (p.first_name || "").toLowerCase().includes(q) ||
      (p.last_name || "").toLowerCase().includes(q) ||
      (p.edu_email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </Link>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-8 shadow-lg animate-fade-in">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Yeni Proje Paylaş</h1>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
              Akademik ve kişisel projelerinizi toplulukla buluşturun, portfolyonuzu zenginleştirin.
            </p>
          </div>
        </div>

        {/* BİLİNÇLENDİRME & UYARI KARTLARI */}
        <div className="mb-8 space-y-3">
          {/* GitHub Gizlilik Uyarısı */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 text-xs">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-900 dark:text-blue-300">
                  🔓 GitHub Deposu Herkese Açık (Public) Olmalıdır!
                </p>
                <p className="mt-1 text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                  GitHub deponuz varsayılan olarak "Private" (Gizli) açılmış olabilir. Diğer öğrenci arkadaşlarımızın ve akademisyenlerin projenizi görebilmesi için GitHub depo ayarlarınızdan reponuzu **Public** olarak değiştirdiğinizden emin olun. (Gizli kalınca diğer kullanıcılar 404 hatası alır).
                </p>
              </div>
            </div>
          </div>

          {/* Kod & Veri Güvenliği Uyarısı */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 dark:text-amber-300">
                  ⚠️ Hassas Veri & Kod Güvenliği Hatırlatması
                </p>
                <p className="mt-1 text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                  GitHub deponuzu herkese açık yaptığınızda, kodlarınız dünyadaki herkes tarafından görüntülenebilir ve kopyalanabilir. Lütfen `.env` dosyalarınızı, veritabanı şifrelerinizi, API Secret Key anahtarlarınızı veya özel verilerinizi deponuza **YÜKLEMEYİN**.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Proje Başlığı */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Proje Başlığı *</label>
            <input 
              {...register("title")} 
              className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
              placeholder="Örn: Yapay Zeka Destekli Akıllı Kampüs Rehberi" 
            />
            {errors.title && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.title.message}</p>}
          </div>

          {/* Proje Türü (Kategori) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Proje Türü (Kategori) *</label>
            <select 
              {...register("projectType")} 
              className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {PROJECT_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
            {errors.projectType && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.projectType.message}</p>}
          </div>

          {/* Açıklama */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Açıklama *</label>
            <RichTextEditor
              content={descriptionValue || ""}
              onChange={handleEditorChange}
              minHeight="min-h-[180px]"
            />
            {errors.description && <p className="mt-1.5 text-xs text-[var(--color-error)]">{errors.description.message}</p>}
          </div>

          {/* Dönem ve Yıl (Zorunlu ve Select) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Dönem *</label>
              <select {...register("semester")} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none">
                <option value="fall">Güz Dönemi</option>
                <option value="spring">Bahar Dönemi</option>
                <option value="summer">Yaz Okulu</option>
              </select>
              {errors.semester && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.semester.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Yıl *</label>
              <select {...register("year", { valueAsNumber: true })} className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none">
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {errors.year && <p className="mt-1 text-xs text-[var(--color-error)]">{errors.year.message}</p>}
            </div>
          </div>

          {/* ZORUNLU URL ALANLARI VE ÖRNEKLİ HATA MESAJLARI */}
          <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-5">
            <h3 className="text-xs font-bold text-[var(--color-foreground)] uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="h-4 w-4 text-indigo-600" />
              Proje Bağlantıları (Zorunlu Alanlar)
            </h3>

            {/* GitHub URL */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-foreground)]">GitHub Repo URL *</label>
              <input 
                {...register("githubUrl")} 
                placeholder="https://github.com/kullanici/proje-adi" 
                className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-indigo-500 focus:outline-none" 
              />
              <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
                Örnek doğru format: <span className="font-mono text-indigo-600">https://github.com/kullanici/proje-repo</span>
              </p>
              {errors.githubUrl && <p className="mt-1 text-xs font-medium text-[var(--color-error)]">{errors.githubUrl.message}</p>}
            </div>

            {/* YouTube URL */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-foreground)]">YouTube Tanıtım/Demo Video URL *</label>
              <input 
                {...register("youtubeUrl")} 
                placeholder="https://www.youtube.com/watch?v=..." 
                className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-indigo-500 focus:outline-none" 
              />
              <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
                Örnek doğru format: <span className="font-mono text-indigo-600">https://www.youtube.com/watch?v=dQw4w9WgXcQ</span> veya <span className="font-mono text-indigo-600">https://youtu.be/dQw4w9WgXcQ</span>
              </p>
              {errors.youtubeUrl && <p className="mt-1 text-xs font-medium text-[var(--color-error)]">{errors.youtubeUrl.message}</p>}
            </div>

            {/* Demo / Harici URL */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-foreground)]">Canlı Demo / Web Sitesi URL *</label>
              <input 
                {...register("externalUrl")} 
                placeholder="https://proje-demo.vercel.app" 
                className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-indigo-500 focus:outline-none" 
              />
              <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">
                Örnek doğru format: <span className="font-mono text-indigo-600">https://proje-demo.vercel.app</span> veya <span className="font-mono text-indigo-600">https://benimprojem.com</span>
              </p>
              {errors.externalUrl && <p className="mt-1 text-xs font-medium text-[var(--color-error)]">{errors.externalUrl.message}</p>}
            </div>

            {/* Behance / Tasarım URL (Opsiyonel) */}
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted-foreground)]">Behance / Tasarım Portfolyo URL (İsteğe Bağlı)</label>
              <input 
                {...register("behanceUrl")} 
                placeholder="https://behance.net/gallery/..." 
                className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-indigo-500 focus:outline-none" 
              />
              {errors.behanceUrl && <p className="mt-1 text-xs font-medium text-[var(--color-error)]">{errors.behanceUrl.message}</p>}
            </div>
          </div>

          {/* TAKIM ARKADAŞLARI (GRUP PROJESİ ETİKETLEME) */}
          <div className="rounded-xl border border-[var(--color-border)] p-5 bg-[var(--color-card)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  Takım Arkadaşları (Grup Projesi)
                </label>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                  Projede birlikte çalıştığınız topluluk üyelerini etiketleyin. Proje onların profillerinde de listelenecektir. (İsterlerse etiketi kendileri kaldırabilirler).
                </p>
              </div>
            </div>

            {/* Seçilen Takım Arkadaşlar */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-2 rounded-lg bg-[var(--color-muted)]/40">
                {selectedMembers.map(m => (
                  <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 border border-indigo-200">
                    {m.first_name} {m.last_name}
                    <button type="button" onClick={() => toggleTeamMember(m)} className="hover:text-red-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Öğrenci / Üye adı veya e-posta ile ara..."
              className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-xs focus:border-indigo-500 focus:outline-none mb-2"
            />

            {memberSearch.trim().length > 0 && (
              <div className="max-h-40 overflow-y-auto divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-1 text-xs">
                {filteredProfiles.length > 0 ? (
                  filteredProfiles.slice(0, 5).map(p => {
                    const isSelected = selectedMembers.some(m => m.id === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleTeamMember(p)}
                        className={`flex w-full items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          isSelected ? "bg-indigo-500/10 text-indigo-600 font-bold" : "hover:bg-[var(--color-muted)]"
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{p.first_name} {p.last_name}</p>
                          <p className="text-[10px] text-[var(--color-muted-foreground)]">{p.department || p.edu_email}</p>
                        </div>
                        {isSelected ? <CheckCircle2 className="h-4 w-4 text-indigo-600" /> : <Plus className="h-4 w-4" />}
                      </button>
                    );
                  })
                ) : (
                  <p className="p-2 text-center text-[11px] text-[var(--color-muted-foreground)]">Üye bulunamadı</p>
                )}
              </div>
            )}
          </div>

          {/* LİSANS SEÇİMİ VE İPUCU REHBERİ */}
          <div className="rounded-xl border border-[var(--color-border)] p-5 bg-[var(--color-card)]">
            <label className="mb-2 block text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Açık Kaynak Lisansı (İsteğe Bağlı)
            </label>
            <select 
              {...register("license")} 
              className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none mb-3"
            >
              {LICENSES.map((lic) => (
                <option key={lic.value} value={lic.value}>{lic.label}</option>
              ))}
            </select>

            {/* Seçilen lisans bilgi rehberi */}
            {selectedLicense && (
              <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3 text-xs text-purple-900 dark:text-purple-300">
                <p className="font-bold flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-purple-600" />
                  Lisans Rehberi:
                </p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  {LICENSES.find(l => l.value === selectedLicense)?.desc}
                </p>
              </div>
            )}
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

            {/* Harici Görsel URL Ekleme */}
            <div className="mt-5 border-t border-[var(--color-border)] pt-4">
              <ExternalImageInput
                urls={externalImageUrls}
                onChange={handleExternalImageUrlsChange}
                maxCount={10}
              />
            </div>

            {/* Yüklenen Dosyalar */}
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

          {/* Teknolojiler */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">Teknolojiler *</label>
            <div className="flex gap-2">
              <input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
                className="flex-1 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="React, TypeScript, Next.js..."
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

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50">
            {loading ? t("common.loading") : "Projeyi Paylaş ve Yayınla 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}

