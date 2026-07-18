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
  custom_sections: CvCustomSection[];
  created_at: string;
  updated_at: string;
}

export interface CvEducation {
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
}

export interface CvExperience {
  company: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
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
