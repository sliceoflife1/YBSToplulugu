-- 036: Gönderi ve Proje İçerik Şikayet/Bildirim Tablosu
-- Kullanıcıların topluluk gönderileri ve projeleri yöneticilere bildirmesini sağlar.

CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'project')),
  content_id UUID NOT NULL,
  reason_category TEXT NOT NULL DEFAULT 'other',
  reason_details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'actioned', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Mükerrer şikayeti engelleyen unique index (aynı kullanıcı aynı içeriği 1 kez bildirebilir)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_reporter_content 
  ON public.content_reports(reporter_id, content_type, content_id);

-- Performans indeksleri
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON public.content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON public.content_reports(created_at DESC);

-- RLS (Row Level Security) Aktifleştir
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Policy 1: Kullanıcılar kendi adlarına şikayet oluşturabilir
CREATE POLICY "Users can create their own reports"
  ON public.content_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Policy 2: Sadece yöneticiler tüm şikayetleri okuyabilir
CREATE POLICY "Admins can read all reports"
  ON public.content_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy 3: Sadece yöneticiler şikayet durumunu güncelleyebilir (resolve/dismiss)
CREATE POLICY "Admins can update reports"
  ON public.content_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy 4: Sadece yöneticiler şikayet silebilir
CREATE POLICY "Admins can delete reports"
  ON public.content_reports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
