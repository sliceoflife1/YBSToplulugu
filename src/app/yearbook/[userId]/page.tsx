"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Send, Check, Trash2, ShieldAlert, MessageSquare, GraduationCap, Calendar, Clock } from "lucide-react";
import Navbar from "@/components/layout/navbar";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

interface Props {
  params: Promise<{
    userId: string;
  }>;
}

export default function YearbookDetailPage({ params }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const isEn = locale === "en";
  
  // React.use() wrapper to unwrap Promise params
  const { userId } = use(params);

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Veri State'leri
  const [yearbookProfile, setYearbookProfile] = useState<any>(null);
  const [approvedEntries, setApprovedEntries] = useState<any[]>([]);
  const [pendingEntries, setPendingEntries] = useState<any[]>([]);

  // Form State'leri
  const [newEntryContent, setNewEntryContent] = useState("");
  const [submittingEntry, setSubmittingEntry] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function loadDetail() {
      // 1. Giriş kontrolü (Auth)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);

      // 2. Andıç profilini ve detaylarını çek
      const { data: ybProfile } = await supabase
        .from("yearbook_profiles")
        .select(`
          *,
          profiles:user_id (id, first_name, last_name, avatar_url, headline, bio, student_no),
          yearbook_departments:department_id (id, name, yearbook_faculties(id, name))
        `)
        .eq("user_id", userId)
        .single();

      if (!ybProfile) {
        toast.error("Bu öğrenciye ait andıç profili bulunamadı.");
        router.push("/yearbook");
        return;
      }

      // Gizlilik kontrolü: Profil sahibi değilse ve is_visible false ise görmesin
      if (!ybProfile.is_visible && ybProfile.user_id !== user.id) {
        toast.error("Bu andıç profili gizlidir.");
        router.push("/yearbook");
        return;
      }

      setYearbookProfile(ybProfile);

      // 3. Andıç yazılarını (arkadaş yorumlarını) çek
      const { data: entries } = await supabase
        .from("yearbook_entries")
        .select(`
          *,
          sender:sender_id (id, first_name, last_name, avatar_url, headline)
        `)
        .eq("recipient_id", userId)
        .order("created_at", { ascending: true });

      if (entries) {
        const approved = entries.filter((e) => e.is_approved);
        const pending = entries.filter((e) => !e.is_approved);
        setApprovedEntries(approved);
        setPendingEntries(pending);
      }

      setLoading(false);
    }
    loadDetail();
  }, [userId, router]);

  // Yeni Andıç Yazısı Gönder
  const handleSendEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryContent.trim() || !currentUser) return;
    setSubmittingEntry(true);

    try {
      const res = await fetch("/api/yearbook/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: userId,
          content: newEntryContent.trim()
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Yazı gönderilirken hata oluştu");

      toast.success(isEn ? "Your entry was sent and is awaiting approval!" : "Andıç yazınız başarıyla gönderildi ve onay bekliyor!");
      setNewEntryContent("");
      
      // Eğer kendi kendimize yazmadıysak (zaten API yasaklıyor)
      // Onay bekleyen listeye anlık yerel ekleme yapabiliriz
      const newPendingObj = {
        ...resData.data,
        sender: {
          id: currentUser.id,
          first_name: currentUser.user_metadata?.first_name || "Siz",
          last_name: currentUser.user_metadata?.last_name || "",
          avatar_url: currentUser.user_metadata?.avatar_url || null
        }
      };
      setPendingEntries((prev) => [...prev, newPendingObj]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingEntry(false);
    }
  };

  // Arkadaş Yazısını Onayla (Recipient)
  const handleApproveEntry = async (entryId: string) => {
    try {
      const res = await fetch("/api/yearbook/entries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId,
          isApproved: true
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Onaylama işlemi başarısız");

      toast.success(isEn ? "Entry approved!" : "Yazı onaylandı ve profilinizde yayınlandı!");
      
      // Listeleri Güncelle
      const approvedItem = pendingEntries.find((e) => e.id === entryId);
      if (approvedItem) {
        setApprovedEntries((prev) => [...prev, { ...approvedItem, is_approved: true }]);
        setPendingEntries((prev) => prev.filter((e) => e.id !== entryId));
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Arkadaş Yazısını Sil/Reddet (Recipient veya Sender)
  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm(isEn ? "Are you sure you want to delete this entry?" : "Bu andıç yazısını silmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      const res = await fetch(`/api/yearbook/entries?entryId=${entryId}`, {
        method: "DELETE"
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Silme işlemi başarısız");

      toast.success(isEn ? "Entry deleted!" : "Yazı silindi!");
      
      // Listelerden kaldır
      setApprovedEntries((prev) => prev.filter((e) => e.id !== entryId));
      setPendingEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.id === yearbookProfile?.user_id;
  const fullName = `${yearbookProfile?.profiles?.first_name} ${yearbookProfile?.profiles?.last_name}`;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        <Link href="/yearbook" className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
          <ArrowLeft className="h-4 w-4" /> {isEn ? "Back to Yearbook" : "Andıç Listesine Dön"}
        </Link>

        {/* Profil Detay Kartı (Glassmorphism & High Aesthetic) */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]/50 p-6 md:p-8 shadow-xl backdrop-blur-md">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
            {/* Profil Resmi */}
            {yearbookProfile?.profiles?.avatar_url ? (
              <img
                src={yearbookProfile.profiles.avatar_url}
                alt={fullName}
                className="h-32 w-32 rounded-full object-cover border-4 border-indigo-500/20 shadow-md shrink-0"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-5xl font-extrabold text-white shadow-md shrink-0">
                {yearbookProfile?.profiles?.first_name?.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <h1 className="text-3xl font-extrabold">{fullName}</h1>
                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  {yearbookProfile?.graduation_year} Mezunu
                </span>
                {!yearbookProfile.is_visible && (
                  <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-600 border border-yellow-500/20 flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Gizli Profil
                  </span>
                )}
              </div>

              <p className="mt-2 text-md font-semibold text-[var(--color-muted-foreground)]">
                {yearbookProfile?.profiles?.headline || "Öğrenci"}
              </p>

              {/* Detay Bilgileri */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm justify-center md:justify-start">
                <div className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
                  <GraduationCap className="h-4 w-4 text-indigo-500" />
                  <span>{yearbookProfile?.yearbook_departments?.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
                  <Calendar className="h-4 w-4 text-indigo-500" />
                  <span>{yearbookProfile?.education_type === "primary" ? "Birinci Öğretim" : "İkinci Öğretim"}</span>
                </div>
                {yearbookProfile?.profiles?.student_no && (
                  <div className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    <span>Öğrenci No: {yearbookProfile.profiles.student_no}</span>
                  </div>
                )}
              </div>

              {/* Mezuniyet Mesajı */}
              {yearbookProfile?.message && (
                <div className="mt-6 border-t border-[var(--color-border)]/50 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500">{isEn ? "Graduation Message" : "Mezuniyet Sözü"}</h3>
                  <p className="mt-1.5 text-sm italic text-[var(--color-foreground)] leading-relaxed">
                    &ldquo;{yearbookProfile.message}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------
            ONAY BEKLEYEN YAZILAR (SADECE PROFİL SAHİBİ GÖRÜR)
            ----------------------------------------------------------- */}
        {isOwner && pendingEntries.length > 0 && (
          <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6 shadow-md">
            <h2 className="text-lg font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-2 mb-4">
              <ShieldAlert className="h-5 w-5" />
              {isEn ? "Pending Entries (Approval Panel)" : "Onay Bekleyen Arkadaş Yazıları"}
            </h2>
            <div className="space-y-4">
              {pendingEntries.map((e) => (
                <div key={e.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {e.sender?.avatar_url ? (
                        <img src={e.sender.avatar_url} alt="Sender" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white">
                          {e.sender?.first_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold">{e.sender?.first_name} {e.sender?.last_name}</h4>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{e.sender?.headline || "Öğrenci"}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveEntry(e.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-colors"
                        title={isEn ? "Approve" : "Onayla"}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(e.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                        title={isEn ? "Reject" : "Reddet ve Sil"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-[var(--color-foreground)] bg-[var(--color-muted)]/10 rounded-xl p-3 border border-[var(--color-border)]/30">
                    {e.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------
            ONAYLANMIŞ ANDIÇ YAZILARI
            ----------------------------------------------------------- */}
        <div className="mb-8">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
            <MessageSquare className="h-5 w-5 text-indigo-500" />
            {isEn ? "Yearbook Entries" : "Arkadaşlarının Kaleminden"}
          </h2>

          {approvedEntries.length > 0 ? (
            <div className="grid gap-6">
              {approvedEntries.map((e) => (
                <div key={e.id} className="group relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {e.sender?.avatar_url ? (
                        <img src={e.sender.avatar_url} alt="Sender" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-bold text-white">
                          {e.sender?.first_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold">{e.sender?.first_name} {e.sender?.last_name}</h3>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{e.sender?.headline || "Öğrenci"}</p>
                      </div>
                    </div>

                    {/* Gönderen veya alıcı kendi sayfalarında yazıyı silebilir */}
                    {(currentUser?.id === e.sender_id || currentUser?.id === e.recipient_id) && (
                      <button
                        onClick={() => handleDeleteEntry(e.id)}
                        className="opacity-0 group-hover:opacity-100 flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted-foreground)] hover:bg-red-500/10 hover:text-red-500 transition-all"
                        title={isEn ? "Delete" : "Sil"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-[var(--color-foreground)] border-l-2 border-indigo-500 pl-4 py-0.5">
                    {e.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-card)]/30">
              <MessageSquare className="h-10 w-10 text-[var(--color-muted-foreground)] mb-3" />
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {isEn ? "No yearbook entries written yet." : "Henüz andıç yazısı yazılmamış."}
              </p>
            </div>
          )}
        </div>

        {/* -----------------------------------------------------------
            YAZI YAZMA FORMU (BAŞKASININ SAYFASIYSA GÖSTERİLİR)
            ----------------------------------------------------------- */}
        {!isOwner && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-md">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Send className="h-4.5 w-4.5 text-indigo-500" />
              {isEn ? "Write a Yearbook Entry" : `${fullName} İçin Andıç Yazısı Yaz`}
            </h2>
            <p className="text-xs text-[var(--color-muted-foreground)] mb-4">
              {isEn 
                ? "Your message will be sent for review and will only appear once approved by the student."
                : "Yazacağınız yazı onay paneline düşecektir ve sadece öğrenci onayladığında profilinde yayınlanacaktır."}
            </p>

            <form onSubmit={handleSendEntry} className="space-y-4">
              <textarea
                value={newEntryContent}
                onChange={(e) => setNewEntryContent(e.target.value)}
                required
                maxLength={1000}
                rows={4}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder={isEn ? "Write down memories, quotes or jokes..." : "Birlikte geçirdiğiniz anıları, mezuniyet dileklerinizi yazın..."}
              />
              <button
                type="submit"
                disabled={submittingEntry || !newEntryContent.trim()}
                className="flex items-center justify-center gap-2 rounded-xl gradient-primary px-6 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-50"
              >
                {submittingEntry ? t("common.loading") : (isEn ? "Send for Approval" : "Onaya Gönder")}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
