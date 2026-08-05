REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;