-- ===========================================================================
-- P0: stop authenticated users writing their own authorization columns.
--
-- THE DEFECT (verified against the live database, not inferred)
--
--   `authenticated` holds a TABLE-WIDE UPDATE grant on public.profiles, which
--   covers every column, and the RLS policy "Users update their own profile"
--   permits a user to update their own row. Together, a signed-in customer can
--   write ANY column of their own profile.
--
--   Empirically confirmed with a zero-row-target PATCH (nothing was changed):
--     PATCH /rest/v1/profiles?id=eq.<nil-uuid>  {"role":"admin"}  -> 204, no error
--   and a self-row no-op write returned 204, so the row policy admits it.
--
--   The user-writable authorization columns are:
--     role, assigned_localities, agency_name, agent_status,
--     rera_id, is_verified_agent
--
--   Live impact today: `profiles.role` is trusted by the SELECT policy
--   "Admin and Area Agents Can View Live Activities" on public.live_activities,
--   so a customer could self-promote and read lead/visitor activity. And
--   `is_verified_agent` / `rera_id` are the agent trust signals — a user could
--   mark themselves a verified agent.
--
-- WHAT THIS MIGRATION DELIBERATELY DOES NOT DO
--
--   An earlier draft also created an UPDATE policy on public.properties, on the
--   assumption that 20260817140100's policy ("Agents can update properties in
--   assigned localities", which trusted profiles.role) was live. It is NOT:
--   pg_policies shows the properties policies are
--     Admins manage all properties        get_employee_role() = 'admin'
--     Moderators manage scoped properties get_employee_role() = 'moderator'
--     Owners manage their own listings    owner_id = auth.uid()
--   all of which derive authority from public.employee_access (staff-managed,
--   not user-writable) or from ownership. None reads profiles.role.
--
--   Creating that policy here would therefore GRANT agents a write capability
--   they do not currently have — widening access under the banner of a security
--   fix. It is left out. Property authorization is already sound.
--
--   `city` was also dropped from the grant list below: public.profiles has no
--   such column, and naming it would abort the whole migration.
-- ===========================================================================

-- 1. Replace the table-wide grant with a column-scoped one.
--
-- REVOKE must come first: a column-level GRANT does not narrow a table-level
-- one, so without this the broad grant simply continues to apply.
REVOKE UPDATE ON public.profiles FROM authenticated;

-- The complete set of self-service columns on this table. Everything omitted is
-- either identity (id), provenance (created_at) or authorization
-- (role, assigned_localities, agency_name, agent_status, rera_id,
-- is_verified_agent) and must be assigned by staff or the service role.
--
-- No application code writes public.profiles today — both call sites in
-- adminFunctions.ts are reads — so this removes no working behaviour.
GRANT UPDATE (full_name, phone, avatar_url, updated_at)
  ON public.profiles TO authenticated;

-- 2. A safe way for future policies to ask about the caller's role.
--
-- Zero-argument by design, like public.is_admin(): it can only answer a question
-- about the caller, never probe another user. That probing capability is why
-- EXECUTE on has_role(uuid, app_role) was revoked from `authenticated` in
-- 20260805070818, which also makes has_role unusable inside a policy evaluated
-- as `authenticated`.
--
-- Reads public.user_roles — the source session.ts calls authoritative, and the
-- one the account holder cannot write.
CREATE OR REPLACE FUNCTION public.caller_has_role(role_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = role_name
  )
$$;

REVOKE ALL ON FUNCTION public.caller_has_role(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.caller_has_role(text) TO authenticated, service_role;

-- 3. media_notes.
--
-- 20260817140100 declares it, but the live table has media_status and not
-- media_notes: that file was edited after it had already been applied, and an
-- applied migration never runs again. PropertyMediaModal writes media_notes on
-- every save, so admin moderation notes have been failing silently.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS media_notes TEXT;
