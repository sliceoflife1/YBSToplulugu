// Job listing category labels and constants

export type JobCategory =
  | 'software_it'
  | 'engineering'
  | 'data_science'
  | 'marketing'
  | 'finance_accounting'
  | 'human_resources'
  | 'sales'
  | 'design'
  | 'operations_logistics'
  | 'education_training'
  | 'healthcare'
  | 'legal'
  | 'media_communications'
  | 'consulting'
  | 'customer_service'
  | 'research_development'
  | 'management'
  | 'manufacturing'
  | 'architecture_construction'
  | 'other';

export type EmploymentType = 'full_time' | 'part_time' | 'internship';
export type WorkMode = 'onsite' | 'remote' | 'hybrid';
export type ApplicationStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected';
export type NotificationType = 'job_application' | 'interview_request' | 'application_success' | 'system';

export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
  software_it: 'Yazılım & Bilgi Teknolojileri',
  engineering: 'Mühendislik',
  data_science: 'Veri Bilimi & Yapay Zeka',
  marketing: 'Pazarlama & Dijital Pazarlama',
  finance_accounting: 'Finans & Muhasebe',
  human_resources: 'İnsan Kaynakları',
  sales: 'Satış & İş Geliştirme',
  design: 'Tasarım & Yaratıcı',
  operations_logistics: 'Operasyon & Lojistik',
  education_training: 'Eğitim & Akademi',
  healthcare: 'Sağlık & İlaç',
  legal: 'Hukuk',
  media_communications: 'Medya & İletişim',
  consulting: 'Danışmanlık',
  customer_service: 'Müşteri Hizmetleri',
  research_development: 'Araştırma & Geliştirme (AR-GE)',
  management: 'Yönetim & Strateji',
  manufacturing: 'Üretim & İmalat',
  architecture_construction: 'Mimarlık & İnşaat',
  other: 'Diğer',
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'Tam Zamanlı',
  part_time: 'Yarı Zamanlı',
  internship: 'Staj',
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  onsite: 'Ofis',
  remote: 'Uzaktan',
  hybrid: 'Hibrit',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Beklemede',
  reviewed: 'İncelendi',
  accepted: 'Kabul Edildi',
  rejected: 'Reddedildi',
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  job_application: 'Yeni Başvuru',
  interview_request: 'Görüşme Talebi',
  application_success: 'Başvuru Onayı',
  system: 'Sistem Bildirimi',
};

export const JOB_CATEGORIES = Object.keys(JOB_CATEGORY_LABELS) as JobCategory[];
export const EMPLOYMENT_TYPES = Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[];
export const WORK_MODES = Object.keys(WORK_MODE_LABELS) as WorkMode[];
