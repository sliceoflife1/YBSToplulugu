import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// URL whitelist for embed safety
const ALLOWED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'linkedin.com',
  'github.com',
  'behance.net',
  'dribbble.com',
];

export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    let videoId: string | null = null;

    if (parsed.hostname.includes('youtube.com')) {
      videoId = parsed.searchParams.get('v');
    } else if (parsed.hostname === 'youtu.be') {
      videoId = parsed.pathname.slice(1);
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
    // Invalid URL
  }
  return null;
}

export function formatDate(date: string | Date, locale: string = 'tr'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const CLASS_YEAR_OPTIONS = [
  { value: 1, labelTr: "1. Sınıf", labelEn: "1st Year" },
  { value: 2, labelTr: "2. Sınıf", labelEn: "2nd Year" },
  { value: 3, labelTr: "3. Sınıf", labelEn: "3rd Year" },
  { value: 4, labelTr: "4. Sınıf", labelEn: "4th Year" },
  { value: 5, labelTr: "Yüksek Lisans", labelEn: "Master's" },
  { value: 6, labelTr: "Doktora", labelEn: "PhD" },
];

export function formatClassYear(
  classYear: number | string | null | undefined,
  isEn: boolean = false
): string {
  if (!classYear) return "";
  const num = typeof classYear === "string" ? parseInt(classYear, 10) : classYear;
  const option = CLASS_YEAR_OPTIONS.find((o) => o.value === num);
  if (option) {
    return isEn ? option.labelEn : option.labelTr;
  }
  return `${num}. Sınıf`;
}

