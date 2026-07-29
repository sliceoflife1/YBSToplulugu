"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Clock, 
  Pin, 
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
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import UpvoteButton from "./upvote-button";
import RichTextEditor from "./RichTextEditor";
import { editPost, deletePost } from "@/app/community/actions";
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

interface PostDetailClientProps {
  post: {
    id: string;
    title: string;
    content: string;
    media_urls: string[] | null;
    youtube_url: string | null;
    created_at: string;
    author_id: string;
    upvote_count: number;
    subreddit_id: string;
  };
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  subredditSlug: string;
  currentUser: { id: string; role: string | null } | null;
  userUpvoted: boolean;
}

export default function PostDetailClient({
  post,
  profiles,
  subredditSlug,
  currentUser,
  userUpvoted,
}: PostDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Edit form states
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);
  const [editYoutubeUrl, setEditYoutubeUrl] = useState(post.youtube_url || "");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>(
    (post.media_urls || []).map((url, i) => ({
      id: `existing-${i}`,
      name: decodeURIComponent(url.substring(url.lastIndexOf("/") + 1).split("?")[0]),
      status: "success",
      progress: 100,
      blobUrl: url,
    }))
  );

  const isAuthor = currentUser?.id === post.author_id;
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

  const youtubeEmbedUrl = getYoutubeEmbedUrl(post.youtube_url);

  // File styling details helper
  const getFileDetails = (url: string) => {
    try {
      const decodedUrl = decodeURIComponent(url);
      const filename = decodedUrl.substring(decodedUrl.lastIndexOf("/") + 1).split("?")[0];
      const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
      
      const isImg = IMAGE_EXTENSIONS.includes(ext);
      
      let icon = <FileText className="h-4 w-4 text-indigo-500" />;
      if ([".zip", ".rar"].includes(ext)) {
        icon = <FileArchive className="h-4 w-4 text-amber-500" />;
      } else if (isImg) {
        icon = <ImageIcon className="h-4 w-4 text-emerald-500" />;
      }
      
      return { filename, isImg, icon };
    } catch {
      return { filename: "dosya-eki", isImg: false, icon: <Paperclip className="h-4 w-4" /> };
    }
  };

  const ImageIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
    </svg>
  );

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
      const sasRes = await fetch("/api/storage/sas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      const sasData = await sasRes.json();
      if (!sasRes.ok) throw new Error(sasData.error || "SAS token alınamadı");

      const { uploadUrl, blobUrl } = sasData;

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 90) + 10;
          setAttachedFiles(prev => 
            prev.map(f => f.id === fileId ? { ...f, progress: percent } : f)
          );
        }
      };

      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 201 || xhr.status === 200) resolve();
          else reject(new Error(`Yükleme hatası (Status: ${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error("Ağ hatası oluştu"));
      });

      xhr.send(file);
      await uploadPromise;

      setAttachedFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, status: "success", progress: 100, blobUrl } : f)
      );
    } catch (err: any) {
      console.error(err);
      setAttachedFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, status: "error", errorMessage: err.message || "Yüklenemedi" } : f)
      );
      toast.error(`${file.name} yüklenirken hata oluştu`);
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

  // Submit edits
  const handleSave = async () => {
    const cleanText = editContent.replace(/<[^>]*>/g, "").trim();
    if (!editTitle.trim()) {
      toast.error("Başlık boş olamaz.");
      return;
    }
    if (!cleanText) {
      toast.error("İçerik boş olamaz.");
      return;
    }

    const isUploading = attachedFiles.some(f => f.status === "uploading");
    if (isUploading) {
      toast.error("Lütfen dosyaların yüklenmesini bekleyin.");
      return;
    }

    setLoading(true);
    const mediaUrls = attachedFiles.filter(f => f.status === "success").map(f => f.blobUrl);

    const result = await editPost(
      post.id,
      {
        title: editTitle,
        content: editContent,
        mediaUrls,
        youtubeUrl: editYoutubeUrl.trim() || null,
      },
      subredditSlug
    );

    setLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Gönderi başarıyla güncellendi!");
      setIsEditing(false);
      window.location.reload();
    }
  };

  // Delete Post
  const handleDelete = async () => {
    const confirmDelete = window.confirm("Bu gönderiyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.");
    if (!confirmDelete) return;

    setDeleting(true);
    const result = await deletePost(post.id, post.subreddit_id, subredditSlug);
    setDeleting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Gönderi başarıyla silindi.");
      router.push(`/community/${subredditSlug}`);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-md transition-all">
      {isEditing ? (
        // EDIT MODE UI
        <div className="space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-[var(--color-border)]">
            <h2 className="text-lg font-bold text-[var(--color-foreground)]">Gönderiyi Düzenle</h2>
            <button 
              type="button" 
              onClick={() => {
                setIsEditing(false);
                setEditTitle(post.title);
                setEditContent(post.content);
              }}
              className="text-[var(--color-muted-foreground)] hover:text-red-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-foreground)]">Başlık *</label>
            <input 
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-[var(--color-foreground)] font-semibold"
              placeholder="Gönderi Başlığı"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-foreground)]">İçerik *</label>
            <RichTextEditor 
              content={editContent}
              onChange={setEditContent}
              minHeight="min-h-[200px]"
            />
          </div>

          {/* YouTube Video URL */}
          <div className="border-t border-[var(--color-border)] pt-4">
            <label className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide block mb-2">
              YouTube Videosu Güncelle
            </label>
            <input 
              type="url" 
              placeholder="https://www.youtube.com/watch?v=..."
              value={editYoutubeUrl}
              onChange={(e) => setEditYoutubeUrl(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-2.5 px-3 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Dosya Yükleyici */}
          <div className="border-t border-[var(--color-border)] pt-4">
            <label className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide block mb-2">
              Dosya & Fotoğrafları Yönet (Maksimum {MAX_FILES} Adet)
            </label>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelection(e.dataTransfer.files);
              }}
              onClick={() => document.getElementById("file-edit-input")?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/10 p-5 text-center hover:bg-[var(--color-muted)]/20 hover:border-indigo-500/50 transition-all cursor-pointer group"
            >
              <Upload className="h-6 w-6 text-[var(--color-muted-foreground)] group-hover:text-indigo-500 transition-colors mb-1.5" />
              <p className="text-xs font-semibold text-[var(--color-foreground)]">Sürükleyin veya tıklayarak dosya ekleyin</p>
              <input 
                id="file-edit-input"
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
        // REGULAR POST CARD VIEW
        <div className="flex gap-4">
          {/* Upvote Button */}
          <div className="flex flex-col items-center">
            <UpvoteButton
              postId={post.id}
              initialCount={post.upvote_count}
              initialUpvoted={userUpvoted}
              isLoggedIn={!!currentUser}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Meta details */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                {/* User info */}
                <Link 
                  href={`/u/${profiles.id}`}
                  className="flex items-center gap-2 hover:text-indigo-500 transition-colors font-semibold text-[var(--color-foreground)] group"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[9px] font-bold text-[var(--color-primary)]">
                    {profiles.avatar_url ? (
                      <img
                        src={profiles.avatar_url}
                        alt={`${profiles.first_name}`}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      `${profiles.first_name.charAt(0).toUpperCase()}${profiles.last_name.charAt(0).toUpperCase()}`
                    )}
                  </div>
                  <span>
                    {profiles.first_name} {profiles.last_name}
                  </span>
                </Link>
                <span>•</span>
                <span 
                  className="flex items-center gap-1 cursor-help"
                  title={new Date(post.created_at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', dateStyle: 'long', timeStyle: 'short' }) + ' (Türkiye Saati)'}
                >
                  <Clock className="h-3.5 w-3.5" /> {timeAgo(post.created_at)}
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

            {/* Title */}
            <h1 className="mt-3 text-xl font-bold text-[var(--color-foreground)] sm:text-2xl">
              {post.title}
            </h1>

            {/* Body Content */}
            <div className="mt-4 border-t border-[var(--color-border)]/50 pt-4">
              {post.content ? (
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-[var(--color-foreground)] break-words space-y-4"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              ) : null}
            </div>

            {/* Embedded YouTube Video */}
            {youtubeEmbedUrl && (
              <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black shadow-lg aspect-video">
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

            {/* Attached Files & Images */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mt-6 border-t border-[var(--color-border)]/50 pt-6 space-y-4">
                {/* Images Gallery */}
                {post.media_urls.some(url => getFileDetails(url).isImg) && (
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-2.5">
                      Eklenen Görseller
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {post.media_urls
                        .filter(url => getFileDetails(url).isImg)
                        .map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] aspect-video block"
                          >
                            <img
                              src={url}
                              alt="Yüklenen görsel"
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

                {/* Document Downloads List */}
                {post.media_urls.some(url => !getFileDetails(url).isImg) && (
                  <div className="border-t border-[var(--color-border)]/50 pt-4">
                    <h4 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wide mb-2">
                      Dosya Ekleri
                    </h4>
                    <div className="space-y-2">
                      {post.media_urls
                        .filter(url => !getFileDetails(url).isImg)
                        .map((url, i) => {
                          const { filename, icon } = getFileDetails(url);
                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3 text-xs bg-[var(--color-card)]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {icon}
                                <span className="font-medium text-[var(--color-foreground)] truncate max-w-[200px] sm:max-w-[400px]">
                                  {filename}
                                </span>
                              </div>
                              <a
                                href={url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-indigo-500 hover:underline shrink-0 pl-2"
                              >
                                <Download className="h-3.5 w-3.5" /> İndir
                              </a>
                            </div>
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
        contentType="post"
        contentId={post.id}
        contentTitle={post.title}
      />
    </div>
  );
}
