-- ============================================================
-- 017: Yasal Metin Versiyonları ve Kullanıcı Onay Logları
-- ============================================================

-- 1. user_legal_consents tablosu (KVKK ve Sözleşme Onay Kayıtları)
CREATE TABLE IF NOT EXISTS public.user_legal_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('kvkk', 'terms_of_service', 'privacy', 'cookies')),
  version TEXT NOT NULL DEFAULT 'v1.0',
  ip_address TEXT,
  user_agent TEXT,
  consented_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, document_type, version)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_user_legal_consents_user ON public.user_legal_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_legal_consents_doc_ver ON public.user_legal_consents(document_type, version);

-- RLS
ALTER TABLE public.user_legal_consents ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi onay loglarını görebilir, admin tümünü görebilir
CREATE POLICY user_legal_consents_select ON public.user_legal_consents FOR SELECT USING (
  user_id = auth.uid()
  OR public.get_user_role() IN ('admin', 'moderator')
);

-- Kullanıcı kendi onayını ekleyebilir
CREATE POLICY user_legal_consents_insert ON public.user_legal_consents FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Güncelleme ve silme yok (Append-only / Değiştirilemez log)

-- 2. Sistemdeki aktif yasal metin versiyonları tablosu
CREATE TABLE IF NOT EXISTS public.legal_document_versions (
  document_type TEXT PRIMARY KEY CHECK (document_type IN ('kvkk', 'terms_of_service', 'privacy', 'cookies')),
  current_version TEXT NOT NULL DEFAULT 'v1.0',
  title TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Varsayılan versiyonları ekle
INSERT INTO public.legal_document_versions (document_type, current_version, title)
VALUES
  ('kvkk', 'v1.0', 'KVKK Aydınlatma Metni'),
  ('terms_of_service', 'v1.0', 'Kullanım Koşulları'),
  ('privacy', 'v1.0', 'Gizlilik Politikası'),
  ('cookies', 'v1.0', 'Çerez Politikası')
ON CONFLICT (document_type) DO NOTHING;

-- RLS
ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;

-- Herkes versiyonları okuyabilir
CREATE POLICY legal_document_versions_select ON public.legal_document_versions FOR SELECT USING (true);

-- Sadece admin yönetebilir
CREATE POLICY legal_document_versions_admin ON public.legal_document_versions FOR ALL USING (
  public.get_user_role() IN ('admin', 'moderator')
);
