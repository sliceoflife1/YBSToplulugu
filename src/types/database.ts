// Database types matching the Supabase schema

export type UserRole = 'student' | 'alumni' | 'faculty' | 'employer' | 'admin' | 'moderator';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type OrgType = 'employer' | 'foundation' | 'association' | 'other';
export type Semester = 'fall' | 'spring' | 'summer';
export type LanguageLevel = 'beginner' | 'intermediate' | 'advanced' | 'native';
export type ConsentType = 'terms_of_service' | 'data_processing' | 'marketing';

export interface Profile {
  id: string;
  student_no: string | null;
  first_name: string;
  last_name: string;
  edu_email: string;
  personal_email: string | null;
  phone: string | null;
  department: string | null;
  class_year: number | null;
  linkedin_url: string | null;
  github_url: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  is_cv_public: boolean;
  meeting_url: string | null;
  is_mentor: boolean;
  mentor_topics: string[];
  karma_points: number;
  headline: string | null;
  location: string | null;
  website_url: string | null;
  is_open_to_work: boolean;
  admin_gmail?: string | null;
  is_2fa_enabled?: boolean;
  totp_secret?: string | null;
  backup_codes?: string[];
  totp_verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  technologies: string[];
  github_url: string | null;
  youtube_url: string | null;
  behance_url: string | null;
  external_url: string | null;
  semester: Semester | null;
  year: number | null;
  project_type?: string | null;
  team_members?: string[] | null;
  license?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  profiles?: Profile;
}

export interface CvData {
  id: string;
  user_id: string;
  education: CvEducation[];
  experience: CvExperience[];
  skills: string[];
  certifications: CvCertification[];
  languages: CvLanguage[];
  projects: CvProject[];
  references: CvReference[];
  custom_sections: CvCustomSection[];
  template_name?: string;
  primary_color?: string;
  created_at: string;
  updated_at: string;
}

export interface CvEducation {
  school: string;
  degree: string;
  field: string;
  location?: string;
  gpa?: string;
  description?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  /** @deprecated eski veri şeması ile uyumluluk için tutulur */
  department?: string;
  /** @deprecated eski veri şeması ile uyumluluk için tutulur */
  startYear?: string;
  /** @deprecated eski veri şeması ile uyumluluk için tutulur */
  endYear?: string;
}

export interface CvExperience {
  company: string;
  title: string;
  location?: string;
  description?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  /** @deprecated eski veri şeması ile uyumluluk için tutulur */
  position?: string;
  /** @deprecated eski veri şeması ile uyumluluk için tutulur */
  duration?: string;
}

export interface CvCertification {
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

export interface CvLanguage {
  language: string;
  level: LanguageLevel;
}

export interface CvProject {
  title: string;
  description?: string;
  technologies?: string[];
  url?: string;
  date?: string;
}

export interface CvReference {
  name: string;
  position?: string;
  company?: string;
  email?: string;
  phone?: string;
}

export interface CvCustomSection {
  title: string;
  items: string[];
}

export interface Subreddit {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  created_by: string;
  is_active: boolean;
  post_count: number;
  created_at: string;
  // Joined fields
  profiles?: Profile;
}

export interface Post {
  id: string;
  subreddit_id: string;
  author_id: string;
  title: string;
  content: string | null;
  upvote_count: number;
  comment_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  profiles?: Profile;
  subreddits?: Subreddit;
  user_has_upvoted?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  profiles?: Profile;
  replies?: Comment[];
}

export interface Upvote {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  description: string | null;
  website_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  owner_id: string | null;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  is_active: boolean;
  created_at: string;
}

export interface KvkkConsentLog {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  is_granted: boolean;
  consent_version: string;
  ip_address: string | null;
  user_agent: string | null;
  consented_at: string;
}

export interface AllowedEmailDomain {
  id: string;
  domain: string;
  role_hint: string;
  university_name: string | null;
  is_active: boolean;
  created_at: string;
}

// Job Listings
export type JobCategory =
  | 'software_it' | 'engineering' | 'data_science' | 'marketing'
  | 'finance_accounting' | 'human_resources' | 'sales' | 'design'
  | 'operations_logistics' | 'education_training' | 'healthcare' | 'legal'
  | 'media_communications' | 'consulting' | 'customer_service'
  | 'research_development' | 'management' | 'manufacturing'
  | 'architecture_construction' | 'other';

export type EmploymentType = 'full_time' | 'part_time' | 'internship';
export type WorkMode = 'onsite' | 'remote' | 'hybrid';
export type ApplicationStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected';
export type NotificationType = 'job_application' | 'interview_request' | 'application_success' | 'system';

export interface JobListing {
  id: string;
  employer_id: string;
  organization_id: string | null;
  title: string;
  description: string | null;
  category: JobCategory;
  employment_type: EmploymentType;
  work_mode: WorkMode;
  location: string | null;
  requirements: string[];
  deadline: string | null;
  is_active: boolean;
  application_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  profiles?: Profile;
  organizations?: Organization;
}

export interface JobApplication {
  id: string;
  job_listing_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  created_at: string;
  // Joined fields
  profiles?: Profile;
  job_listings?: JobListing;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export type LogStatus = 'success' | 'error' | 'unauthorized' | 'blocked';
export type LogActionCategory = 'auth' | 'community' | 'project' | 'job' | 'admin' | 'profile' | 'yearbook' | 'storage' | 'legal';

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action_type: string;
  action_category: LogActionCategory;
  entity_type: string | null;
  entity_id: string | null;
  status: LogStatus;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'edu_email' | 'role'>;
}

