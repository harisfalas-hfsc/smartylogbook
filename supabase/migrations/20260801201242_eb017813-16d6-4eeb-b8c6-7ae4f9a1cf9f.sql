CREATE OR REPLACE FUNCTION public.is_admin_email(_email text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(coalesce(_email, '')) IN ('harisfalas@gmail.com', 'harisfallas@gmail.com')
$$;

REVOKE ALL ON FUNCTION public.is_admin_email(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_admin_for_allowlisted_email() FROM PUBLIC, anon, authenticated;