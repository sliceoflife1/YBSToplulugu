-- =====================================================
-- 8. ÜNİVERSİTE ANDICI & DEPOLAMA (STORAGE) MODÜLÜ
-- Oluşturma Tarihi: 2026-07-18
-- =====================================================

-- =====================================================
-- A. STORAGE (DEPOLAMA BUCKET VE POLİTİKALARI)
-- =====================================================

-- 'avatars' isimli public bucket oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS etkinleştirme
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Herkes avatarları okuyabilir (SELECT)
CREATE POLICY "Avatar Images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 2. Sadece oturum açmış kullanıcı kendi klasörüne resim yükleyebilir (INSERT)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Sadece kullanıcı kendi resmini güncelleyebilir (UPDATE)
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Sadece kullanıcı kendi resmini silebilir (DELETE)
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);


-- =====================================================
-- B. FAKÜLTE VE BÖLÜM TABLOLARI VE SEED VERİLER
-- =====================================================

-- 1. Fakülteler Tablosu
CREATE TABLE IF NOT EXISTS public.yearbook_faculties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bölümler Tablosu
CREATE TABLE IF NOT EXISTS public.yearbook_departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID NOT NULL REFERENCES public.yearbook_faculties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_faculty_department UNIQUE (faculty_id, name)
);

-- RLS Etkinleştir
ALTER TABLE public.yearbook_faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearbook_departments ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir, sadece admin ekleyebilir
CREATE POLICY "Faculties read access" ON public.yearbook_faculties FOR SELECT USING (true);
CREATE POLICY "Departments read access" ON public.yearbook_departments FOR SELECT USING (true);

-- Seed Veriler (Fakülteler)
INSERT INTO public.yearbook_faculties (id, name) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'İktisadi ve İdari Bilimler Fakültesi'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Mühendislik Fakültesi'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Edebiyat Fakültesi'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Fen Fakültesi')
ON CONFLICT (name) DO NOTHING;

-- Seed Veriler (Bölümler)
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

-- 1. Andıç Profilleri Tablosu (profiles ile 1-1 ilişki)
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

-- 2. Arkadaş Yazıları (Yorumlar) Tablosu
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

-- RLS Etkinleştir
ALTER TABLE public.yearbook_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yearbook_entries ENABLE ROW LEVEL SECURITY;

-- yearbook_profiles RLS Politikaları
-- Okuma: Herkes okuyabilir (giriş yapmış olanlar), ancak sadece is_visible = true ise veya kendi profilimiz ise
CREATE POLICY "Yearbook profiles read access" ON public.yearbook_profiles FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    (is_visible = true OR user_id = auth.uid())
  );

-- Yazma (Insert/Update/Delete): Sadece kendi profilimizi yönetebiliriz
CREATE POLICY "Yearbook profiles owner insert" ON public.yearbook_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Yearbook profiles owner update" ON public.yearbook_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Yearbook profiles owner delete" ON public.yearbook_profiles FOR DELETE USING (user_id = auth.uid());


-- yearbook_entries RLS Politikaları
-- Okuma: Onaylanmış olanları veya yazarı/alıcısı olduğumuz onay bekleyenleri okuyabiliriz
CREATE POLICY "Yearbook entries read access" ON public.yearbook_entries FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    (is_approved = true OR sender_id = auth.uid() OR recipient_id = auth.uid())
  );

-- Ekleme: Herkes giriş yapmış olmak şartıyla başkasına andıç yazısı gönderebilir (kendisine yazamaz)
CREATE POLICY "Yearbook entries insert access" ON public.yearbook_entries FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND 
    sender_id = auth.uid() AND 
    recipient_id != auth.uid()
  );

-- Güncelleme: Sadece alıcı onay durumunu güncelleyebilir (is_approved alanını), ya da gönderen kişi kendi yazdığı içeriği güncelleyebilir
CREATE POLICY "Yearbook entries update access" ON public.yearbook_entries FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND 
    (recipient_id = auth.uid() OR sender_id = auth.uid())
  );

-- Silme: Yazıyı gönderen kişi veya yazının alıcısı silebilir
CREATE POLICY "Yearbook entries delete access" ON public.yearbook_entries FOR DELETE
  USING (
    auth.role() = 'authenticated' AND 
    (recipient_id = auth.uid() OR sender_id = auth.uid())
  );
