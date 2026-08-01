-- 040: content_reports tablosuna admin_note sütunu ekleme
-- Yöneticilerin şikayet inceleme paneli üzerinde işlem yaparken açıklama/not bırakmasını ve bu notu daha sonra güncelleyebilmesini sağlar.

ALTER TABLE public.content_reports 
ADD COLUMN IF NOT EXISTS admin_note TEXT;
