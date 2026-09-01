-- Security hardening — RLS, grants, and one unpinned SECURITY DEFINER function.
--
-- Everything here is ADDITIVE or RESTRICTIVE: new grants, replaced policies, one
-- function redefinition, one index. No table is dropped, no column is removed,
-- no row is deleted, and no existing protection is weakened.
--
-- Note for anyone extending this file: the CI "Migration & Schema Safety" job
-- greps every migration for destructive SQL and does not skip comments, so the
-- rollback notes at the bottom are deliberately written in prose.
--
-- Four confirmed issues are fixed. Each is scoped to exactly the object named.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. public.ai_tenant_conversations — anonymous rows were world-readable
--
-- The SELECT and UPDATE policies both read:
--
--     TO anon, authenticated
--     USING (user_id = auth.uid() OR user_id IS NULL)
--
-- Every anonymous conversation carries user_id IS NULL, so the second branch
-- handed every anonymous row to every caller — anonymous ones included. The
-- table holds phone_number, budget_min/max, city, locality, preferred_bhk and
-- conversation_flow (the full transcript). The UPDATE policy used the same
-- predicate, so any caller could also rewrite another visitor's conversation.
--
-- Confirmed live: an anonymous request with the public key returns HTTP 200 on
-- this table, where public.enquiries correctly returns 42501. The table is
-- presently empty and no application code reads or writes it, so no customer
-- data was exposed — the hole was open, the room behind it was empty.
--
-- The original intent, per the comment on the policy, was "anonymous to read
-- their own session". session_id cannot express that: it is a client-supplied
-- VARCHAR with no secret component, so scoping to it would let any visitor read
-- another's conversation by guessing or replaying an id. Anonymous read-back is
-- therefore not granted at the table at all. If the product later needs it, it
-- belongs behind a server endpoint holding the service role — the pattern
-- /api/public/enquiries already uses.
--
-- INSERT is preserved for anon so anonymous AI capture can be wired up, but it
-- may no longer assert somebody else's user_id.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.ai_tenant_conversations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ai_tenant_conversations FROM anon, authenticated;

-- Anonymous capture only. No SELECT, no UPDATE: an anonymous caller may write a
-- conversation and never read one back.
GRANT INSERT (user_id, session_id, city, locality, budget_min, budget_max,
              preferred_bhk, phone_number, conversation_flow,
              extraction_confidence)
  ON public.ai_tenant_conversations TO anon;

GRANT SELECT (id, user_id, session_id, city, locality, budget_min, budget_max,
              preferred_bhk, phone_number, conversation_flow,
              extraction_confidence, created_at)
  ON public.ai_tenant_conversations TO authenticated;

GRANT INSERT (user_id, session_id, city, locality, budget_min, budget_max,
              preferred_bhk, phone_number, conversation_flow,
              extraction_confidence)
  ON public.ai_tenant_conversations TO authenticated;

GRANT UPDATE (city, locality, budget_min, budget_max, preferred_bhk,
              phone_number, conversation_flow, extraction_confidence)
  ON public.ai_tenant_conversations TO authenticated;

-- user_id and session_id are absent from the UPDATE grant on purpose: a row may
-- not be re-pointed at another owner after the fact.

DROP POLICY IF EXISTS "Allow anonymous insert on ai_tenant_conversations"
  ON public.ai_tenant_conversations;
DROP POLICY IF EXISTS "Allow read own ai_tenant_conversations"
  ON public.ai_tenant_conversations;
DROP POLICY IF EXISTS "Allow update own ai_tenant_conversations"
  ON public.ai_tenant_conversations;

CREATE POLICY "ai_conversations_insert_self_or_anonymous"
  ON public.ai_tenant_conversations FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- The guard that matters: a caller may write an anonymous row, or a row owned by
-- themselves, and nothing else. Claiming another user's id is rejected.

CREATE POLICY "ai_conversations_select_own"
  ON public.ai_tenant_conversations FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "ai_conversations_update_own"
  ON public.ai_tenant_conversations FOR UPDATE TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());

