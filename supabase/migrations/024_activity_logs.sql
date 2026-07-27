-- 024: Kullanıcı Aktivite Log Sistemi
-- Tüm kullanıcı eylemlerinin ayrıntılı kaydı için append-only tablo

-- 1. activity_logs tablosu
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_category TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Performans indeksleri
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON public.activity_logs(action_category);
CREATE INDEX IF NOT EXISTS idx_activity_logs_status ON public.activity_logs(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_composite ON public.activity_logs(action_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- 3. RLS Aktifleştir
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Politikaları (Append-Only: UPDATE ve DELETE YOK)
-- Sadece service role (createAdminClient) ile INSERT yapılabilir
-- Sadece admin rolü SELECT yapabilir
CREATE POLICY "Admins can read all logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- INSERT politikası yok: Sadece service role key ile yazılabilir (RLS bypass)
-- UPDATE politikası yok: Loglar değiştirilemez
-- DELETE politikası yok: Loglar kullanıcı tarafından silinemez

-- 5. Otomatik temizlik fonksiyonu (2 yıldan eski logları siler)
CREATE OR REPLACE FUNCTION public.cleanup_expired_activity_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.activity_logs
  WHERE created_at < (now() - INTERVAL '2 years');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
