import Link from 'next/link';
import { MapPin, Users, Clock, Building } from 'lucide-react';
import { JOB_CATEGORY_LABELS, EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS } from '@/constants/job-categories';
import type { JobListing } from '@/types/database';

interface JobCardProps {
  listing: JobListing & {
    organizations?: { name: string; logo_url: string | null };
    _count?: { applications: number };
  };
}

export default function JobCard({ listing }: JobCardProps) {
  // Staj için yeşil, İş için mavi, Yarı zamanlı için turuncu şerit
  let topStripColor = 'bg-[var(--color-primary)]';
  if (listing.employment_type === 'internship') topStripColor = 'bg-[#10b981]';
  if (listing.employment_type === 'part_time') topStripColor = 'bg-[var(--color-accent)]';

  const orgName = listing.organizations?.name || 'Bilinmeyen Şirket';
  const logoUrl = listing.organizations?.logo_url;
  const logoFallback = orgName.charAt(0).toUpperCase();

  return (
    <Link href={`/jobs/${listing.id}`} className="block w-full">
      <div className="relative flex flex-col bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        {/* Üst Renkli Şerit */}
        <div className={`h-2 w-full ${topStripColor}`} />
        
        <div className="p-5 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="flex gap-4 items-center">
              {/* Logo */}
              <div className="w-12 h-12 rounded-lg bg-[var(--color-muted)] flex items-center justify-center border border-[var(--color-border)] overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt={orgName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-[var(--color-muted-foreground)]">{logoFallback}</span>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-lg text-[var(--color-foreground)] line-clamp-1">{listing.title}</h3>
                <div className="flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] mt-1">
                  <Building className="w-4 h-4" />
                  <span>{orgName}</span>
                </div>
              </div>
            </div>
            
            {/* Kategori Badge */}
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium">
              {JOB_CATEGORY_LABELS[listing.category as keyof typeof JOB_CATEGORY_LABELS] || listing.category}
            </span>
          </div>

          {/* Etiketler (İstihdam Tipi, Çalışma Modu) */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">
              {EMPLOYMENT_TYPE_LABELS[listing.employment_type as keyof typeof EMPLOYMENT_TYPE_LABELS] || listing.employment_type}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
              {WORK_MODE_LABELS[listing.work_mode as keyof typeof WORK_MODE_LABELS] || listing.work_mode}
            </span>
          </div>

          {/* Konum ve Detaylar */}
          <div className="flex items-center justify-between mt-2 pt-4 border-t border-[var(--color-border)] text-sm text-[var(--color-muted-foreground)]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1 max-w-[120px]">{listing.location || 'Konum belirtilmemiş'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{listing._count?.applications || 0} başvuru</span>
              </div>
            </div>
            
            {listing.deadline && (
              <div className="flex items-center gap-1 text-[var(--color-error)]">
                <Clock className="w-4 h-4" />
                <span>Son: {new Date(listing.deadline).toLocaleDateString('tr-TR')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
