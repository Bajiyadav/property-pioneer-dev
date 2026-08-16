-- Close self-service role escalation at sign-up.
--
-- `handle_new_user()` inserted into public.user_roles using the role supplied
-- by the caller:
--
--     COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'role',''), 'customer')::app_role
--
-- `raw_user_meta_data` is whatever the client passed to `auth.signUp()`. It is
-- attacker-controlled and was never checked against an allowlist, so an
-- unauthenticated request could grant itself any value of public.app_role —
-- including 'admin' — directly in the authoritative roles table. Verified
-- against this project: a public sign-up requesting role 'agent' produced
-- user_roles = ['agent'] for that account.
--
-- Self-registration now always yields 'customer'. Every other role is granted
-- deliberately, by an admin or a service-role process, never by the person
-- being granted it. The persona a user picks is still recorded in
-- user_metadata for onboarding/analytics, but it no longer decides authority.
--
-- Additive and idempotent: replaces one function body, changes no table, drops
-- nothing, and does not touch existing grants.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'phone')
  ON CONFLICT (id) DO NOTHING;

  -- Hard-coded. Deliberately ignores raw_user_meta_data ->> 'role': the value
  -- is client-supplied and must never decide authorization.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN others THEN
  RETURN NEW;  -- never block sign-up on profile bookkeeping
END $$;

-- Defence in depth: even a future code path that tries to write an elevated
-- role on behalf of the signer-up cannot do so through the client roles, which
-- hold SELECT only. Re-asserted here so the guarantee travels with this file.
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;
