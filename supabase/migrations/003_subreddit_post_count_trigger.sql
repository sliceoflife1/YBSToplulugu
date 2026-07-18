-- =====================================================
-- Subreddit Gönderi Sayısı (post_count) Güncelleme Tetikleyicisi
-- Oluşturma Tarihi: 2026-07-17
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_subreddit_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.subreddits 
    SET post_count = post_count + 1 
    WHERE id = NEW.subreddit_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.subreddits 
    SET post_count = GREATEST(0, post_count - 1) 
    WHERE id = OLD.subreddit_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tetikleyiciyi oluştur (eğer varsa önce sil)
DROP TRIGGER IF EXISTS trg_subreddit_post_count ON public.posts;

CREATE TRIGGER trg_subreddit_post_count
AFTER INSERT OR DELETE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.update_subreddit_post_count();

-- Mevcut gönderi sayılarını senkronize et
UPDATE public.subreddits s
SET post_count = (
  SELECT COUNT(*) 
  FROM public.posts p 
  WHERE p.subreddit_id = s.id
);
