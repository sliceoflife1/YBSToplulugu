-- =====================================================
-- 7. KAPSAMLI CV & PROFİL GENİŞLETMELERİ
-- Oluşturma Tarihi: 2026-07-18
-- Amaç:
--   - Profildeki kişileri gerçek bir özgeçmiş için gerekli tüm
--     alanlarla (unvan, konum, kişisel site, iş arama durumu) donatmak
--   - CV verisine "projeler", "referanslar" ve şablonların zaten var olan
--     ama kullanılmayan "custom_sections" alanını etkinleştirmek
--   - Talent Hub (işveren) tarafında daha kapsamlı filtreleme yapılmasına
--     izin vermek
-- =====================================================

-- `profiles` tablosuna CV/özgeçmiş için ek kişisel bilgi kolonları ekle
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS is_open_to_work BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.headline IS 'CV başlığı / profesyonel unvan (Örn: Frontend Developer Adayı)';
COMMENT ON COLUMN public.profiles.location IS 'Şehir / konum bilgisi (Örn: İzmir, Türkiye)';
COMMENT ON COLUMN public.profiles.website_url IS 'Kişisel web sitesi veya portfolyo bağlantısı';
COMMENT ON COLUMN public.profiles.is_open_to_work IS 'Kullanıcının aktif olarak iş/staj aradığını belirtir; Talent Hub filtrelemesinde kullanılır';

-- İşverenlerin "İş Arıyor" filtresiyle arama yapabilmesi için indeks
CREATE INDEX IF NOT EXISTS idx_profiles_is_open_to_work ON public.profiles(is_open_to_work) WHERE is_open_to_work = true;
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);

-- `cv_data` tablosuna Projeler ve Referanslar bölümlerini ekle
-- (custom_sections zaten mevcuttu, ancak hiçbir arayüzde kullanılmıyordu)
ALTER TABLE public.cv_data
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "references" JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.cv_data.projects IS 'CV üzerinde gösterilecek proje listesi: [{ title, description, technologies, url, date }]';
COMMENT ON COLUMN public.cv_data."references" IS 'Referans kişiler listesi: [{ name, position, company, email, phone }]';
COMMENT ON COLUMN public.cv_data.custom_sections IS 'Kullanıcı tanımlı ek CV bölümleri: [{ title, items: string[] }]';
