-- =====================================================
-- ETKİNLİK VE DUYURULAR (ANNOUNCEMENTS)
-- =====================================================

CREATE TABLE public.announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  external_link TEXT,
  event_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security aktif edilsin
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Okuma Politikası: Aktif olanları herkes görebilir. Aktif olmayanları sadece admin/moderator görebilir.
CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT USING (is_active = true OR public.get_user_role() IN ('admin', 'moderator'));

-- Yönetim Politikası: Sadece admin ve moderatörler her işlemi yapabilir
CREATE POLICY "announcements_admin_manage" ON public.announcements
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'moderator'))
  WITH CHECK (public.get_user_role() IN ('admin', 'moderator'));
