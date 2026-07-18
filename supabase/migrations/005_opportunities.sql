-- =====================================================
-- FIRSATLAR VE AVANTAJLAR (OPPORTUNITIES)
-- =====================================================

CREATE TABLE public.opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  conditions TEXT[] DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('education', 'entertainment', 'food', 'travel', 'technology', 'other')),
  brand_name TEXT NOT NULL,
  brand_logo_url TEXT,
  image_url TEXT,
  discount_code TEXT,
  external_link TEXT,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security aktif edilsin
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Okuma Politikası: Aktif olanları herkes görebilir. Aktif olmayanları sadece admin/moderator görebilir.
CREATE POLICY "opportunities_select" ON public.opportunities
  FOR SELECT USING (is_active = true OR public.get_user_role() IN ('admin', 'moderator'));

-- Yönetim Politikası: Sadece admin ve moderatörler her işlemi yapabilir
CREATE POLICY "opportunities_admin_manage" ON public.opportunities
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'moderator'))
  WITH CHECK (public.get_user_role() IN ('admin', 'moderator'));
