-- =====================================================
-- YBS Topluluğu - Supabase Veritabanı Güncellemesi
-- Gönderilere Medya ve YouTube Desteği Ekleme
-- =====================================================

DO $$ BEGIN
  -- posts tablosuna media_urls (TEXT[]) ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN media_urls TEXT[] DEFAULT '{}'::text[];
  END IF;

  -- posts tablosuna youtube_url (TEXT) ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'youtube_url'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN youtube_url TEXT;
  END IF;
END $$;
