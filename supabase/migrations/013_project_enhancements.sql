-- 1. Projects tablosuna yeni kolonların eklenmesi
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS media_urls TEXT[],
  ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- 2. Project Upvotes Tablosu
CREATE TABLE IF NOT EXISTS public.project_upvotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_upvotes_project_id ON public.project_upvotes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_upvotes_user_id ON public.project_upvotes(user_id);

-- 3. Project Comments Tablosu
CREATE TABLE IF NOT EXISTS public.project_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON public.project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_author_id ON public.project_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_parent_id ON public.project_comments(parent_id);

-- 4. Oylama Sayaç Tetikleyicisi (Upvote Count Trigger)
CREATE OR REPLACE FUNCTION public.update_project_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects SET upvote_count = upvote_count + 1 WHERE id = NEW.project_id;
    -- Oyu alan yazarın karma puanını artır
    UPDATE public.profiles SET karma_points = karma_points + 1
    WHERE id = (SELECT user_id FROM public.projects WHERE id = NEW.project_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects SET upvote_count = upvote_count - 1 WHERE id = OLD.project_id;
    -- Karma puanını düşür
    UPDATE public.profiles SET karma_points = karma_points - 1
    WHERE id = (SELECT user_id FROM public.projects WHERE id = OLD.project_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_project_upvote_count
AFTER INSERT OR DELETE ON public.project_upvotes
FOR EACH ROW EXECUTE FUNCTION public.update_project_upvote_count();

-- 5. Yorum Sayaç Tetikleyicisi (Comment Count Trigger)
CREATE OR REPLACE FUNCTION public.update_project_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects SET comment_count = comment_count + 1 WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects SET comment_count = comment_count - 1 WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_project_comment_count
AFTER INSERT OR DELETE ON public.project_comments
FOR EACH ROW EXECUTE FUNCTION public.update_project_comment_count();

-- 6. Row Level Security (RLS) Etkinleştirme
ALTER TABLE public.project_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- 7. Project Upvotes RLS Politikaları
CREATE POLICY "project_upvotes_select" ON public.project_upvotes
  FOR SELECT USING (true);

CREATE POLICY "project_upvotes_insert" ON public.project_upvotes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "project_upvotes_delete" ON public.project_upvotes
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- 8. Project Comments RLS Politikaları
CREATE POLICY "project_comments_select" ON public.project_comments
  FOR SELECT USING (true);

CREATE POLICY "project_comments_insert" ON public.project_comments
  FOR INSERT TO authenticated
  WITH CHECK (author_id = (select auth.uid()));

CREATE POLICY "project_comments_update" ON public.project_comments
  FOR UPDATE TO authenticated
  USING (author_id = (select auth.uid()));

CREATE POLICY "project_comments_delete" ON public.project_comments
  FOR DELETE TO authenticated
  USING (
    author_id = (select auth.uid())
    OR public.get_user_role() IN ('admin', 'moderator', 'faculty')
  );
