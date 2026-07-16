-- =====================================================
-- YBS Topluluğu - Supabase Veritabanı Şeması
-- DEÜ Öğrenci Platformu - LinkedIn + Reddit Melezi
-- Oluşturma Tarihi: 2026-07-10
-- =====================================================

-- =====================================================
-- 1. YARDIMCI FONKSİYONLAR
-- =====================================================

-- =====================================================
-- 2. İZİN VERİLEN E-POSTA DOMAİNLERİ
-- =====================================================

CREATE TABLE public.allowed_email_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT UNIQUE NOT NULL,
  role_hint TEXT NOT NULL DEFAULT 'student' CHECK (role_hint IN ('student', 'faculty', 'any')),
  university_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Varsayılan DEÜ domainleri
INSERT INTO public.allowed_email_domains (domain, role_hint, university_name) VALUES
  ('ogr.deu.edu.tr', 'student', 'Dokuz Eylül Üniversitesi'),
  ('deu.edu.tr', 'faculty', 'Dokuz Eylül Üniversitesi');

-- =====================================================
-- 3. PROFİLLER
-- =====================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_no TEXT UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  edu_email TEXT UNIQUE NOT NULL,
  personal_email TEXT,
  phone TEXT,
  department TEXT,
  class_year SMALLINT,
  linkedin_url TEXT,
  github_url TEXT,
  bio TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'alumni', 'faculty', 'employer', 'admin', 'moderator')),
  is_active BOOLEAN DEFAULT true,
  is_cv_public BOOLEAN DEFAULT false,
  karma_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Kullanıcı rolünü döndüren yardımcı fonksiyon (RLS'de kullanılır)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = (select auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_department ON public.profiles(department);

-- Yeni kullanıcı kaydında otomatik profil oluşturma
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  email_domain TEXT;
  user_role TEXT;
  meta_role TEXT;
  meta_first_name TEXT;
  meta_last_name TEXT;
  meta_phone TEXT;
  meta_personal_email TEXT;
  meta_department TEXT;
  meta_class_year SMALLINT;
  is_active_val BOOLEAN := true;
BEGIN
  email_domain := split_part(lower(NEW.email), '@', 2);
  
  -- Meta verileri oku
  meta_role := NEW.raw_user_meta_data ->> 'role';
  meta_first_name := COALESCE(NEW.raw_user_meta_data ->> 'first_name', '');
  meta_last_name := COALESCE(NEW.raw_user_meta_data ->> 'last_name', '');
  meta_phone := NEW.raw_user_meta_data ->> 'phone';
  meta_personal_email := NEW.raw_user_meta_data ->> 'personal_email';
  meta_department := NEW.raw_user_meta_data ->> 'department';
  
  IF NEW.raw_user_meta_data ->> 'class_year' IS NOT NULL THEN
    meta_class_year := (NEW.raw_user_meta_data ->> 'class_year')::smallint;
  END IF;

  -- Domain'e göre varsayılan rol belirleme
  SELECT role_hint INTO user_role
  FROM public.allowed_email_domains
  WHERE email_domain LIKE '%' || domain
  AND is_active = true
  LIMIT 1;
  
  -- Eğer meta veride geçerli bir rol varsa onu kullan (örneğin employer/faculty)
  IF meta_role IS NOT NULL AND meta_role IN ('student', 'faculty', 'employer', 'admin') THEN
    user_role := meta_role;
  ELSIF user_role IS NULL THEN
    user_role := 'student';
  END IF;

  -- İşverenler admin onayı beklemeli
  IF user_role = 'employer' THEN
    is_active_val := false;
  END IF;
  
  INSERT INTO public.profiles (id, edu_email, first_name, last_name, phone, personal_email, department, class_year, role, is_active)
  VALUES (
    NEW.id, 
    NEW.email, 
    meta_first_name, 
    meta_last_name, 
    meta_phone,
    meta_personal_email,
    meta_department,
    meta_class_year,
    user_role,
    is_active_val
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 4. PROJELER (ANDIÇ / TİMELİNE)
-- =====================================================

CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  technologies TEXT[],
  github_url TEXT,
  youtube_url TEXT,
  behance_url TEXT,
  external_url TEXT,
  semester TEXT CHECK (semester IN ('fall', 'spring', 'summer')),
  year SMALLINT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_technologies ON public.projects USING GIN(technologies);
CREATE INDEX idx_projects_year ON public.projects(year DESC);

-- =====================================================
-- 5. CV VERİLERİ (HİBRİT JSONB + ARRAY)
-- =====================================================

CREATE TABLE public.cv_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  education JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  skills TEXT[],
  certifications JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  custom_sections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cv_data_user_id ON public.cv_data(user_id);
CREATE INDEX idx_cv_data_skills ON public.cv_data USING GIN(skills);

-- =====================================================
-- 6. SUBREDDİTLER (FORUM BÖLÜMLERİ)
-- =====================================================

CREATE TABLE public.subreddits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subreddits_slug ON public.subreddits(slug);

-- =====================================================
-- 7. POSTLAR
-- =====================================================

CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subreddit_id UUID NOT NULL REFERENCES public.subreddits(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  upvote_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_posts_subreddit_id ON public.posts(subreddit_id);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);

-- =====================================================
-- 8. UPVOTES (SADECE BEĞENİ - DOWNVOTE YOK)
-- =====================================================

CREATE TABLE public.upvotes (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- Upvote count trigger
CREATE OR REPLACE FUNCTION public.update_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET upvote_count = upvote_count + 1 WHERE id = NEW.post_id;
    -- Karma puanı güncelle
    UPDATE public.profiles SET karma_points = karma_points + 1
    WHERE id = (SELECT author_id FROM public.posts WHERE id = NEW.post_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET upvote_count = upvote_count - 1 WHERE id = OLD.post_id;
    UPDATE public.profiles SET karma_points = karma_points - 1
    WHERE id = (SELECT author_id FROM public.posts WHERE id = OLD.post_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_upvote_count
AFTER INSERT OR DELETE ON public.upvotes
FOR EACH ROW EXECUTE FUNCTION public.update_upvote_count();

-- =====================================================
-- 9. YORUMLAR (NESTED / THREADED)
-- =====================================================

CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_author_id ON public.comments(author_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);

-- Comment count trigger
CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_comment_count
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_comment_count();

-- =====================================================
-- 10. KURULUŞLAR (İŞVEREN / VAKIF / DERNEK)
-- =====================================================

CREATE TABLE public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('employer', 'foundation', 'association', 'other')),
  description TEXT,
  website_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  owner_id UUID REFERENCES public.profiles(id),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_organizations_status ON public.organizations(approval_status);
CREATE INDEX idx_organizations_owner ON public.organizations(owner_id);

-- =====================================================
-- 11. KVKK ONAY LOGLARI (APPEND-ONLY)
-- =====================================================

CREATE TABLE public.kvkk_consent_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms_of_service', 'data_processing', 'marketing')),
  is_granted BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  consented_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_kvkk_user_id ON public.kvkk_consent_logs(user_id);
CREATE INDEX idx_kvkk_consent_type ON public.kvkk_consent_logs(consent_type);

-- =====================================================
-- 12. DERS NOTLARI
-- =====================================================

CREATE TABLE public.course_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  course_name TEXT NOT NULL,
  course_code TEXT,
  external_url TEXT,
  file_type TEXT,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_course_notes_author ON public.course_notes(author_id);
CREATE INDEX idx_course_notes_course ON public.course_notes(course_name);

-- =====================================================
-- 13. ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- =====================================================

-- Tüm tablolarda RLS'yi aktifleştir
ALTER TABLE public.allowed_email_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kvkk_consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_notes ENABLE ROW LEVEL SECURITY;

-- === PROFILES ===
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (is_active = true OR id = (select auth.uid()));

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin');

-- === PROJECTS ===
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- === CV DATA ===
CREATE POLICY "cv_select" ON public.cv_data
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = user_id AND is_cv_public = true
    )
  );

CREATE POLICY "cv_insert" ON public.cv_data
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "cv_update" ON public.cv_data
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()));

