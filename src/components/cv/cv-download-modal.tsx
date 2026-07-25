'use client';

import { useState } from 'react';
import { Download, FileText, X, Check, Building2, Sparkles, GraduationCap, Layout } from 'lucide-react';
import { toast } from 'sonner';

interface CvDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userDefaultTemplate?: string;
  userDefaultColor?: string;
}

export default function CvDownloadModal({
  isOpen,
  onClose,
  userId,
  userName,
  userDefaultTemplate = 'standard',
  userDefaultColor = '#0ea5e9',
}: CvDownloadModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(userDefaultTemplate);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setLoading(true);
    try {
      const url = `/api/cv/pdf?userId=${userId}&template=${selectedTemplate}&color=${encodeURIComponent(userDefaultColor)}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error('CV PDF dosyası indirilemedi.');
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `CV_${userName.replace(/\s+/g, '_')}_${selectedTemplate.toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      toast.success(`${selectedTemplate.toUpperCase()} formatında CV başarıyla indirildi.`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'CV indirilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    {
      id: 'standard',
      name: 'Öğrencinin Tercihi (Varsayılan)',
      desc: 'Kullanıcının kendi belirlediği CV şablonu ve renk paleti.',
      icon: Layout,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      id: 'corporate',
      name: 'Kurumsal CV Şablonu',
      desc: 'Büyük şirketler, kamu ve finans sektörü başvuruları için klasik çizgili düzen.',
      icon: Building2,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50',
    },
    {
      id: 'modern',
      name: 'Modern / Yaratıcı Şablon',
      desc: 'UI/UX, yazılım ve dijital pazarlama rolleri için kart yapılı 2 kolonlu tasarım.',
      icon: Sparkles,
      color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/50',
    },
    {
      id: 'academic',
      name: 'Akademik / ATS Şablonu',
      desc: 'Akademik başvurular ve otomatik robotlar (ATS) için sade, siyah-beyaz düzen.',
      icon: GraduationCap,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-2xl space-y-5 text-[var(--color-foreground)]">
        {/* Üst Kısım */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">CV İndirme Formatı Seçin</h3>
              <p className="text-xs text-[var(--color-muted-foreground)]">{userName} kullanıcısının özgeçmişi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Şablon Seçenekleri */}
        <div className="space-y-2.5">
          {templates.map((tpl) => {
            const Icon = tpl.icon;
            const isSelected = selectedTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplate(tpl.id)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? 'border-2 border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]/30'
                    : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-slate-400'
                }`}
              >
                <div className={`p-2 rounded-lg ${tpl.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-foreground)]">{tpl.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-[var(--color-primary)]" />}
                  </div>
                  <p className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5 leading-snug">{tpl.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Alt Butonlar */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-xs font-semibold text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            İptal
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDownload}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>İndiriliyor...</span>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>PDF İndir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
