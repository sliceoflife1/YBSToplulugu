-- =====================================================
-- YBS TOPLULUGU - ANDIÇ MODÜLÜ SQL
-- Storage bucket kısmı ÇIKARILDI (Dashboard'dan ekleyin)
-- =====================================================

-- =====================================================
-- A. FAKÜLTE VE BÖLÜM TABLOLARI
-- =====================================================

CREATE TABLE IF NOT EXISTS public.yearbook_faculties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.yearbook_departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID NOT NULL REFERENCES public.yearbook_faculties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_faculty_department UNIQUE (faculty_id, name)
);

ALTER TABLE public.yearbook_faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearbook_departments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yearbook_faculties' AND policyname = 'Faculties read access') THEN
    CREATE POLICY "Faculties read access" ON public.yearbook_faculties FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yearbook_departments' AND policyname = 'Departments read access') THEN
    CREATE POLICY "Departments read access" ON public.yearbook_departments FOR SELECT USING (true);
  END IF;
END $$;

-- =====================================================
-- B. SEED VERİLER (DEU Fakülte ve Bölümleri)
-- =====================================================

INSERT INTO public.yearbook_faculties (id, name) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'İktisadi ve İdari Bilimler Fakültesi'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Mühendislik Fakültesi'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Edebiyat Fakültesi'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Fen Fakültesi')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.yearbook_departments (faculty_id, name) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Yönetim Bilişim Sistemleri'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'İşletme'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'İktisat'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Maliye'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Kamu Yönetimi'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Bilgisayar Mühendisliği'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Endüstri Mühendisliği'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Elektrik-Elektronik Mühendisliği'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Sosyoloji'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Tarih'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'İstatistik'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Matematik')
ON CONFLICT ON CONSTRAINT uq_faculty_department DO NOTHING;

-- =====================================================
-- C. ANDIÇ PROFİLLERİ VE ARKADAŞ YAZILARI
-- =====================================================

CREATE TABLE IF NOT EXISTS public.yearbook_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.yearbook_departments(id) ON DELETE SET NULL,
  graduation_year INTEGER NOT NULL,
  education_type TEXT NOT NULL CHECK (education_type IN ('primary', 'secondary')),
  is_visible BOOLEAN DEFAULT true,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.yearbook_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.yearbook_profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_sender_recipient UNIQUE (sender_id, recipient_id)
);

ALTER TABLE public.yearbook_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearbook_entries ENABLE ROW LEVEL SECURITY;

-- yearbook_profiles RLS Politikaları
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yearbook_profiles' AND policyname = 'Yearbook profiles read access') THEN
    CREATE POLICY "Yearbook profiles read access" ON public.yearbook_profiles FOR SELECT
      USING (auth.role() = 'authenticated' AND (is_visible = true OR user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yearbook_profiles' AND policyname = 'Yearbook profiles owner insert') THEN
    CREATE POLICY "Yearbook profiles owner insert" ON public.yearbook_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yearbook_profiles' AND policyname = 'Yearbook profiles owner update') THEN
    CREATE POLICY "Yearbook profiles owner update" ON public.yearbook_profiles FOR UPDATE
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yearbook_profiles' AND policyname = 'Yearbook profiles owner delete') THEN
    CREATE POLICY "Yearbook profiles owner delete" ON public.yearbook_profiles FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- yearbook_entries RLS Politikaları
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yearbook_entries' AND policyname = 'Yearbook entries read access') THEN
    CREATE POLICY "Yearbook entries read access" ON public.yearbook_entries FOR SELECT
      USING (auth.role() = 'authenticated' AND (is_approved = true OR sender_id = auth.uid() OR recipient_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yearbook_entries' AND policyname = 'Yearbook entries insert access') THEN
    CREATE POLICY "Yearbook entries insert access" ON public.yearbook_entries FOR INSERT
      WITH CHECK (auth.role() = 'authenticated' AND sender_id = auth.uid() AND recipient_id != auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yearbook_entries' AND policyname = 'Yearbook entries update access') THEN
    CREATE POLICY "Yearbook entries update access" ON public.yearbook_entries FOR UPDATE
      USING (auth.role() = 'authenticated' AND (recipient_id = auth.uid() OR sender_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yearbook_entries' AND policyname = 'Yearbook entries delete access') THEN
    CREATE POLICY "Yearbook entries delete access" ON public.yearbook_entries FOR DELETE
      USING (auth.role() = 'authenticated' AND (recipient_id = auth.uid() OR sender_id = auth.uid()));
  END IF;
END $$;

-- profiles tablosuna avatar_url kolonu ekle (yoksa)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
