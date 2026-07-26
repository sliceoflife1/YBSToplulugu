-- ============================================================
-- 023: Proje Kategorileri, Takım Arkadaşları ve Lisans Alanları
-- ============================================================

ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS team_members UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS license TEXT DEFAULT 'none';

CREATE INDEX IF NOT EXISTS idx_projects_project_type ON public.projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_team_members ON public.projects USING GIN(team_members);

-- Takım arkadaşı etiketini kendisi kaldırma fonksiyonu
CREATE OR REPLACE FUNCTION public.remove_self_from_project_team(project_id_val UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.projects
  SET team_members = array_remove(team_members, current_user_id)
  WHERE id = project_id_val
  AND current_user_id = ANY(team_members);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
