-- ============================================================
-- 019: Yeni İşveren veya Akademisyen Kaydında Yöneticilere Bildirim
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_admins_on_new_employer_or_faculty()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  role_title TEXT;
  formatted_date TEXT;
  user_full_name TEXT;
BEGIN
  -- Sadece employer veya faculty rollerinde tetiklenir
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

    -- Tüm admin ve moderator rolündeki kullanıcılara bildirim gönder
    FOR admin_record IN
      SELECT id FROM public.profiles WHERE role IN ('admin', 'moderator')
    LOOP
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
        'Yeni ' || role_title || ' Kaydı: ' || user_full_name,
        formatted_date || ' tarihinde yeni bir ' || role_title || ' kayıt oldu. Ad Soyad: ' || user_full_name || ', E-posta: ' || NEW.edu_email || '. Detaylar için tıklayın.',
        jsonb_build_object('link', '/admin/users', 'user_id', NEW.id, 'role', NEW.role),
        false,
        now()
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı tanımla (INSERT ve ROLE değişikliği durumunda)
DROP TRIGGER IF EXISTS trg_notify_admins_on_new_employer_or_faculty ON public.profiles;

CREATE TRIGGER trg_notify_admins_on_new_employer_or_faculty
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role IN ('employer', 'faculty') AND (OLD IS NULL OR OLD.role IS DISTINCT FROM NEW.role))
  EXECUTE FUNCTION public.notify_admins_on_new_employer_or_faculty();
