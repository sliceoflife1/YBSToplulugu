-- ============================================================
-- 039: Bildirim Sisteminde Atomik Mükerrer Önleme, Güvenlik
-- Sıkılaştırması ve Sağlık Kontrolü
--
-- Bu geçiş, aşağıdaki sokratik denetim sorularına yanıt olarak eklenmiştir:
--   1) Yarış durumu (race condition): SELECT-then-INSERT yerine artık
--      veritabanı seviyesinde UNIQUE INDEX + ON CONFLICT DO NOTHING
--      kullanılarak atomik mükerrer önleme sağlanır.
--   2) organizations tablosunda owner_id için de aynı koruma denenir
--      (mevcut mükerrer kayıt varsa migration hata vermeden bu adımı atlar).
--   3) Canlı veritabanının bildirim sistemi için doğru kurulup
--      kurulmadığını (tablolar, trigger'lar, admin sayısı) tek sorguyla
--      raporlayan bir sağlık kontrolü fonksiyonu eklenir.
-- ============================================================

-- ---------------------------------------------------------------
-- 0. notifications tablosunun varlığını garanti et (yoksa oluştur)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  dedup_key TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_select') THEN
    CREATE POLICY notifications_select ON public.notifications FOR SELECT USING (recipient_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_update') THEN
    CREATE POLICY notifications_update ON public.notifications FOR UPDATE USING (recipient_id = auth.uid());
  END IF;
END $$;

-- ---------------------------------------------------------------
-- 0.1 content_reports tablosunun varlığını garanti et (yoksa oluştur)
-- ---------------------------------------------------------------
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_reporter_content 
  ON public.content_reports(reporter_id, content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON public.content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON public.content_reports(created_at DESC);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_reports' AND policyname = 'Users can create their own reports') THEN
    CREATE POLICY "Users can create their own reports" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_reports' AND policyname = 'Admins can read all reports') THEN
    CREATE POLICY "Admins can read all reports" ON public.content_reports FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_reports' AND policyname = 'Admins can update reports') THEN
    CREATE POLICY "Admins can update reports" ON public.content_reports FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_reports' AND policyname = 'Admins can delete reports') THEN
    CREATE POLICY "Admins can delete reports" ON public.content_reports FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
  END IF;
END $$;

-- ---------------------------------------------------------------
-- 1. notifications tablosuna atomik mükerrer önleme anahtarı ekle
-- ---------------------------------------------------------------
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS dedup_key TEXT;

-- Aynı (recipient_id, dedup_key) ikilisinin yalnızca bir kez var olmasını
-- sağlayan kısmi benzersiz indeks. dedup_key NULL olan (çoğu) bildirim
-- türü bu kısıtlamadan etkilenmez; sadece kayıt bildirimleri gibi
-- "en fazla bir kez" gönderilmesi gereken bildirimler için kullanılır.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_notifications_recipient_dedup
ON public.notifications (recipient_id, dedup_key)
WHERE dedup_key IS NOT NULL;

-- ---------------------------------------------------------------
-- 2. organizations.owner_id için de mümkünse benzersizlik ekle
--    (Bir kullanıcının birden fazla bekleyen organizasyon kaydı
--    oluşturmasını veritabanı seviyesinde engeller.) Eğer canlı
--    veritabanında zaten mükerrer owner_id kayıtları varsa bu adım
--    sessizce atlanır ve migration'ın geri kalanı çalışmaya devam eder.
-- ---------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.organizations
      ADD CONSTRAINT uniq_organizations_owner_id UNIQUE (owner_id);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'organizations.owner_id icin UNIQUE kisitlama eklenemedi (muhtemelen mukerrer kayitlar mevcut). Hata: %', SQLERRM;
  END;
END $$;

-- ---------------------------------------------------------------
-- 3. notify_admins_on_new_employer_or_faculty fonksiyonunu güncelle:
--    artık dedup_key ile atomik ON CONFLICT DO NOTHING kullanır.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_employer_or_faculty()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  role_title TEXT;
  formatted_date TEXT;
  user_full_name TEXT;
BEGIN
  IF NEW.role IN ('employer', 'faculty') THEN
    IF NEW.role = 'employer' THEN
      role_title := 'İşveren';
    ELSE
      role_title := 'Akademisyen';
    END IF;

    user_full_name := TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
    IF user_full_name = '' THEN
      user_full_name := NEW.edu_email;
    END IF;

    formatted_date := to_char(now() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI');

    FOR admin_record IN
      SELECT id FROM public.profiles WHERE role IN ('admin', 'moderator')
    LOOP
      INSERT INTO public.notifications (
        recipient_id, type, title, message, metadata, is_read, created_at, dedup_key
      ) VALUES (
        admin_record.id,
        'system',
        'Yeni ' || role_title || ' Kaydı: ' || user_full_name,
        formatted_date || ' tarihinde yeni bir ' || role_title || ' kayıt oldu. Ad Soyad: ' || user_full_name || ', E-posta: ' || NEW.edu_email || '. Detaylar için tıklayın.',
        jsonb_build_object('link', '/admin/users', 'user_id', NEW.id, 'role', NEW.role),
        false,
        now(),
        'admin_new_registration:' || NEW.id::text
      )
      ON CONFLICT (recipient_id, dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
-- 4. notify_admins_on_email_verified fonksiyonunu güncelle
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_admins_on_email_verified()
RETURNS TRIGGER AS $$
DECLARE
  user_profile RECORD;
  admin_record RECORD;
  role_title TEXT;
  formatted_date TEXT;
  user_full_name TEXT;
  company_name TEXT;
BEGIN
  IF (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL) THEN
    SELECT * INTO user_profile FROM public.profiles WHERE id = NEW.id;

    IF user_profile IS NOT NULL AND user_profile.role IN ('employer', 'faculty') THEN
      IF user_profile.role = 'employer' THEN
        role_title := 'İşveren';
      ELSE
        role_title := 'Akademisyen';
      END IF;

      user_full_name := TRIM(COALESCE(user_profile.first_name, '') || ' ' || COALESCE(user_profile.last_name, ''));
      IF user_full_name = '' THEN
        user_full_name := NEW.email;
      END IF;

      company_name := COALESCE(NEW.raw_user_meta_data ->> 'first_name', user_full_name);
      formatted_date := to_char(now() AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI');

      -- 4.1 İşveren ise organizasyon kaydını pending olarak aç (eğer yoksa)
      IF user_profile.role = 'employer' THEN
        INSERT INTO public.organizations (
          owner_id, name, type, description, website_url, contact_email, contact_phone, approval_status, is_active
        ) VALUES (
          NEW.id,
          company_name,
          COALESCE((NEW.raw_user_meta_data ->> 'org_type')::public.org_type, 'employer'::public.org_type),
          NEW.raw_user_meta_data ->> 'bio',
          NEW.raw_user_meta_data ->> 'website',
          NEW.email,
          NEW.raw_user_meta_data ->> 'phone',
          'pending'::public.approval_status,
          false
        ) ON CONFLICT DO NOTHING;
      END IF;

      -- 4.2 Kullanıcının kendisine bildirim (atomik, dedup_key ile)
      INSERT INTO public.notifications (
        recipient_id, type, title, message, metadata, is_read, created_at, dedup_key
      ) VALUES (
        NEW.id,
        'system',
        'E-posta Adresiniz Doğrulandı',
        'E-posta adresiniz başarıyla doğrulandı. Hesabınız ve başvuru detaylarınız şu an yönetici onayındadır. Onaylandığında bilgilendirileceksiniz.',
        jsonb_build_object('link', '/dashboard', 'role', user_profile.role),
        false,
        now(),
        'user_pending_confirmation:' || NEW.id::text
      )
      ON CONFLICT (recipient_id, dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING;

      -- 4.3 Tüm admin ve moderatörlere bildirim (atomik, dedup_key ile)
      FOR admin_record IN
        SELECT id FROM public.profiles WHERE role IN ('admin', 'moderator')
      LOOP
        INSERT INTO public.notifications (
          recipient_id, type, title, message, metadata, is_read, created_at, dedup_key
        ) VALUES (
          admin_record.id,
          'system',
          'Yeni ' || role_title || ' Kaydı (E-posta Doğrulandı): ' || company_name,
          formatted_date || ' tarihinde yeni bir ' || role_title || ' e-postasını doğruladı ve onay bekliyor. Şirket/İsim: ' || company_name || ', E-posta: ' || NEW.email || '. İncelemek için tıklayın.',
          jsonb_build_object('link', '/admin/users?role=' || user_profile.role || '&status=pending', 'user_id', NEW.id, 'role', user_profile.role),
          false,
          now(),
          'admin_new_registration:' || NEW.id::text
        )
        ON CONFLICT (recipient_id, dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------
-- 5. Bildirim sistemi sağlık kontrolü
--    Sadece service_role çalıştırabilir; /api/admin/diagnostics/notifications
--    üzerinden yalnızca giriş yapmış admin/moderator kullanıcılar tarafından
--    tetiklenir (yetkilendirme uygulama katmanında yapılır).
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_notification_healthcheck()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notif_table_exists BOOLEAN;
  org_table_exists BOOLEAN;
  dedup_column_exists BOOLEAN;
  trigger_new_role_exists BOOLEAN;
  trigger_email_verified_exists BOOLEAN;
  owner_unique_exists BOOLEAN;
  admin_count INT;
  pending_count INT;
  recent_admin_notif_count INT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) INTO notif_table_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'organizations'
  ) INTO org_table_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'dedup_key'
  ) INTO dedup_column_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_admins_on_new_employer_or_faculty'
  ) INTO trigger_new_role_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_admins_on_email_verified'
  ) INTO trigger_email_verified_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uniq_organizations_owner_id'
  ) INTO owner_unique_exists;

  SELECT count(*) INTO admin_count FROM public.profiles WHERE role IN ('admin', 'moderator');
  SELECT count(*) INTO pending_count FROM public.profiles WHERE role IN ('employer', 'faculty') AND is_active = false;

  IF notif_table_exists THEN
    EXECUTE 'SELECT count(*) FROM public.notifications WHERE type = ''system'' AND created_at > now() - interval ''30 days'''
      INTO recent_admin_notif_count;
  ELSE
    recent_admin_notif_count := 0;
  END IF;

  RETURN jsonb_build_object(
    'notifications_table_exists', notif_table_exists,
    'organizations_table_exists', org_table_exists,
    'dedup_key_column_exists', dedup_column_exists,
    'trigger_new_role_exists', trigger_new_role_exists,
    'trigger_email_verified_exists', trigger_email_verified_exists,
    'organizations_owner_unique_exists', owner_unique_exists,
    'admin_moderator_count', admin_count,
    'pending_employer_faculty_count', pending_count,
    'system_notifications_last_30_days', recent_admin_notif_count,
    'checked_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_notification_healthcheck() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_notification_healthcheck() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_notification_healthcheck() TO service_role;
