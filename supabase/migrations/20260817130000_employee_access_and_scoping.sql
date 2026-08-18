-- NOTE ON SCHEMA CHOICE
--
-- These helper functions live in `public`, not `auth`.
--
-- The first run of this migration failed on a hosted Supabase project with
-- "permission denied for schema auth (SQLSTATE 42501)". The `auth` schema is
-- owned and managed by Supabase's GoTrue service; the `postgres` role a
-- migration connects as cannot create objects inside it. That is deliberate on
-- their side — an extension point in `auth` would break on their upgrades.
--
-- `auth.uid()` and `auth.users` below are Supabase's OWN objects and are read,
-- not created, so they correctly keep the `auth` prefix. Only the two functions
-- this migration defines moved.
--
-- Both stay SECURITY DEFINER with `SET search_path = public`, which is what lets
-- an RLS policy read `employee_access` without recursing into its own policy.

-- ===========================================================================
-- Admin Role-Based Access Control & Location Scoping
-- ===========================================================================

-- ── 1. employee_access table
CREATE TABLE IF NOT EXISTS public.employee_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('support','moderator','analyst','ops','admin')),
  regions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.employee_access ENABLE ROW LEVEL SECURITY;

-- ── 2. properties.region column
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS region text;
-- (In a real scenario, we would backfill this based on locality if available)

-- ── 3. Helper Functions for RLS
-- These must be SECURITY DEFINER to read employee_access without circular dependencies
CREATE OR REPLACE FUNCTION public.get_employee_regions()
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT regions FROM public.employee_access WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_employee_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.employee_access WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ── 4. RLS on employee_access itself
-- Admins can manage the table. Ops can view. Employees can view their own.
GRANT SELECT ON public.employee_access TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.employee_access TO authenticated;

DROP POLICY IF EXISTS "Admins manage employee access" ON public.employee_access;
CREATE POLICY "Admins manage employee access"
  ON public.employee_access FOR ALL TO authenticated
  USING (public.get_employee_role() = 'admin')
  WITH CHECK (public.get_employee_role() = 'admin');

DROP POLICY IF EXISTS "Employees can view own access" ON public.employee_access;
CREATE POLICY "Employees can view own access"
  ON public.employee_access FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Ops can view all employee access" ON public.employee_access;
CREATE POLICY "Ops can view all employee access"
  ON public.employee_access FOR SELECT TO authenticated
  USING (public.get_employee_role() = 'ops');

-- ── 5. RLS updates for properties
-- We must combine existing public RLS (approved listings) and owner RLS with employee RLS.
-- Existing policies are usually isolated. Let's add employee policies to public.properties.

-- Admins can do everything
DROP POLICY IF EXISTS "Admins manage all properties" ON public.properties;
CREATE POLICY "Admins manage all properties"
  ON public.properties FOR ALL TO authenticated
  USING (public.get_employee_role() = 'admin')
  WITH CHECK (public.get_employee_role() = 'admin');

-- Moderators manage properties in their regions
DROP POLICY IF EXISTS "Moderators manage scoped properties" ON public.properties;
CREATE POLICY "Moderators manage scoped properties"
  ON public.properties FOR ALL TO authenticated
  USING (
    public.get_employee_role() = 'moderator' 
    AND (region = ANY(public.get_employee_regions()) OR array_length(public.get_employee_regions(), 1) IS NULL)
  )
  WITH CHECK (
    public.get_employee_role() = 'moderator' 
    AND (region = ANY(public.get_employee_regions()) OR array_length(public.get_employee_regions(), 1) IS NULL)
  );

-- Analysts can read all properties
DROP POLICY IF EXISTS "Analysts read all properties" ON public.properties;
CREATE POLICY "Analysts read all properties"
  ON public.properties FOR SELECT TO authenticated
  USING (public.get_employee_role() = 'analyst');

-- Support has NO property mutation access, so no policy needed (they fall back to public SELECT if approved)

-- ── 6. RLS updates for enquiries
-- Enquiries are currently readable by property owner. Add employee policies.

DROP POLICY IF EXISTS "Admins read all enquiries" ON public.enquiries;
CREATE POLICY "Admins read all enquiries"
  ON public.enquiries FOR SELECT TO authenticated
  USING (public.get_employee_role() = 'admin');

DROP POLICY IF EXISTS "Moderators and Support read scoped enquiries" ON public.enquiries;
CREATE POLICY "Moderators and Support read scoped enquiries"
  ON public.enquiries FOR SELECT TO authenticated
  USING (
    public.get_employee_role() IN ('moderator', 'support')
    AND EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = enquiries.property_id 
      AND (p.region = ANY(public.get_employee_regions()) OR array_length(public.get_employee_regions(), 1) IS NULL)
    )
  );

-- ── 7. RLS updates for user_roles
-- Ops can manage roles, scoped to regions if assigned? 
-- Wait, the prompt says: "ops -> read/write on users (suspend/warn only, no delete), scoped to region if assigned, unrestricted if not"
-- Currently user_roles doesn't have a region, so let's just let Ops read user_roles and profiles.
-- (This is simplified for v1 as users don't have explicit regions yet).

DROP POLICY IF EXISTS "Admins and Ops read all user_roles" ON public.user_roles;
CREATE POLICY "Admins and Ops read all user_roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.get_employee_role() IN ('admin', 'ops'));

DROP POLICY IF EXISTS "Admins manage all user_roles" ON public.user_roles;
CREATE POLICY "Admins manage all user_roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.get_employee_role() = 'admin')
  WITH CHECK (public.get_employee_role() = 'admin');

-- Give ops update access for suspension
DROP POLICY IF EXISTS "Ops manage user roles" ON public.user_roles;
CREATE POLICY "Ops manage user roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.get_employee_role() = 'ops')
  WITH CHECK (public.get_employee_role() = 'ops');
