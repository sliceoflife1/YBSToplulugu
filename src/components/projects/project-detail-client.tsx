"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Clock, 
  ArrowLeft, 
  Download, 
  FileText, 
  FileArchive, 
  Paperclip,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  Upload,
  Save,
  GitBranch,
  PlayCircle,
  Globe,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import ProjectUpvoteButton from "./project-upvote-button";
import RichTextEditor from "@/components/community/RichTextEditor";
import { editProject, deleteProject } from "@/app/projects/actions";
import { ReportModal } from "@/components/report-modal";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"];
const DOCUMENT_EXTENSIONS = [".zip", ".rar", ".odt", ".txt", ".rtf", ".docx", ".xls", ".pptx", ".pdf"];
const ALL_ALLOWED_EXTENSIONS = [...IMAGE_EXTENSIONS, ...DOCUMENT_EXTENSIONS];
const MAX_FILES = 10;

interface AttachedFile {
  id: string;
  name: string;
  size?: number;
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
  blobUrl: string;
  errorMessage?: string;
}

interface ProjectDetailClientProps {
  project: {
    id: string;
    title: string;
    description: string;
    technologies: string[] | null;
    github_url: string | null;
    youtube_url: string | null;
    behance_url: string | null;
    external_url: string | null;
    semester: string | null;
    year: number | null;
    media_urls: string[] | null;
    created_at: string;
    user_id: string;
    upvote_count: number;
  };
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  currentUser: { id: string; role: string | null } | null;
  userUpvoted: boolean;
}

