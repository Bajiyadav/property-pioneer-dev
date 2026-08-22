-- Migration: 20260823000000_secure_live_activities_rls.sql
-- Description: Secure public.live_activities against unauthorized public/anonymous reads and modifications
-- Author: Seedha Properties Security Hardening (G10 Fix)

-- 1. Ensure RLS is active on public.live_activities
ALTER TABLE public.live_activities ENABLE ROW LEVEL SECURITY;

-- 2. Revoke broad read/write permissions from anon
REVOKE ALL ON public.live_activities FROM anon;

-- Keep only INSERT for anonymous visitor tracking/lead submission
GRANT INSERT ON public.live_activities TO anon;

-- Authenticated users can insert and select/update only what RLS allows
GRANT INSERT, SELECT, UPDATE ON public.live_activities TO authenticated;

-- Service role retains full system access
GRANT ALL ON public.live_activities TO service_role;

-- 3. Drop existing permissive and outdated policies
DROP POLICY IF EXISTS "Allow admin read live activities" ON public.live_activities;
DROP POLICY IF EXISTS "Admin and Area Agents Can View Live Activities" ON public.live_activities;
DROP POLICY IF EXISTS "Admins and agents view live activity" ON public.live_activities;
DROP POLICY IF EXISTS "Admins and agents update assigned live activity" ON public.live_activities;
DROP POLICY IF EXISTS "Allow public insert live activities" ON public.live_activities;
DROP POLICY IF EXISTS "Anyone can insert live activity" ON public.live_activities;
DROP POLICY IF EXISTS "live_activities_insert" ON public.live_activities;
DROP POLICY IF EXISTS "live_activities_select" ON public.live_activities;
DROP POLICY IF EXISTS "live_activities_update" ON public.live_activities;

-- 4. Recreate strict INSERT policy: anyone (anon + auth) can insert an activity record
CREATE POLICY "live_activities_insert" ON public.live_activities
  FOR INSERT
  WITH CHECK (true);

-- 5. Recreate strict SELECT policy:
--    - Admin and Agent roles can view activities for lead management
--    - Authenticated users can view only their own activity rows
CREATE POLICY "live_activities_select" ON public.live_activities
  FOR SELECT TO authenticated
  USING (
    public.caller_has_role('admin')
    OR public.caller_has_role('agent')
    OR user_id = auth.uid()
  );

-- 6. Recreate strict UPDATE policy:
--    - Admin and Agent roles can update activities
CREATE POLICY "live_activities_update" ON public.live_activities
  FOR UPDATE TO authenticated
  USING (
    public.caller_has_role('admin')
    OR public.caller_has_role('agent')
  )
  WITH CHECK (
    public.caller_has_role('admin')
    OR public.caller_has_role('agent')
  );
