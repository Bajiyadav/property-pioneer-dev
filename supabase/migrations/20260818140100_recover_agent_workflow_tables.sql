-- ===========================================================================
-- Recovers three tables that the application queries but which were never
-- created in production.
--
-- WHY THIS EXISTS
-- Same root cause as 20260818140000: these were authored under
-- `supabase/migrations/properties/` and `supabase/migrations/users/`, which the
-- Supabase CLI does not read. Verified against the live database — all three
-- returned PGRST205 (table absent from the schema cache):
--   * property_visits    — queried by agent.server.ts:112
--   * agent_leads        — queried by agent.server.ts:79
--   * agent_applications — INSERTed by routes/agents.tsx:130 and read/updated
--                          by AdminDashboardPage.tsx:196,210
--
-- The agent_applications gap was user-visible: the public "become an agent"
-- form swallowed the failed insert into a console.warn and still showed
-- "Application submitted successfully!", so every applicant was told their
-- submission worked while nothing was stored. The table is created here; the
-- false success is fixed in routes/agents.tsx.
-- ===========================================================================

-- ── 0. Admin predicate
--
-- The obvious choice, public.has_role(uuid, app_role), cannot be used: migration
-- authentication/20260805070818 REVOKEs EXECUTE on it from `authenticated`,
-- leaving only service_role. An RLS policy is evaluated as the calling role, so
-- a policy calling has_role() would fail for exactly the admins it is meant to
-- admit. Nor can the policy sub-select from public.user_roles directly — that
-- table has RLS enabled, so the sub-select is itself filtered.
--
-- SECURITY DEFINER resolves both. Taking NO arguments is deliberate: it can only
-- ever answer "is the caller an admin", never "is some other user an admin",
-- which is the probing capability that got has_role revoked in the first place.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ── 1. Property visits (from properties/20260816000000)
CREATE TABLE IF NOT EXISTS public.property_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_name text NOT NULL,
  visitor_phone text NOT NULL,
  visitor_email text,
  visit_type text NOT NULL DEFAULT 'in_person',
  visit_date date NOT NULL,
  visit_time text NOT NULL DEFAULT '10:00 AM',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_visits ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.property_visits TO authenticated;
GRANT INSERT ON public.property_visits TO anon;
GRANT ALL ON public.property_visits TO service_role;

DROP POLICY IF EXISTS "Visitors view their own scheduled visits" ON public.property_visits;
CREATE POLICY "Visitors view their own scheduled visits"
  ON public.property_visits FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners view visits for their listings" ON public.property_visits;
CREATE POLICY "Owners view visits for their listings"
  ON public.property_visits FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_visits.property_id AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can request a property visit" ON public.property_visits;
CREATE POLICY "Anyone can request a property visit"
  ON public.property_visits FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS property_visits_property_id_idx ON public.property_visits (property_id);
CREATE INDEX IF NOT EXISTS property_visits_user_id_idx ON public.property_visits (user_id);
CREATE INDEX IF NOT EXISTS property_visits_visit_date_idx ON public.property_visits (visit_date);

-- ── 2. Agent leads (from properties/20260816000000)
CREATE TABLE IF NOT EXISTS public.agent_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_email text,
  budget_min numeric,
  budget_max numeric,
  preferred_locality text,
  stage text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'web_enquiry',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_leads ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_leads TO authenticated;
GRANT ALL ON public.agent_leads TO service_role;

DROP POLICY IF EXISTS "Agents manage their assigned leads" ON public.agent_leads;
CREATE POLICY "Agents manage their assigned leads"
  ON public.agent_leads FOR ALL TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE INDEX IF NOT EXISTS agent_leads_agent_id_idx ON public.agent_leads (agent_id);
CREATE INDEX IF NOT EXISTS agent_leads_stage_idx ON public.agent_leads (stage);

-- ── 3. Agent applications (from users/20260816010000)
CREATE TABLE IF NOT EXISTS public.agent_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL DEFAULT 'Hyderabad',
  experience_years text NOT NULL,
  preferred_areas text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{}',
  message text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_applications_status ON public.agent_applications (status);
CREATE INDEX IF NOT EXISTS idx_agent_applications_created_at ON public.agent_applications (created_at DESC);

ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;

-- The original granted nothing at all. RLS policies do not substitute for table
-- privileges, so the form would have failed with 42501 even once the table
-- existed. anon needs INSERT because the form accepts logged-out applicants
-- (routes/agents.tsx sends user_id: null for them).
GRANT INSERT ON public.agent_applications TO anon;
GRANT SELECT, INSERT, UPDATE ON public.agent_applications TO authenticated;
GRANT ALL ON public.agent_applications TO service_role;

DROP POLICY IF EXISTS "Anyone can submit an agent application" ON public.agent_applications;
CREATE POLICY "Anyone can submit an agent application"
  ON public.agent_applications FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own application" ON public.agent_applications;
CREATE POLICY "Users can view own application"
  ON public.agent_applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'email') = email);

DROP POLICY IF EXISTS "Admins have full access to agent applications" ON public.agent_applications;
CREATE POLICY "Admins have full access to agent applications"
  ON public.agent_applications FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
