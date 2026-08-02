-- 044_fix_job_listings_grants_and_reload.sql
-- job_listings ve job_applications tablolarına yetkileri tanımlar ve PostgREST şema önbelleğini (schema cache) yeniler.

GRANT ALL ON TABLE public.job_listings TO authenticated, service_role;
GRANT SELECT ON TABLE public.job_listings TO anon;

GRANT ALL ON TABLE public.job_applications TO authenticated, service_role;
GRANT SELECT ON TABLE public.job_applications TO anon;

-- PostgREST şema önbelleğini (schema cache) yenile
NOTIFY pgrst, 'reload schema';
