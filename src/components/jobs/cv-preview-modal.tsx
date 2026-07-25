'use client';

import { X, AlertTriangle, Info, MapPin, Mail, Phone, Link2, GraduationCap, Briefcase, Award } from 'lucide-react';
import type { CvData, Profile } from '@/types/database';

interface CvPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cvData: CvData | null;
  profile: Profile | null;
  isLoading: boolean;
}

export default function CvPreviewModal({ isOpen, onClose, onConfirm, cvData, profile, isLoading }: CvPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative bg-[var(--color-background)] rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] border border-[var(--color-border)] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-semibold text-[var(--color-foreground)]">CV Önizleme</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--color-muted)] rounded-full transition-colors">
            <X className="w-5 h-5 text-[var(--color-muted-foreground)]" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-[#fef3c7] text-[#92400e] p-4 flex gap-3 items-start shrink-0 border-b border-[var(--color-border)]">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">
            CV içeriğiniz iş veren tarafından görüntülenecektir. Lütfen CV içeriğinizi kontrol edin.
          </p>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          
          {/* Personal Info */}
          <div className="flex flex-col gap-3 pb-6 border-b border-[var(--color-border)]">
            <h3 className="text-2xl font-bold text-[var(--color-foreground)]">
              {profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'İsim Belirtilmemiş'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[var(--color-muted-foreground)]">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4"/> {profile?.edu_email || 'E-posta belirtilmemiş'}</div>
              {profile?.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4"/> {profile.phone}</div>}
              {profile?.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4"/> {profile.location}</div>}
              {profile?.linkedin_url && <div className="flex items-center gap-2"><Link2 className="w-4 h-4"/> {profile.linkedin_url}</div>}
            </div>
          </div>

          {/* Education */}
          {cvData?.education && cvData.education.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-[var(--color-foreground)]">
                <GraduationCap className="w-5 h-5 text-[var(--color-primary)]" /> Eğitim
              </div>
              <div className="flex flex-col gap-4 pl-7">
                {cvData.education.map((edu, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="font-medium text-[var(--color-foreground)]">{edu.school}</span>
                    <span className="text-sm text-[var(--color-muted-foreground)]">{edu.degree} - {edu.field}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">{edu.startDate} - {edu.current ? 'Devam Ediyor' : (edu.endDate || 'Tamamlandı')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {cvData?.experience && cvData.experience.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-[var(--color-foreground)]">
                <Briefcase className="w-5 h-5 text-[var(--color-primary)]" /> Deneyim
              </div>
              <div className="flex flex-col gap-4 pl-7">
                {cvData.experience.map((exp, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="font-medium text-[var(--color-foreground)]">{exp.title || exp.position} at {exp.company}</span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">{exp.startDate} - {exp.current ? 'Devam Ediyor' : (exp.endDate || 'Tamamlandı')}</span>
                    {exp.description && <p className="text-sm mt-1 text-[var(--color-foreground)]">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills & Languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cvData?.skills && cvData.skills.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="font-semibold text-[var(--color-foreground)]">Yetenekler</div>
                <div className="flex flex-wrap gap-2">
                  {cvData.skills.map((skill, idx) => (
                    <span key={idx} className="bg-[var(--color-muted)] text-[var(--color-foreground)] px-2 py-1 rounded-md text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {cvData?.languages && cvData.languages.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="font-semibold text-[var(--color-foreground)]">Diller</div>
                <div className="flex flex-col gap-1">
                  {cvData.languages.map((lang, idx) => (
                  <div key={idx} className="text-sm text-[var(--color-muted-foreground)]">
                    <strong className="text-[var(--color-foreground)]">{lang.language}</strong> - {lang.level}
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>

          {/* Certifications */}
          {cvData?.certifications && cvData.certifications.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-[var(--color-foreground)]">
                <Award className="w-5 h-5 text-[var(--color-primary)]" /> Sertifikalar
              </div>
              <ul className="list-disc pl-11 text-sm text-[var(--color-muted-foreground)] flex flex-col gap-1">
                {cvData.certifications.map((cert, idx) => (
                  <li key={idx}>
                    <span className="text-[var(--color-foreground)] font-medium">{cert.name}</span> 
                    {cert.issuer && ` - ${cert.issuer}`} 
                    {cert.date && ` (${cert.date})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
        </div>

        {/* Info Banner */}
        <div className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] p-4 flex gap-3 items-start shrink-0 border-t border-[var(--color-border)]">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            CV'nizdeki iletişim bilgileri (e-posta, telefon, LinkedIn) üzerinden işverenler sizinle iletişime geçebilecektir. CV'nizin eksiksiz ve doğru olması başvurunuzun sorunsuz tamamlanmasına önemli katkı sağlayacaktır.
          </p>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[var(--color-border)] flex justify-between items-center bg-[var(--color-muted)]/30 shrink-0 rounded-b-xl">
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-[var(--color-muted-foreground)] bg-transparent hover:bg-[var(--color-muted)] rounded-lg transition-colors"
          >
            İptal
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:opacity-90 rounded-lg transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Kabul Et ve Başvur
          </button>
        </div>

      </div>
    </div>
  );
}
