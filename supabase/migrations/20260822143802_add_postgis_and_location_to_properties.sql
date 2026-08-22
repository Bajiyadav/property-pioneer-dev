-- ===========================================================================
-- Geographic location for properties — PostGIS, exact coordinates (private)
-- and approximate coordinates (public).
--
-- SECURITY NOTE — this migration previously shipped a critical hole.
--
-- It defined:
--
--   CREATE FUNCTION public.search_properties_in_bounds(...)
--   RETURNS SETOF public.properties
--   LANGUAGE sql SECURITY DEFINER
--   AS $$ SELECT * FROM public.properties WHERE location && ST_MakeEnvelope(...) $$;
--
-- Four things were wrong with it, and together they made it a remotely
-- exploitable PII leak that any anonymous visitor could call:
--
--   1. SECURITY DEFINER runs as the function owner, so RLS and the COLUMN-LEVEL
--      grants on public.properties do not apply inside it.
--   2. `SELECT *` therefore returned every column — including `owner_phone`,
--      which is deliberately withheld from anon (a direct read returns 42501)
--      and is only meant to be reachable through the rate-limited, audited
--      /api/public/properties/$id/contact endpoint.
--   3. There was no `is_approved = true` filter, so listings still awaiting
--      moderation would have been public too.
--   4. EXECUTE on a new function defaults to PUBLIC, so `anon` could call it.
--
-- The function was referenced by no application code. It is dropped rather than
-- repaired: a bounding-box filter over the approximate columns below runs
-- through PostgREST as the caller's own role, so RLS and the column grants
-- apply automatically and there is nothing to get wrong.
-- ===========================================================================

DROP FUNCTION IF EXISTS public.search_properties_in_bounds(
  double precision, double precision, double precision, double precision
);

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- 1. Exact coordinates — PRIVATE ------------------------------------------
--
-- Deliberately NOT granted to anon or authenticated. public.properties uses
-- column-level grants, so omitting them here is what keeps them private: an
-- ungranted column reads as 42501 rather than leaking. These are written by the
-- listing pipeline through the service role and used for server-side geocoding
-- and distance work only.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- Generated geometry for spatial work. Also private, for the same reason.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS location geometry(Point, 4326)
  GENERATED ALWAYS AS (
    CASE
      WHEN latitude IS NOT NULL AND longitude IS NOT NULL
        THEN extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)
      ELSE NULL
    END
  ) STORED;

CREATE INDEX IF NOT EXISTS properties_location_idx
  ON public.properties USING GIST (location);

-- 2. Approximate coordinates — PUBLIC -------------------------------------
--
-- What the public map renders. Rounded to three decimal places, which is about
-- 110 m of latitude and about 105 m of longitude at Hyderabad's latitude —
-- enough to show which stretch of which road a listing is on, not enough to
-- point at the front door of somebody's home.
--
-- GENERATED ALWAYS is the safety property that makes this work. The rounding
-- cannot drift from its source, no application code can forget to apply it, and
-- because only these columns are granted, there is no query path that returns an
-- exact coordinate to a public client.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS approx_latitude numeric(9, 3)
    GENERATED ALWAYS AS (round(latitude::numeric, 3)) STORED,
  ADD COLUMN IF NOT EXISTS approx_longitude numeric(9, 3)
    GENERATED ALWAYS AS (round(longitude::numeric, 3)) STORED;

-- Supports the map's bounding-box filter, which runs as the caller's own role.
CREATE INDEX IF NOT EXISTS properties_approx_location_idx
  ON public.properties (approx_latitude, approx_longitude);

-- 3. Grants ----------------------------------------------------------------
--
-- Only the approximate pair. See supabase/migrations/README.md rule 4: a
-- column-level grant does not extend to columns added later, so a migration
-- that adds a column without granting it lands the schema but not the feature.
GRANT SELECT (approx_latitude, approx_longitude)
  ON public.properties TO anon, authenticated;
