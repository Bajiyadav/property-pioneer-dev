-- Tells a caller whether an account already exists for an email or phone.
--
-- This migration had never been applied to any environment when the grants
-- below were added, so nothing depended on the previous exposure.
--
-- Postgres grants EXECUTE on a new function to PUBLIC by default. Without the
-- REVOKE at the bottom, `anon` could call this through PostgREST and use it as
-- an account-enumeration oracle against auth.users — probing any email or phone
-- number and learning whether it is registered. Every other SECURITY DEFINER
-- function in this schema (is_admin, caller_has_role, user_owns_property) is
-- locked down the same way; this one was the exception.
--
-- Nothing calls this function yet: EnterprisePasswordForm deliberately reverted
-- to a single generic "Incorrect Email/Mobile or password" message. Whoever
-- reintroduces it should decide the exposure deliberately — and note that
-- distinguishing "no account" from "wrong password" is itself an enumeration
-- surface that the auth flows elsewhere in this codebase avoid on purpose.
CREATE OR REPLACE FUNCTION public.check_account_exists(search_email text, search_phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = search_email 
       OR (search_phone IS NOT NULL AND search_phone != '' AND phone = search_phone)
  ) INTO account_exists;
  
  RETURN account_exists;
END;
$$;

REVOKE ALL ON FUNCTION public.check_account_exists(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_account_exists(text, text) TO authenticated, service_role;
