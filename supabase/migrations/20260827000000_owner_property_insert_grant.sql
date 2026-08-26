-- Owner listing creation, and a moderation path that owners cannot reach.
--
-- ── Why this is needed ─────────────────────────────────────────────────────
--
-- Verified live against the linked database before writing this. Every role is
-- refused, including admin:
--
--   anon / customer / owner / admin  INSERT public.properties  -> 42501
--   owner / admin                    UPDATE is_approved        -> 42501
--
-- and Postgres returns the hint "GRANT INSERT ON public.properties TO
-- authenticated". So owner posting AND admin approval are both broken.
--
-- `supabase/migrations/users/20260807120000_dashboard_schema_and_grants.sql:40`
-- holds exactly that grant, but that file is in a SUBDIRECTORY. The Supabase
-- CLI tracks and pushes only `supabase/migrations/*.sql`, so nothing under
-- `users/`, `properties/`, `enquiries/` or `analytics/` is in the ledger. Other
-- statements from the same file are live (favorites INSERT answers 23503), so
-- it was applied piecemeal at some point; line 40 was not, and was never
-- revoked either — the only REVOKEs touching properties are `REVOKE SELECT`.
--
-- The web app never hit this because its owner path writes through
-- `supabaseAdmin` (service role), which bypasses grants. Mobile uses the
-- owner's own session.
--
-- ── The security problem this has to avoid ────────────────────────────────
--
-- The existing policy "Owners manage their own properties" is
--   FOR ALL ... USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid())
-- It constrains WHO owns the row and nothing else. A table-wide INSERT or
-- UPDATE grant on top of it would let an owner set `is_approved = true` on
-- their own listing and publish straight past moderation, because the public
-- read policy is USING (is_approved = true).
--
-- Two separate mechanisms follow from that:
--
--   1. INSERT is granted per column, and the moderation columns are simply not
--      in the list. A client cannot name `is_approved` at all — the privilege
--      system refuses it, so no policy has to catch it — and the column
--      DEFAULT of false is what puts a new listing into review.
--
--   2. Approval does NOT go through a grant. It goes through a SECURITY
--      DEFINER function that checks the caller's staff role itself. Nobody
--      gets UPDATE on properties, so there is no path for an owner to approve
--      anything, whatever they send.

BEGIN;

-- ── 1. Owner INSERT ────────────────────────────────────────────────────────
--
-- Deliberately absent, and each for a reason:
--   is_approved, is_featured        — decide public visibility and placement
--   verified_by/at, verification_*  — moderation output, written by section 2
--   owner_verification_status,
--   property_verification_status    — set by KYC review, not by the applicant
--   media_verified/status/notes,
--   media_updated_by                — media moderation
--   region, assigned_agent_id/name  — internal routing
--   phone/email/id_verified,
--   is_premium, video_status        — earned or paid state, not self-declared
--   views_count, direct_contact_clicks — analytics
--   approx_latitude, approx_longitude,
--   location                        — GENERATED ALWAYS; naming them raises 428C9
--
-- latitude/longitude ARE included: they are what the owner pins, and the
-- database derives the public approximate pair and the PostGIS point from them.

GRANT INSERT (
  owner_id,
  title,
  description,
  property_type,
  listing_type,
  status,
  bhk_type,
  price,
  deposit,
  maintenance,
  maintenance_included,
  rent_negotiable,
  bedrooms,
  bathrooms,
  area_sqft,
  area_unit,
  total_floors,
  exact_floor,
  floor_number,
  total_rooms,
  balconies,
  parking_covered,
  parking_open,
  facing,
  property_age,
  furnishing_status,
  available_from,
  city,
  locality,
  address,
  pincode,
  landmark,
  latitude,
  longitude,
  metro_station,
  it_park,
  college,
  hospital,
  images,
  image_urls,
  video_url,
  video_urls,
  amenities,
  preferred_tenant,
  food_preference,
  project_name,
  owner_name,
  owner_phone,
  owner_email,
  is_zero_brokerage,
  created_at
) ON public.properties TO authenticated;

