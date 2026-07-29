-- 037: Admin Rolü @gmail.com ve Google Authenticator (TOTP) 2FA Sistemi
-- Admin kullanıcılarının ikincil gmail adresi ve 2FA TOTP bilgilerini saklayan sütunlar

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_gmail TEXT,
  ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS totp_secret TEXT,
  ADD COLUMN IF NOT EXISTS backup_codes TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS totp_verified_at TIMESTAMPTZ;

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_profiles_admin_gmail ON public.profiles(admin_gmail) WHERE admin_gmail IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_2fa_enabled ON public.profiles(is_2fa_enabled) WHERE is_2fa_enabled = true;
