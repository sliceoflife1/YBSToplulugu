-- 043_add_yearbook_notification_type.sql
-- notifications tablosundaki type kısıtlamasını kaldırarak / güncelleyerek 'yearbook_entry' bildirim türünü destekler hale getirir.

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
