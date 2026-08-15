-- ===========================================================================
-- Property Visits & Agent Leads Schema
--
-- Adds dedicated tables and RLS policies for:
--   1. property_visits (scheduled in-person & video tour appointments)
--   2. agent_leads (CRM lead management for agents)
-- ===========================================================================

-- ── 1. Property Visits
CREATE TABLE IF NOT EXISTS public.property_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_name text NOT NULL,
  visitor_phone text NOT NULL,
  visitor_email text,
  visit_type text NOT NULL DEFAULT 'in_person', -- 'in_person' | 'video'
  visit_date date NOT NULL,
  visit_time text NOT NULL DEFAULT '10:00 AM',
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'completed' | 'cancelled'
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

-- ── 2. Agent Leads
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
  stage text NOT NULL DEFAULT 'new', -- 'new' | 'contacted' | 'visit_scheduled' | 'negotiation' | 'closed' | 'lost'
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
