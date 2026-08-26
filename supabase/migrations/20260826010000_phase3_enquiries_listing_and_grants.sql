-- Phase 3 — customer enquiries, listing fields, and the grant that unblocks both.
--
-- Everything here is ADDITIVE: new nullable columns, new grants, new policies.
-- No table removal, no row deletion, no column removal, and no weakening of an
-- existing policy. Existing rows are untouched (public.enquiries is currently
-- empty; public.properties keeps every value it has).
--
-- Note for anyone extending this file: the CI "Migration & Schema Safety" job
-- greps every migration for destructive SQL and does not skip comments, so the
-- rollback notes at the bottom are deliberately written in prose.
--
-- Three independent production breaks are fixed:
--
--   1. public.enquiries has no user_id/email/status, but the Flutter client
--      writes all three. Every createEnquiry()/scheduleVisit() call fails with
--      PGRST204 and is swallowed by a `catch { return false; }`.
--
--   2. Every RLS policy on public.enquiries subqueries public.properties.owner_id,
--      but 20260730043953 re-granted only a column list to `authenticated` that
--      omits owner_id. Postgres therefore raises 42501 "permission denied for
--      table properties" while EVALUATING THE POLICY, so *all* authenticated
--      access to enquiries fails — customers and owners alike. Verified live.
--      Fixed with a SECURITY DEFINER helper rather than by widening the column
--      grant, so owner_id stays unreadable to clients.
--
--   3. public.properties is missing six columns the listing wizard writes, so
--      every owner submission fails with PGRST204. Verified live.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Ownership helper (SECURITY DEFINER)
--
-- Runs as the function owner, so a policy can test properties.owner_id without
-- `authenticated` holding SELECT on that column. search_path is pinned because
-- a SECURITY DEFINER function without one is a privilege-escalation vector.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.user_owns_property(p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = p_property_id
      AND p.owner_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.user_owns_property(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.user_owns_property(uuid) TO authenticated;

COMMENT ON FUNCTION public.user_owns_property(uuid) IS
  'Ownership test for RLS. SECURITY DEFINER so policies can read properties.owner_id without granting that column to authenticated.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. public.enquiries — the columns the client already writes
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- ON DELETE SET NULL, not CASCADE: an enquiry is a lead the property owner has
-- already acted on. Deleting the customer's auth row must not silently delete
-- the owner's business record.

ALTER TABLE public.enquiries
  DROP CONSTRAINT IF EXISTS enquiries_status_check;
ALTER TABLE public.enquiries
  ADD CONSTRAINT enquiries_status_check
  CHECK (status IN ('pending', 'contacted', 'visited', 'leased', 'closed', 'rejected'));

CREATE INDEX IF NOT EXISTS enquiries_user_created_idx
  ON public.enquiries (user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. public.enquiries — privileges
--
-- 20260730044133 did REVOKE ALL ... FROM authenticated, and 20260807120000
-- granted back only SELECT on six columns. Without an INSERT privilege no RLS
-- policy can let a customer file an enquiry, so the policy alone is not enough.
--
-- ip_address and user_agent stay ungranted: they are abuse-tracking fields that
-- no client should read or write.
-- ─────────────────────────────────────────────────────────────────────────────

GRANT SELECT (id, property_id, user_id, name, phone, email, message, status, created_at)
  ON public.enquiries TO authenticated;

GRANT INSERT (property_id, user_id, name, phone, email, message)
  ON public.enquiries TO authenticated;

-- Deliberately NOT granted: UPDATE and DELETE. A customer cannot edit or
-- withdraw an enquiry, and cannot set `status` — that is the owner's and
-- moderation team's field, defaulted server-side to 'pending'.

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. public.enquiries — policies
--
-- Postgres OR-combines permissive policies, so the legacy
-- "No client access to enquiries" (USING false / WITH CHECK false) never
-- blocked anything once the owner policy landed. It is left in place
-- untouched; the policies below are what actually decide access.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Customers read their own enquiries" ON public.enquiries;
CREATE POLICY "Customers read their own enquiries"
  ON public.enquiries FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

-- user_id IS NOT NULL matters: the table's pre-existing rows are anonymous web
-- leads with a NULL user_id. Without the guard, a NULL = auth.uid() comparison
-- is NULL (not true) today, but the explicit test keeps that intent readable
-- and survives anyone later marking the column NOT NULL with a backfill.

DROP POLICY IF EXISTS "Customers record their own enquiries" ON public.enquiries;
CREATE POLICY "Customers record their own enquiries"
  ON public.enquiries FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- WITH CHECK (user_id = auth.uid()) is the real defence against the client
-- posting somebody else's id. The Dart layer also stops sending a caller-
-- supplied id, but this is the boundary that counts.

-- Rewritten to use the helper so policy evaluation no longer needs a column
-- grant on properties.owner_id. Semantics are unchanged.
DROP POLICY IF EXISTS "Owners read enquiries on their listings" ON public.enquiries;
CREATE POLICY "Owners read enquiries on their listings"
  ON public.enquiries FOR SELECT TO authenticated
  USING (public.user_owns_property(property_id));

DROP POLICY IF EXISTS "Owners update enquiry status on their listings" ON public.enquiries;
CREATE POLICY "Owners update enquiry status on their listings"
  ON public.enquiries FOR UPDATE TO authenticated
  USING (public.user_owns_property(property_id))
  WITH CHECK (public.user_owns_property(property_id));

GRANT UPDATE (status) ON public.enquiries TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Admin / moderator / support access — PRESERVED
--
-- Recreated verbatim from 20260817130000 except that the moderator scope test
-- now goes through a SECURITY DEFINER helper for the same 42501 reason. Admin
-- reach is unchanged: every enquiry, no scoping.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.property_in_employee_regions(p_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = p_property_id
      AND (
        p.region = ANY(public.get_employee_regions())
        OR array_length(public.get_employee_regions(), 1) IS NULL
      )
  );
$$;

REVOKE ALL ON FUNCTION public.property_in_employee_regions(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.property_in_employee_regions(uuid) TO authenticated;

DROP POLICY IF EXISTS "Admins read all enquiries" ON public.enquiries;
CREATE POLICY "Admins read all enquiries"
  ON public.enquiries FOR SELECT TO authenticated
  USING (public.get_employee_role() = 'admin');

DROP POLICY IF EXISTS "Moderators and Support read scoped enquiries" ON public.enquiries;
CREATE POLICY "Moderators and Support read scoped enquiries"
  ON public.enquiries FOR SELECT TO authenticated
  USING (
    public.get_employee_role() IN ('moderator', 'support')
    AND public.property_in_employee_regions(property_id)
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. public.properties — the six columns the listing wizard writes
--
-- All nullable, no defaults, no backfill: existing rows read NULL, which is
-- exactly "this listing never captured that field".
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS amenities text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS preferred_tenant text[];
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS food_preference text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS floor_number text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_rooms integer;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS maintenance_included boolean;

-- floor_number is text, not integer: the wizard collects "Ground", "1st",
-- "Basement". The existing integer exact_floor column is left alone.

-- The owner INSERT/UPDATE grant from 20260807120000 is table-wide
-- (GRANT INSERT, UPDATE, DELETE ON public.properties TO authenticated), so the
-- new columns are writable by owners with no further grant. Readers go through
-- the column-scoped SELECT grant, so extend it for the public-facing fields
-- only — floor_number, total_rooms and maintenance_included stay internal until
-- a screen needs them.

GRANT SELECT (amenities, preferred_tenant, food_preference)
  ON public.properties TO anon;
GRANT SELECT (amenities, preferred_tenant, food_preference)
  ON public.properties TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. properties.region for the admin enquiries embed
--
-- getAdminEnquiries() embeds `properties (title, city, region)`. A PostgREST
-- embed is a real column read, so a SECURITY DEFINER policy helper does not
-- cover it — the grant is required. Verified live: the embed returns 42501
-- today. title and city are already granted; region is not.
--
-- region is a market area ("Hyderabad", "Bengaluru"), not personal data, and it
-- is already inferable from the granted `city` column.
-- ─────────────────────────────────────────────────────────────────────────────

GRANT SELECT (region) ON public.properties TO authenticated;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK
--
-- The policy and function changes revert cleanly. The ADD COLUMNs are the only
-- part worth thinking about: dropping them after the app has written data
-- destroys that data, so rollback should normally stop at the policies.
--
--   BEGIN;
--   DROP POLICY IF EXISTS "Customers read their own enquiries"   ON public.enquiries;
--   DROP POLICY IF EXISTS "Customers record their own enquiries" ON public.enquiries;
--   DROP POLICY IF EXISTS "Owners update enquiry status on their listings" ON public.enquiries;
--   REVOKE INSERT ON public.enquiries FROM authenticated;
--   -- restore the inline owner policy from 20260807120000, which needs
--   -- GRANT SELECT (owner_id) ON public.properties TO authenticated to work:
--   DROP POLICY IF EXISTS "Owners read enquiries on their listings" ON public.enquiries;
--   CREATE POLICY "Owners read enquiries on their listings"
--     ON public.enquiries FOR SELECT TO authenticated
--     USING (EXISTS (SELECT 1 FROM public.properties p
--                    WHERE p.id = enquiries.property_id AND p.owner_id = auth.uid()));
--   COMMIT;
--
-- Column rollback is DATA-DESTRUCTIVE and is deliberately not scripted here.
-- Removing the six new properties columns discards every listing detail written
-- since this migration ran, and removing the three enquiries columns discards
-- the ownership link that makes a customer's enquiries readable at all. If it
-- is ever genuinely required, write it as a separate, reviewed migration.
-- ─────────────────────────────────────────────────────────────────────────────
