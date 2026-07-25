-- ============================================================
-- 021: Foreign Key Cascade Silme Ayarları
-- ============================================================

-- Organizations tablosundaki owner_id foreign key constraint'ini ON DELETE CASCADE yap
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_owner_id_fkey;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_owner_id_fkey
  FOREIGN KEY (owner_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Job Listings tablosundaki employer_id foreign key constraint'ini ON DELETE CASCADE yap
ALTER TABLE public.job_listings
  DROP CONSTRAINT IF EXISTS job_listings_employer_id_fkey;

ALTER TABLE public.job_listings
  ADD CONSTRAINT job_listings_employer_id_fkey
  FOREIGN KEY (employer_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Job Applications tablosundaki applicant_id foreign key constraint'ini ON DELETE CASCADE yap
ALTER TABLE public.job_applications
  DROP CONSTRAINT IF EXISTS job_applications_applicant_id_fkey;

ALTER TABLE public.job_applications
  ADD CONSTRAINT job_applications_applicant_id_fkey
  FOREIGN KEY (applicant_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;
