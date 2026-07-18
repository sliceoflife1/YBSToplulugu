-- =====================================================
-- 6. MENTORSHIP AND TALENT HUB FEATURES
-- =====================================================

-- `profiles` tablosuna mentörlük özelliklerini ekleyelim
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS meeting_url TEXT,
ADD COLUMN IF NOT EXISTS is_mentor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mentor_topics TEXT[] DEFAULT '{}'::text[];

-- Mentörlerin kolayca aranabilmesi için indeks ekleyelim
CREATE INDEX IF NOT EXISTS idx_profiles_is_mentor ON public.profiles(is_mentor) WHERE is_mentor = true;