export default function ProjectDetailClient({
  project,
  profiles,
  currentUser,
  userUpvoted,
}: ProjectDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Edit form states
  const [editTitle, setEditTitle] = useState(project.title);
  const [editDescription, setEditDescription] = useState(project.description);
  const [editTechs, setEditTechs] = useState<string[]>(project.technologies || []);
  const [techInput, setTechInput] = useState("");
  
  const [editGithubUrl, setEditGithubUrl] = useState(project.github_url || "");
  const [editYoutubeUrl, setEditYoutubeUrl] = useState(project.youtube_url || "");
  const [editBehanceUrl, setEditBehanceUrl] = useState(project.behance_url || "");
  const [editExternalUrl, setEditExternalUrl] = useState(project.external_url || "");
  
  const [editSemester, setEditSemester] = useState(project.semester || "fall");
  const [editYear, setEditYear] = useState<string>(project.year ? String(project.year) : String(new Date().getFullYear()));
  
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(
    (project.media_urls || []).map((url, i) => ({
      id: `existing-${i}`,
      name: decodeURIComponent(url.substring(url.lastIndexOf("/") + 1).split("?")[0]),
      status: "success",
      progress: 100,
      blobUrl: url,
    }))
  );

  const isAuthor = currentUser?.id === project.user_id;
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "moderator";
  const canManage = isAuthor || isAdmin;

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "az önce";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}dk`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}sa`;
    return `${Math.floor(seconds / 86400)}g`;
  };

  // YouTube embed parser
  const getYoutubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };

  const youtubeEmbedUrl = getYoutubeEmbedUrl(project.youtube_url);

  // File styling details helper
  const getFileDetails = (url: string) => {
    try {
      const decodedUrl = decodeURIComponent(url);
      const filename = decodedUrl.substring(decodedUrl.lastIndexOf("/") + 1).split("?")[0];
      const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
      
      const isDocExt = DOCUMENT_EXTENSIONS.includes(ext);
      const isImg = IMAGE_EXTENSIONS.includes(ext) || (!isDocExt && (url.startsWith("http://") || url.startsWith("https://")));
      
      let icon = <FileText className="h-4 w-4 text-indigo-500" />;
      if ([".zip", ".rar"].includes(ext)) {
        icon = <FileArchive className="h-4 w-4 text-amber-500" />;
      } else if (isImg) {
        icon = <ImageIcon className="h-4 w-4 text-emerald-500" />;
      }
      
      return { filename: filename || "Harici Görsel", isImg, icon };
    } catch {
      return { filename: "dosya-eki", isImg: false, icon: <Paperclip className="h-4 w-4" /> };
    }
  };

  const ImageIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
    </svg>
  );

  // Tags Handlers
  const addTech = () => {
    const trimmed = techInput.trim();
    if (trimmed && !editTechs.includes(trimmed)) {
      setEditTechs(prev => [...prev, trimmed]);
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => {
    setEditTechs(prev => prev.filter(t => t !== tech));
  };

  // File Upload Handlers
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALL_ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `Desteklenmeyen dosya formatı. İzin verilenler: ${ALL_ALLOWED_EXTENSIONS.join(", ")}` };
    }
    const isImage = IMAGE_EXTENSIONS.includes(ext);
    const maxSize = isImage ? 10 * 1024 * 1024 : 30 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: isImage ? `Resimler en fazla 10MB olabilir (${file.name})` : `Dosyalar en fazla 30MB olabilir (${file.name})` };
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
          const percent = Math.round((event.loaded / event.total) * 90) + 10;
          setAttachedFiles(prev => 
            prev.map(f => f.id === fileId ? { ...f, progress: percent } : f)
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
    } catch (err: any) {
      console.error(err);
      setAttachedFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, status: "error", errorMessage: err.message || "Yüklenemedi" } : f)
      );
      toast.error(`${file.name} yüklenirken hata oluştu: ${err?.message || ""}`);
    }
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
      if (!valid) {
        toast.error(error);
        return;
      }
      const fileId = Math.random().toString(36).substring(7);
      const newAttach: AttachedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        status: "idle",
        progress: 0,
        blobUrl: ""
      };
      newAttachments.push(newAttach);
    });

    if (newAttachments.length === 0) return;

    setAttachedFiles(prev => [...prev, ...newAttachments]);
    newAttachments.forEach(attach => {
      const actualFile = fileList.find(f => f.name === attach.name);
      if (actualFile) uploadToAzure(actualFile, attach.id);
    });
  };

  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Submit editProject
  const handleSave = async () => {
    const cleanDesc = editDescription.replace(/<[^>]*>/g, "").trim();
    if (!editTitle.trim()) {
      toast.error("Başlık boş olamaz.");
      return;
    }
    if (!cleanDesc) {
      toast.error("Açıklama boş olamaz.");
      return;
    }
    if (editTechs.length === 0) {
      toast.error("En az 1 teknoloji eklemelisiniz.");
      return;
    }

    const isUploading = attachedFiles.some(f => f.status === "uploading");
    if (isUploading) {
      toast.error("Lütfen dosyaların yüklenmesini bekleyin.");
      return;
    }

    setLoading(true);
    const mediaUrls = attachedFiles.filter(f => f.status === "success").map(f => f.blobUrl);

    const result = await editProject(project.id, {
      title: editTitle,
      description: editDescription,
      technologies: editTechs,
      githubUrl: editGithubUrl.trim() || undefined,
      youtubeUrl: editYoutubeUrl.trim() || undefined,
      behanceUrl: editBehanceUrl.trim() || undefined,
      externalUrl: editExternalUrl.trim() || undefined,
      semester: editSemester as "fall" | "spring" | "summer" | undefined,
      year: parseInt(editYear) || undefined,
      mediaUrls,
    });

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Proje başarıyla güncellendi!");
      setIsEditing(false);
      window.location.reload();
    }
  };

  // Delete Project
  const handleDelete = async () => {
    const confirmDelete = window.confirm("Bu projeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.");
    if (!confirmDelete) return;

    setDeleting(true);
    const result = await deleteProject(project.id);
    setDeleting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Proje başarıyla silindi.");
      router.push("/projects");
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-md">
      {isEditing ? (
        // EDIT MODE PROJECT UI
        <div className="space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-bold text-[var(--color-foreground)]">Projeyi Düzenle</h2>
            <button 
              type="button" 
              onClick={() => {
                setIsEditing(false);
                setEditTitle(project.title);
                setEditDescription(project.description);
              }}
              className="text-[var(--color-muted-foreground)] hover:text-red-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-foreground)]">Proje Başlığı *</label>
            <input 
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[var(--color-foreground)] font-semibold"
              placeholder="Projenin Adı"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-foreground)]">Açıklama *</label>
            <RichTextEditor 
              content={editDescription}
              onChange={setEditDescription}
              minHeight="min-h-[220px]"
            />
          </div>

          {/* Teknolojiler (Tag Input) */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-foreground)]">Kullanılan Teknolojiler *</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Örn: React, Node.js"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTech();
                  }
                }}
                className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addTech}
                className="flex items-center justify-center rounded-xl bg-indigo-500 hover:bg-indigo-600 px-4 text-white transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {editTechs.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {editTechs.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-500"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTech(tech)}
                      className="rounded-full p-0.5 hover:bg-indigo-500/20 text-indigo-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Links inputs */}
          <div className="grid gap-4 sm:grid-cols-2 border-t border-[var(--color-border)] pt-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">GitHub Linki</label>
              <input 
                type="url"
                value={editGithubUrl}
                onChange={(e) => setEditGithubUrl(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                placeholder="https://github.com/..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">YouTube Tanıtım Videosu</label>
              <input 
                type="url"
                value={editYoutubeUrl}
                onChange={(e) => setEditYoutubeUrl(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                placeholder="https://youtube.com/..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">Behance Linki</label>
              <input 
                type="url"
                value={editBehanceUrl}
                onChange={(e) => setEditBehanceUrl(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                placeholder="https://behance.net/..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">Canlı Demo Linki (External)</label>
              <input 
                type="url"
                value={editExternalUrl}
                onChange={(e) => setEditExternalUrl(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Dönem / Yıl */}
          <div className="grid gap-4 sm:grid-cols-2 border-t border-[var(--color-border)] pt-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">Akademik Dönem *</label>
              <select
                value={editSemester}
                onChange={(e) => setEditSemester(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="fall">Güz Dönemi</option>
                <option value="spring">Bahar Dönemi</option>
                <option value="summer">Yaz Dönemi</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--color-muted-foreground)] uppercase">Yıl *</label>
              <input 
                type="number"
                value={editYear}
                onChange={(e) => setEditYear(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                placeholder="Örn: 2026"
              />
            </div>
          </div>

          {/* Dosya Yükleyici */}
          <div className="border-t border-[var(--color-border)] pt-4">
            <label className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide block mb-2">
              Fotoğraflar ve Rapor Eklerini Yönet (Maksimum {MAX_FILES} Adet)
            </label>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelection(e.dataTransfer.files);
              }}
              onClick={() => document.getElementById("project-file-edit-input")?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/10 p-5 text-center hover:bg-[var(--color-muted)]/20 hover:border-indigo-500/50 transition-all cursor-pointer group"
            >
              <Upload className="h-6 w-6 text-[var(--color-muted-foreground)] group-hover:text-indigo-500 transition-colors mb-1.5" />
              <p className="text-xs font-semibold text-[var(--color-foreground)]">Sürükleyin veya tıklayarak dosya ekleyin</p>
              <input 
                id="project-file-edit-input"
                type="file" 
                multiple
                className="hidden" 
                onChange={(e) => handleFileSelection(e.target.files)}
                accept={ALL_ALLOWED_EXTENSIONS.join(",")}
              />
            </div>

            {attachedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachedFiles.map((file) => {
                  const { filename } = getFileDetails(file.name);
                  const isImg = IMAGE_EXTENSIONS.includes(file.name.substring(file.name.lastIndexOf(".")).toLowerCase());
                  
                  return (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-2.5 text-xs bg-[var(--color-card)] shadow-sm animate-fade-in"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
                        {isImg ? (
                          file.status === "success" ? (
                            <img 
                              src={file.blobUrl} 
                              alt="Ekli resim" 
                              className="h-8 w-8 rounded object-cover shrink-0 border border-[var(--color-border)]"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-[var(--color-muted)] flex items-center justify-center shrink-0">IMG</div>
                          )
                        ) : (
                          getFileDetails(file.blobUrl).icon
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate text-[var(--color-foreground)]">{filename}</p>
                          <p className="text-[10px] text-[var(--color-muted-foreground)]">
                            {file.status === "uploading" && `Yükleniyor... %${file.progress}`}
                            {file.status === "success" && "Yüklendi"}
                            {file.status === "error" && `Hata: ${file.errorMessage}`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachedFile(file.id)}
                        className="rounded-lg p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-red-500 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              disabled={loading}
              onClick={() => setIsEditing(false)}
              className="rounded-xl px-4 py-2 text-sm font-semibold hover:bg-[var(--color-muted)] transition-colors text-[var(--color-foreground)]"
            >
              İptal
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-all shadow-md"
            >
              <Save className="h-4 w-4" />
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      ) : (
        // VIEW PROJECT CARD
        <div className="flex gap-4">
          {/* Oylama Butonu */}
          <div className="flex flex-col items-center">
            <ProjectUpvoteButton
              projectId={project.id}
              initialCount={project.upvote_count}
              initialUpvoted={userUpvoted}
              isLoggedIn={!!currentUser}
            />
          </div>

          {/* İçerik Alanı */}
          <div className="flex-1 min-w-0">
            {/* Meta Detaylar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                {profiles.id ? (
                  <Link 
                    href={`/u/${profiles.id}`}
                    className="flex items-center gap-2 hover:text-indigo-500 transition-colors font-semibold text-[var(--color-foreground)] group"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white uppercase shadow-sm">
                      {(profiles.first_name || "?").charAt(0)}
                    </div>
                    <span>
                      {profiles.first_name} {profiles.last_name}
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white uppercase shadow-sm">
                      ?
                    </div>
                    <span>Bilinmeyen Kullanıcı</span>
                  </div>
                )}
                <span>•</span>
                <span>
                  {project.semester === "fall" ? "Güz" : project.semester === "spring" ? "Bahar" : "Yaz"} {project.year}
                </span>
                <span>•</span>
                <span 
                  className="flex items-center gap-1 cursor-help"
                  title={new Date(project.created_at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'long', timeStyle: 'short' }) + ' (Türkiye Saati)'}
                >
                  <Clock className="h-3.5 w-3.5" /> {timeAgo(project.created_at)}
                </span>
              </div>

              {/* Action Buttons (Edit / Delete / Report) */}
              <div className="flex items-center gap-1.5 shrink-0">
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-indigo-500 transition-colors"
                      title="Düzenle"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={handleDelete}
                      className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-red-500 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
                {currentUser && !isAuthor && (
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center gap-1 p-1.5 rounded-lg text-xs font-medium text-[var(--color-muted-foreground)] hover:bg-red-500/10 hover:text-red-600 transition-colors"
                    title="Yöneticilere Bildir"
                  >
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    <span className="hidden sm:inline">Yöneticiye Bildir</span>
                  </button>
                )}
              </div>
            </div>

            {/* Başlık */}
            <h1 className="mt-3 text-xl font-bold text-[var(--color-foreground)] sm:text-2xl leading-tight">
              {project.title}
            </h1>

            {/* Teknolojiler */}
            {project.technologies && project.technologies.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {project.technologies.map((tech: string) => (
                  <span
                    key={tech}
                    className="inline-flex items-center rounded bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-500"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}

            {/* Proje Detay Link Butonları */}
            <div className="mt-4 flex flex-wrap gap-3">
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold hover:bg-[var(--color-muted)] text-[var(--color-foreground)] shadow-sm transition-colors"
                >
                  <GitBranch className="h-4 w-4 text-indigo-500" />
                  GitHub Deposu
                </a>
              )}
              {project.youtube_url && (
                <a
                  href={project.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold hover:bg-[var(--color-muted)] text-[var(--color-foreground)] shadow-sm transition-colors"
                >
                  <PlayCircle className="h-4 w-4 text-red-500" />
                  YouTube Videosu
                </a>
              )}
              {project.behance_url && (
                <a
                  href={project.behance_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold hover:bg-[var(--color-muted)] text-[var(--color-foreground)] shadow-sm transition-colors"
                >
                  <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                  </svg>
                  Behance Projesi
                </a>
              )}
              {project.external_url && (
                <a
                  href={project.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold hover:bg-[var(--color-muted)] text-[var(--color-foreground)] shadow-sm transition-colors"
                >
                  <Globe className="h-4 w-4 text-emerald-500" />
                  Canlı Demo
                </a>
              )}
            </div>

            {/* Proje Açıklaması */}
            <div className="mt-6 border-t border-[var(--color-border)]/50 pt-6">
              <h3 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
                Proje Açıklaması
              </h3>
              <div 
                className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-[var(--color-foreground)] break-words space-y-4"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            </div>

            {/* YouTube Videosu Entegrasyonu */}
            {youtubeEmbedUrl && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black shadow-lg aspect-video">
                <iframe
                  src={youtubeEmbedUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            )}

            {/* Proje Raporları ve Görselleri */}
            {project.media_urls && project.media_urls.length > 0 && (
              <div className="mt-8 border-t border-[var(--color-border)]/50 pt-8 space-y-5">
                {/* Görsel Galerisi */}
                {project.media_urls.some(url => getFileDetails(url).isImg) && (
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-3">
                      Proje Görselleri
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {project.media_urls
                        .filter(url => getFileDetails(url).isImg)
                        .map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] aspect-video block shadow-sm"
                          >
                            <img
                              src={url}
                              alt="Proje görseli"
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                              <ExternalLink className="h-6 w-6 text-white" />
                            </div>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {/* Diğer Dosyalar (Dökümanlar/Arşiv) */}
                {project.media_urls.some(url => !getFileDetails(url).isImg) && (
                  <div className="border-t border-[var(--color-border)]/50 pt-4">
                    <h4 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-2.5">
                      Proje Raporları & Ekli Dosyalar
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {project.media_urls
                        .filter(url => !getFileDetails(url).isImg)
                        .map((url, i) => {
                          const { filename, icon } = getFileDetails(url);
                          return (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] p-3 hover:bg-[var(--color-muted)]/30 hover:border-indigo-500/30 transition-all group shadow-sm"
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-muted)] group-hover:bg-indigo-500/10 shrink-0">
                                {icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[var(--color-foreground)] truncate group-hover:text-indigo-500">
                                  {filename}
                                </p>
                                <span className="text-[10px] text-[var(--color-muted-foreground)] flex items-center gap-1 mt-0.5">
                                  <Download className="h-3 w-3" /> İndir
                                </span>
                              </div>
                            </a>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        contentType="project"
        contentId={project.id}
        contentTitle={project.title}
      />
    </div>
  );
}
