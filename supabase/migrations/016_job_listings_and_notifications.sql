-- ============================================================
-- 016: İş İlanları, Başvurular ve Bildirim Sistemi
-- ============================================================

-- 1. job_listings tablosu
CREATE TABLE IF NOT EXISTS public.job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'software_it', 'engineering', 'data_science', 'marketing',
    'finance_accounting', 'human_resources', 'sales', 'design',
    'operations_logistics', 'education_training', 'healthcare', 'legal',
    'media_communications', 'consulting', 'customer_service',
    'research_development', 'management', 'manufacturing',
    'architecture_construction', 'other'
  )),
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'internship')),
  work_mode TEXT NOT NULL CHECK (work_mode IN ('onsite', 'remote', 'hybrid')),
  location TEXT,
  requirements TEXT[] DEFAULT '{}',
  deadline TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  application_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_job_listings_employer_id ON public.job_listings(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_category ON public.job_listings(category);
CREATE INDEX IF NOT EXISTS idx_job_listings_employment_type ON public.job_listings(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_listings_work_mode ON public.job_listings(work_mode);
CREATE INDEX IF NOT EXISTS idx_job_listings_is_active ON public.job_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_job_listings_created_at ON public.job_listings(created_at DESC);

-- RLS
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

-- Aktif ilanları herkes görebilir, pasif ilanları sadece ilan sahibi ve admin/moderator görebilir
CREATE POLICY job_listings_select ON public.job_listings FOR SELECT USING (
  is_active = true
  OR employer_id = auth.uid()
  OR public.get_user_role() IN ('admin', 'moderator')
);

-- Sadece employer rolündeki kullanıcılar ilan oluşturabilir
CREATE POLICY job_listings_insert ON public.job_listings FOR INSERT WITH CHECK (
  auth.uid() = employer_id
  AND public.get_user_role() = 'employer'
);

-- İlan sahibi veya admin/moderator güncelleyebilir
CREATE POLICY job_listings_update ON public.job_listings FOR UPDATE USING (
  employer_id = auth.uid()
  OR public.get_user_role() IN ('admin', 'moderator')
);

-- İlan sahibi veya admin/moderator silebilir
CREATE POLICY job_listings_delete ON public.job_listings FOR DELETE USING (
  employer_id = auth.uid()
  OR public.get_user_role() IN ('admin', 'moderator')
);


-- 2. job_applications tablosu
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_listing_id, applicant_id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_job_applications_job_listing_id ON public.job_applications(job_listing_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON public.job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);

-- RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Başvuran kendi başvurularını görebilir, ilan sahibi kendi ilanlarına gelen başvuruları görebilir, admin tüm başvuruları görebilir
CREATE POLICY applications_select ON public.job_applications FOR SELECT USING (
  applicant_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.job_listings jl
    WHERE jl.id = job_listing_id AND jl.employer_id = auth.uid()
  )
  OR public.get_user_role() IN ('admin', 'moderator')
);

-- Oturum açmış kullanıcı kendi adına başvuru oluşturabilir
CREATE POLICY applications_insert ON public.job_applications FOR INSERT WITH CHECK (
  applicant_id = auth.uid()
);

-- Başvuru durumu sadece ilan sahibi veya admin tarafından güncellenebilir
CREATE POLICY applications_update ON public.job_applications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.job_listings jl
    WHERE jl.id = job_listing_id AND jl.employer_id = auth.uid()
  )
  OR public.get_user_role() IN ('admin', 'moderator')
);


-- 3. notifications tablosu
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('job_application', 'interview_request', 'application_success', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi bildirimlerini görebilir
CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (
  recipient_id = auth.uid()
);

-- Bildirimler sunucu tarafında (service role) oluşturulur, normal kullanıcı ekleyemez
-- INSERT politikası yok — admin client kullanılacak

-- Sadece is_read alanı alıcı tarafından güncellenebilir
CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (
  recipient_id = auth.uid()
);

-- DELETE politikası YOK — Bildirimler asla silinemez


-- 4. Trigger: Başvuru sayacı güncelleme
CREATE OR REPLACE FUNCTION public.update_job_application_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.job_listings
    SET application_count = application_count + 1,
        updated_at = now()
    WHERE id = NEW.job_listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.job_listings
    SET application_count = GREATEST(application_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.job_listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_job_application_count
  AFTER INSERT OR DELETE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_application_count();