-- === SUBREDDITS ===
CREATE POLICY "subreddits_select" ON public.subreddits
  FOR SELECT USING (is_active = true);

CREATE POLICY "subreddits_admin_manage" ON public.subreddits
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'moderator'));

-- === POSTS ===
CREATE POLICY "posts_select" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "posts_insert" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

CREATE POLICY "posts_update" ON public.posts
  FOR UPDATE TO authenticated
  USING (author_id = (select auth.uid()));

CREATE POLICY "posts_delete" ON public.posts
  FOR DELETE TO authenticated
  USING (
    author_id = (select auth.uid())
    OR public.get_user_role() IN ('admin', 'moderator', 'faculty')
  );

-- === UPVOTES ===
CREATE POLICY "upvotes_select" ON public.upvotes
  FOR SELECT USING (true);

CREATE POLICY "upvotes_insert" ON public.upvotes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "upvotes_delete" ON public.upvotes
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- === COMMENTS ===
CREATE POLICY "comments_select" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "comments_insert" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

CREATE POLICY "comments_update" ON public.comments
  FOR UPDATE TO authenticated
  USING (author_id = (select auth.uid()));

CREATE POLICY "comments_delete" ON public.comments
  FOR DELETE TO authenticated
  USING (
    author_id = (select auth.uid())
    OR public.get_user_role() IN ('admin', 'moderator', 'faculty')
  );

-- === ORGANIZATIONS ===
CREATE POLICY "orgs_select_approved" ON public.organizations
  FOR SELECT USING (
    approval_status = 'approved'
    OR owner_id = (select auth.uid())
    OR public.get_user_role() IN ('admin', 'moderator')
  );

CREATE POLICY "orgs_insert" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "orgs_admin_update" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'admin');

-- === KVKK CONSENT LOGS (APPEND-ONLY) ===
CREATE POLICY "kvkk_admin_select" ON public.kvkk_consent_logs
  FOR SELECT TO authenticated
  USING (public.get_user_role() = 'admin' OR user_id = (select auth.uid()));

CREATE POLICY "kvkk_insert" ON public.kvkk_consent_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- NO UPDATE/DELETE POLICIES — APPEND-ONLY

-- === COURSE NOTES ===
CREATE POLICY "course_notes_select" ON public.course_notes
  FOR SELECT USING (true);

CREATE POLICY "course_notes_insert" ON public.course_notes
  FOR INSERT TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

CREATE POLICY "course_notes_update" ON public.course_notes
  FOR UPDATE TO authenticated
  USING (author_id = (select auth.uid()));

CREATE POLICY "course_notes_delete" ON public.course_notes
  FOR DELETE TO authenticated
  USING (
    author_id = (select auth.uid())
    OR public.get_user_role() IN ('admin', 'moderator')
  );

-- === ALLOWED EMAIL DOMAINS ===
CREATE POLICY "domains_select" ON public.allowed_email_domains
  FOR SELECT USING (true);

CREATE POLICY "domains_admin_manage" ON public.allowed_email_domains
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin');

-- =====================================================
-- 14. DATA API ERİŞİM İZİNLERİ (Supabase 2026 güncellemesi)
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
