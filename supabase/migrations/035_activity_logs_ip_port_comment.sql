-- 035: activity_logs tablosu ip_address sütunu dokümantasyon güncellemesi
-- ip_address alanı artık "IP:PORT" formatında (ör. 198.51.100.24:443 veya [2001:db8::1]:443) saklanmaktadır.
-- created_at alanı TIMESTAMPTZ olarak UTC standardında tutulmaktadır.

COMMENT ON COLUMN public.activity_logs.ip_address IS 'İstemci IP adresi ve port numarası (IP:PORT formatında)';
COMMENT ON COLUMN public.activity_logs.created_at IS 'İşlem zamanı (UTC timestamptz)';
