-- Lets a site visit be assigned to an agent, which the agent console already
-- assumes it can filter on.
--
-- Additive only: one nullable column and its index. No existing column, row or
-- policy is touched.
--
-- WHY
-- 20260818140100 recreated public.property_visits after it was found missing in
-- production, but gave it a different column vocabulary from the code that
-- queries it. agent.server.ts:listAgentVisits() filters `.eq("agent_id", ...)`
-- against a table that has no agent_id, so the query returns 42703 and the
-- function throws — the agent console's visit list has been failing outright,
-- not merely returning empty.
--
-- The date/slot half of that mismatch is fixed in code (the real columns are
-- visit_date and visit_time). The assignment half cannot be: there is no
-- existing column that carries it, so it is added here.

BEGIN;

-- ON DELETE SET NULL: an unassigned visit is still a real visit the owner must
-- see. Removing an agent must not delete the visitor's request.
ALTER TABLE public.property_visits
  ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.property_visits.agent_id IS
  'Agent assigned to accompany this visit. NULL means unassigned.';

-- listAgentVisits() reads exactly this: one agent, newest first.
CREATE INDEX IF NOT EXISTS property_visits_agent_created_idx
  ON public.property_visits (agent_id, created_at DESC);

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK
--
-- Removing the column discards every visit-to-agent assignment made since this
-- ran. The index alone can be removed safely:
--
--   DROP INDEX IF EXISTS public.property_visits_agent_created_idx;
--
-- Removing the column itself is data-destructive and is deliberately not
-- scripted here.
-- ─────────────────────────────────────────────────────────────────────────────
