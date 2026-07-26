-- ============================================================
-- 022: E-posta Doğrulandığında Yöneticilere & Kullanıcıya Bildirim ve Organizasyon Senkronizasyonu
-- ============================================================

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
  -- Sadece email_confirmed_at NULL'dan geçerli bir tarihe değiştiğinde tetiklenir
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

      -- 1. İşveren ise organizasyon kaydını pending olarak aç (eğer yoksa)
      IF user_profile.role = 'employer' THEN
        INSERT INTO public.organizations (
          owner_id,
          name,
          type,
          description,
          website_url,
          contact_email,
          contact_phone,
          approval_status,
          is_active
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

      -- 2. Kullanıcının kendisine hoş geldin ve onay bilgilendirme bildirimi gönder
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE recipient_id = NEW.id
        AND type = 'system'
        AND title LIKE '%E-posta Adresiniz Doğrulandı%'
      ) THEN
        INSERT INTO public.notifications (
          recipient_id,
          type,
          title,
          message,
          metadata,
          is_read,
          created_at
        ) VALUES (
          NEW.id,
          'system',
          'E-posta Adresiniz Doğrulandı',
          'E-posta adresiniz başarıyla doğrulandı. Hesabınız ve başvuru detaylarınız şu an yönetici onayındadır. Onaylandığında bilgilendirileceksiniz.',
          jsonb_build_object('link', '/dashboard', 'role', user_profile.role),
          false,
          now()
        );
      END IF;

      -- 3. Tüm Admin ve Moderator rolündeki kullanıcılara bildirim gönder
      FOR admin_record IN
        SELECT id FROM public.profiles WHERE role IN ('admin', 'moderator')
      LOOP
        -- Mükerrer bildirimi önle
        IF NOT EXISTS (
          SELECT 1 FROM public.notifications
          WHERE recipient_id = admin_record.id
          AND metadata ->> 'user_id' = NEW.id::text
          AND type = 'system'
        ) THEN
          INSERT INTO public.notifications (
            recipient_id,
            type,
            title,
            message,
            metadata,
            is_read,
            created_at
          ) VALUES (
            admin_record.id,
            'system',
            'Yeni ' || role_title || ' Kaydı (E-posta Doğrulandı): ' || company_name,
            formatted_date || ' tarihinde yeni bir ' || role_title || ' e-postasını doğruladı ve onay bekliyor. Şirket/İsim: ' || company_name || ', E-posta: ' || NEW.email || '. İncelemek için tıklayın.',
            jsonb_build_object('link', '/admin/users?role=' || user_profile.role || '&status=pending', 'user_id', NEW.id, 'role', user_profile.role),
            false,
            now()
          );
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı auth.users tablosuna bağla
DROP TRIGGER IF EXISTS trg_notify_admins_on_email_verified ON auth.users;

CREATE TRIGGER trg_notify_admins_on_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_email_verified();
