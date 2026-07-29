-- 038: Supabase Advisor Tarafından Tespit Edilen Güvenlik ve Performans İyileştirmeleri

-- 1. Unindexed Foreign Keys (Yabancı Anahtar İndeksleri)
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);
CREATE INDEX IF NOT EXISTS idx_organizations_approved_by ON public.organizations(approved_by) WHERE approved_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subreddits_created_by ON public.subreddits(created_by);
CREATE INDEX IF NOT EXISTS idx_upvotes_user_id ON public.upvotes(user_id);
CREATE INDEX IF NOT EXISTS idx_yearbook_entries_recipient_id ON public.yearbook_entries(recipient_id);
CREATE INDEX IF NOT EXISTS idx_yearbook_profiles_department_id ON public.yearbook_profiles(department_id);

-- 2. Mutable Function Search Paths & SECURITY DEFINER Yetki Kısıtlamaları

-- handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;

-- cleanup_expired_activity_logs
ALTER FUNCTION public.cleanup_expired_activity_logs() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_activity_logs() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_activity_logs() FROM authenticated;

-- get_user_role
ALTER FUNCTION public.get_user_role() SET search_path = public;

-- update_upvote_count
ALTER FUNCTION public.update_upvote_count() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.update_upvote_count() FROM anon;

-- update_comment_count
ALTER FUNCTION public.update_comment_count() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.update_comment_count() FROM anon;

-- update_project_upvote_count
ALTER FUNCTION public.update_project_upvote_count() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.update_project_upvote_count() FROM anon;

-- update_project_comment_count
ALTER FUNCTION public.update_project_comment_count() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.update_project_comment_count() FROM anon;

-- remove_self_from_project_team
ALTER FUNCTION public.remove_self_from_project_team(uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.remove_self_from_project_team(uuid) FROM anon;

-- 3. RLS Performans Optimizasyonları ((select auth.uid()) kalıbı)
-- activity_logs policy
DROP POLICY IF EXISTS "Admins can read all logs" ON public.activity_logs;
CREATE POLICY "Admins can read all logs" ON public.activity_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );
