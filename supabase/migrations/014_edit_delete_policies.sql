-- 1. Posts tablosunda düzenleme (update) politikasını güncelleme (yazar ve admin/mod yetkili)
DROP POLICY IF EXISTS "posts_update" ON public.posts;
CREATE POLICY "posts_update" ON public.posts
  FOR UPDATE TO authenticated
  USING (
    author_id = (select auth.uid())
    OR public.get_user_role() IN ('admin', 'moderator')
  );

-- 2. Comments tablosunda düzenleme politikasını güncelleme
DROP POLICY IF EXISTS "comments_update" ON public.comments;
CREATE POLICY "comments_update" ON public.comments
  FOR UPDATE TO authenticated
  USING (
    author_id = (select auth.uid())
    OR public.get_user_role() IN ('admin', 'moderator')
  );

-- 3. Projects tablosunda düzenleme politikasını güncelleme
DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.get_user_role() IN ('admin', 'moderator')
  );

-- 4. Projects tablosunda silme (delete) politikasını güncelleme
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.get_user_role() IN ('admin', 'moderator')
  );

-- 5. Project Comments tablosunda düzenleme politikasını güncelleme
DROP POLICY IF EXISTS "project_comments_update" ON public.project_comments;
CREATE POLICY "project_comments_update" ON public.project_comments
  FOR UPDATE TO authenticated
  USING (
    author_id = (select auth.uid())
    OR public.get_user_role() IN ('admin', 'moderator')
  );
