-- =====================================================
-- CV Şablon Seçenekleri (template_name & primary_color) Ekleme
-- Oluşturma Tarihi: 2026-07-17
-- =====================================================

-- cv_data tablosuna şablon ismi ve tema rengini saklayacak kolonları ekle
ALTER TABLE public.cv_data 
ADD COLUMN IF NOT EXISTS template_name TEXT DEFAULT 'modern',
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3B82F6';

-- Mevcut satırlar için varsayılan değerleri güncelle
UPDATE public.cv_data
SET template_name = 'modern'
WHERE template_name IS NULL;

UPDATE public.cv_data
SET primary_color = '#3B82F6'
WHERE primary_color IS NULL;
