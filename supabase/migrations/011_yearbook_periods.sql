-- =====================================================
-- YBS TOPLULUGU - ANDIÇ YILLIK DÖNEMLERİ TABLOSU (SQL)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.yearbooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Etkinleştir
ALTER TABLE public.yearbooks ENABLE ROW LEVEL SECURITY;

-- 1. Okuma Politikası (Select): Giriş yapmış tüm kullanıcılar okuyabilir
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yearbooks' AND policyname = 'Yearbooks read access') THEN
    CREATE POLICY "Yearbooks read access" ON public.yearbooks FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 2. Yönetici/Akademisyen Yetkileri (Insert, Update, Delete):
-- Sadece admin, moderator ve faculty rollerine sahip kullanıcılar yapabilir.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yearbooks' AND policyname = 'Yearbooks admin insert') THEN
    CREATE POLICY "Yearbooks admin insert" ON public.yearbooks FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'moderator', 'faculty')
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yearbooks' AND policyname = 'Yearbooks admin update') THEN
    CREATE POLICY "Yearbooks admin update" ON public.yearbooks FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'moderator', 'faculty')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'moderator', 'faculty')
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'yearbooks' AND policyname = 'Yearbooks admin delete') THEN
    CREATE POLICY "Yearbooks admin delete" ON public.yearbooks FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'moderator', 'faculty')
        )
      );
  END IF;
END $$;

-- =====================================================
-- SEED VERİLERİ (2020 - 2030 Yılları Arası)
-- =====================================================
INSERT INTO public.yearbooks (year, is_active) VALUES
  (2020, true),
  (2021, true),
  (2022, true),
  (2023, true),
  (2024, true),
  (2025, true),
  (2026, true),
  (2027, true),
  (2028, true),
  (2029, true),
  (2030, true)
ON CONFLICT (year) DO NOTHING;
