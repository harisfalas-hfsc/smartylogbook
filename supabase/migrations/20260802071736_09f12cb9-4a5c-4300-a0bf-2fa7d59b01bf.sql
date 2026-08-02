REVOKE EXECUTE ON FUNCTION public.purge_expired_trash() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_trash() TO service_role;