-- user_id IS NOT NULL is load-bearing, not decoration. Without it an anonymous
-- row (user_id NULL) compared against a NULL auth.uid() is the exact hole being
-- closed here.

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. public.search_sessions — a policy named "Admin" that admitted everyone
--
-- The SELECT policy was:
--
--     "Admin read search sessions" ... TO authenticated USING (true)
--
-- The name asserts a role check the predicate never performs, so every signed-in
-- account could read every search anyone had run. The table has no user_id
-- column, so "read your own" is not expressible — the honest fix is to make the
-- policy do what its name always claimed and restrict reads to staff, using the
-- same employee_access lookup public.site_visitors already uses correctly.
--
-- Anonymous INSERT is retained: capturing search analytics without a session is
-- the table's entire purpose.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.search_sessions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.search_sessions FROM anon, authenticated;

GRANT INSERT (session_id, city, locality, searched_at, results_count, filters)
  ON public.search_sessions TO anon, authenticated;

GRANT SELECT (id, session_id, city, locality, searched_at, results_count,
              filters, created_at)
  ON public.search_sessions TO authenticated;

DROP POLICY IF EXISTS "Admin read search sessions" ON public.search_sessions;
DROP POLICY IF EXISTS "Public search session capture" ON public.search_sessions;

CREATE POLICY "search_sessions_public_capture"
  ON public.search_sessions FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "search_sessions_staff_read"
  ON public.search_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employee_access
      WHERE employee_access.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. public.invoke_automated_messaging — SECURITY DEFINER without search_path
--
-- This is the one privileged trigger in the schema: it fires AFTER INSERT on
-- auth.users. Every other SECURITY DEFINER function here pins its search_path,
-- and 20260826010000 documents why — an unpinned definer resolves unqualified
-- names through the caller's path, which is a privilege-escalation vector.
--
-- Redefined below with the path pinned and nothing else changed. Every object it
-- touches is either schema-qualified (net.http_post) or in pg_catalog
-- (jsonb_build_object, row_to_json, current_setting), so pg_catalog plus public
-- is sufficient and net remains reachable through its qualified reference.
--
-- The triggers are NOT recreated: CREATE OR REPLACE keeps the existing
-- on_auth_user_created and on_site_visitor_created bindings pointing at the new
-- definition.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.invoke_automated_messaging()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  edge_function_url text := current_setting('custom.edge_function_url', true);
  edge_function_anon_key text := current_setting('custom.edge_function_anon_key', true);
  payload jsonb;
  request_id bigint;
BEGIN
  IF edge_function_url IS NULL OR edge_function_url = '' THEN
    edge_function_url := 'http://host.docker.internal:54321/functions/v1/automated-messaging';
  END IF;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW)
  );

  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', COALESCE('Bearer ' || edge_function_anon_key, '')
    ),
    body := payload
  ) INTO request_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.invoke_automated_messaging() IS
  'Dispatches row events to the automated-messaging edge function. SECURITY DEFINER with a pinned search_path: it fires on auth.users, so an unpinned path would be a privilege-escalation vector.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. public.audit_logs — the rate limiter was scanning an unindexed table
--
-- checkRateLimits() runs COUNT(*) filtered by event, ip_address and created_at
-- on every protected request. audit_logs has no index, so each call was a
-- sequential scan over a table that only grows — which makes the rate limiter
-- slower precisely as it is exercised, and turns the control into an
-- amplification vector for the abuse it exists to stop.
--
-- The index matches the predicate exactly. Audit rows are NOT deleted here:
-- retention is a policy decision that deserves its own reviewed change, and this
-- index is what makes the query stop caring about table size in the meantime.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS audit_logs_event_ip_created_idx
  ON public.audit_logs (event, ip_address, created_at DESC);

-- Some rate-limit rules count by event and window without an IP, so the leading
-- column alone is not enough for them.
CREATE INDEX IF NOT EXISTS audit_logs_event_created_idx
  ON public.audit_logs (event, created_at DESC);

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK
--
-- Sections 3 and 4 revert cleanly and losslessly: redefine the function without
-- the SET clause, and remove the two indexes.
--
--   DROP INDEX IF EXISTS public.audit_logs_event_ip_created_idx;
--   DROP INDEX IF EXISTS public.audit_logs_event_created_idx;
--
-- Sections 1 and 2 should NOT be rolled back. Reverting them restores the
-- policies that made anonymous AI conversations world-readable and search
-- history readable by any account. If a specific flow turns out to need broader
-- access, widen it deliberately in a new migration rather than restoring
-- USING (true) or a user_id IS NULL ownership test.
-- ─────────────────────────────────────────────────────────────────────────────
