'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import CvPreviewModal from './cv-preview-modal';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import type { CvData, Profile } from '@/types/database';

interface ApplyButtonProps {
  listingId: string;
  deadline: string | null;
  isActive: boolean;
}

/**
 * Temel CV alanlarını kontrol eder ve eksik olanları döndürür.
 * Başvuru yapabilmek için en az eğitim ve yetenek bilgisi gereklidir.
 */
function getMissingCvFields(cv: CvData): string[] {
  const missing: string[] = [];

  if (!cv.education || cv.education.length === 0) {
    missing.push('Eğitim bilgisi');
  }

  if (!cv.skills || cv.skills.length === 0) {
    missing.push('Yetenek/beceri bilgisi');
  }

  return missing;
}

export default function ApplyButton({ listingId, deadline, isActive }: ApplyButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [status, setStatus] = useState<'guest' | 'employer' | 'applied' | 'no-cv' | 'incomplete-cv' | 'can-apply'>('guest');
  const [cvData, setCvData] = useState<CvData | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    async function checkStatus() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setStatus('guest');
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileData?.role === 'employer') {
          setStatus('employer');
          return;
        }

        if (profileData) {
          setProfile(profileData as Profile);
        }

        const { data: application } = await supabase
          .from('job_applications')
          .select('id')
          .eq('job_listing_id', listingId)
          .eq('applicant_id', session.user.id)
          .single();

        if (application) {
          setStatus('applied');
          return;
        }

        const { data: cv } = await supabase
          .from('cv_data')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (!cv) {
          setStatus('no-cv');
        } else {
          const typedCv = cv as unknown as CvData;
          setCvData(typedCv);

          const missing = getMissingCvFields(typedCv);
          if (missing.length > 0) {
            setMissingFields(missing);
            setStatus('incomplete-cv');
          } else {
            setStatus('can-apply');
          }
        }
      } catch (error) {
        console.error('Error checking application status:', error);
      } finally {
        setLoading(false);
      }
    }
    
    checkStatus();
  }, [listingId, supabase]);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const res = await fetch(`/api/jobs/${listingId}/apply`, {
        method: 'POST',
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Başvuru sırasında bir hata oluştu');
      }
      
      toast.success('Başvurunuz başarıyla tamamlandı! CV içeriğinizde yer alan iletişim bilgilerinden işverenler sizinle iletişime geçebilecektir.');
      setStatus('applied');
      setIsModalOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Başvuru başarısız oldu');
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return <div className="h-10 w-full rounded-lg bg-[var(--color-muted)] animate-pulse"></div>;
  }

  if (status === 'employer') return null;

  if (!isActive) {
    return (
      <button disabled className="w-full py-2.5 rounded-lg bg-[var(--color-muted)] text-[var(--color-muted-foreground)] font-medium cursor-not-allowed">
        Bu ilan aktif değil
      </button>
    );
  }

  const isExpired = deadline ? new Date(deadline).getTime() < new Date().getTime() : false;
  if (isExpired) {
    return (
      <button disabled className="w-full py-2.5 rounded-lg bg-[var(--color-muted)] text-[var(--color-muted-foreground)] font-medium cursor-not-allowed">
        Başvuru süresi doldu
      </button>
    );
  }

  if (status === 'guest') {
    return (
      <Link href="/login" className="block w-full text-center py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary)]/90 transition-colors shadow-sm">
        Başvurmak için giriş yapın
      </Link>
    );
  }

  if (status === 'applied') {
    return (
      <button disabled className="w-full py-2.5 rounded-lg bg-[#10b981]/10 text-[#10b981] font-medium flex items-center justify-center gap-2 cursor-not-allowed border border-[#10b981]/20">
        <CheckCircle className="w-5 h-5" /> Zaten Başvurdunuz ✓
      </button>
    );
  }

  if (status === 'no-cv') {
    return (
      <div className="space-y-2">
        <Link href="/cv" className="block w-full text-center py-2.5 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent)]/90 transition-colors shadow-sm">
          Önce CV Bilgilerinizi Doldurun
        </Link>
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 dark:border-amber-700 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Başvuru yapabilmek için CV sayfasından en az <strong>eğitim</strong> ve <strong>yetenek</strong> bilgilerinizi doldurmanız gerekmektedir.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'incomplete-cv') {
    return (
      <div className="space-y-2">
        <Link href="/cv" className="block w-full text-center py-2.5 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent)]/90 transition-colors shadow-sm">
          CV Bilgilerinizi Tamamlayın
        </Link>
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 dark:border-amber-700 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-xs text-amber-700 dark:text-amber-400">
            <p className="mb-1">Başvuru yapabilmek için aşağıdaki bilgileri tamamlamanız gerekmektedir:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="w-full py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-medium hover:bg-[var(--color-primary)]/90 transition-colors shadow-sm"
      >
        Başvur
      </button>

      <CvPreviewModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleApply}
        cvData={cvData}
        profile={profile}
        isLoading={isApplying}
      />
    </>
  );
}