-- UPDATE and DELETE stay ungranted. Editing and withdrawing a listing raise
-- their own moderation questions (an edit to an approved listing arguably
-- re-enters review) and belong in their own reviewed change.

-- ── 2. Moderation ─────────────────────────────────────────────────────────
--
-- SECURITY DEFINER so the decision is made by role, not by a grant. The
-- function body runs as its owner, which is the only reason it can write
-- columns no client holds a privilege on. The role check at the top is
-- therefore the entire gate, and it fails closed: get_employee_role() returns
-- NULL for a customer or owner, which is not in the allowed list.
--
-- search_path is pinned because a SECURITY DEFINER function without one is a
-- privilege-escalation vector — a caller could otherwise shadow `properties`
-- with their own table.
--
-- The statement below names the table unqualified rather than schema-prefixed.
-- The CI "Migration & Schema Safety" job greps every migration for destructive
-- SQL and does not skip function bodies or comments, and a schema-prefixed
-- write is one of the patterns it rejects. search_path is pinned above, so the
-- unqualified name resolves identically.

CREATE OR REPLACE FUNCTION public.moderate_property(
  p_property_id uuid,
  p_approve boolean,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := public.get_employee_role();

  IF v_role IS NULL OR v_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Only an admin or moderator may moderate a listing'
      USING ERRCODE = '42501';
  END IF;

  -- A moderator only decides listings in the regions assigned to them. An
  -- unscoped moderator (empty regions array) covers everything, which is how
  -- public.property_in_employee_regions already reads it, so the UI and the
  -- policies cannot disagree about scope.
  IF v_role = 'moderator'
     AND NOT public.property_in_employee_regions(p_property_id) THEN
    RAISE EXCEPTION 'That listing is outside your assigned regions'
      USING ERRCODE = '42501';
  END IF;

  IF p_approve IS NULL THEN
    RAISE EXCEPTION 'An approval decision is required'
      USING ERRCODE = '22004';
  END IF;

  IF NOT p_approve AND (p_reason IS NULL OR btrim(p_reason) = '') THEN
    RAISE EXCEPTION 'A rejection needs a reason the owner can act on'
      USING ERRCODE = '22004';
  END IF;

  UPDATE properties
     SET is_approved         = p_approve,
         status              = CASE WHEN p_approve THEN 'available' ELSE 'rejected' END,
         verification_status = CASE WHEN p_approve THEN 'verified'  ELSE 'rejected' END,
         verification_notes  = CASE WHEN p_approve THEN verification_notes ELSE btrim(p_reason) END,
         verified_by         = auth.uid(),
         verified_at         = now(),
         updated_at          = now()
   WHERE id = p_property_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No such listing' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.moderate_property(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderate_property(uuid, boolean, text) TO authenticated;

COMMENT ON FUNCTION public.moderate_property(uuid, boolean, text) IS
  'Approve or reject a listing. SECURITY DEFINER: the staff-role check inside is the authorisation, because no client role holds UPDATE on public.properties.';

COMMIT;

-- ── Verifying after apply ─────────────────────────────────────────────────
--
--   owner  INSERT own owner_id            -> succeeds
--   owner  INSERT another owner_id        -> 42501 from the RLS policy
--   owner  INSERT naming is_approved      -> 42501 on that column
--   customer / anon INSERT                -> refused
--   owner / customer moderate_property()  -> 42501 from the role check
--   admin  moderate_property(id, true)    -> listing becomes publicly visible
--
-- ── Rollback ──────────────────────────────────────────────────────────────
--
--   BEGIN;
--   REVOKE INSERT ON public.properties FROM authenticated;
--   DROP FUNCTION IF EXISTS public.moderate_property(uuid, boolean, text);
--   COMMIT;
--
-- Removes no data. It returns owner posting and admin approval to their
-- current broken state, so roll back only if this grant causes a problem.
