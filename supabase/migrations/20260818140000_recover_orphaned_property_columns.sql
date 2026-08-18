-- ===========================================================================
-- Recovers property columns that were written but never applied.
--
-- WHY THIS EXISTS
-- Two migrations were authored under `supabase/migrations/properties/`:
--   * 20260815190000_add_extended_video_fields.sql
--   * 20260817140000_add_housing_fields.sql
-- The Supabase CLI only reads `.sql` files at the TOP LEVEL of
-- supabase/migrations. Anything in a subdirectory is invisible to it, so
-- `supabase db push` reported "up to date" while these six columns were absent
-- from production for weeks. Verified against the live database: all six
-- returned 42703 undefined_column.
--
-- The second file also collided on timestamp with the top-level
-- 20260817140000_add_critical_property_specs.sql (a different migration, which
-- WAS applied), so the originals cannot simply be moved. They are superseded by
-- this file and deleted.
--
-- TWO DEFECTS FIXED WHILE PORTING
--   1. add_housing_fields used bare `ADD COLUMN`, so re-running it fails with
--      42701 duplicate_column. Every ADD COLUMN here is IF NOT EXISTS.
--   2. Neither original granted its new columns. `public.properties` uses
--      COLUMN-LEVEL grants (owner_phone is deliberately withheld from anon), and
--      a column-level grant does not extend to columns added later. Without the
--      GRANT below the columns would exist and still read as 42501 to every
--      public query — landing the migration but not the feature.
-- ===========================================================================

-- 1. Video metadata (from properties/20260815190000_add_extended_video_fields)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS video_duration INTEGER,
  ADD COLUMN IF NOT EXISTS video_uploaded_at TIMESTAMP WITH TIME ZONE;

-- 2. Housing fields (from properties/20260817140000_add_housing_fields)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS project_name TEXT,
  ADD COLUMN IF NOT EXISTS bhk_type TEXT,
  ADD COLUMN IF NOT EXISTS area_unit TEXT DEFAULT 'Sq.ft';

-- 3. Column grants, matching the pattern established by 20260815131921.
GRANT SELECT (video_thumbnail_url, video_duration, video_uploaded_at,
              project_name, bhk_type, area_unit)
  ON public.properties TO anon, authenticated;

-- 4. `pincode` -------------------------------------------------------------
--
-- EXTENDED_PROPERTY_COLUMNS in propertyService.ts selects `pincode`, and its
-- comment attributes it to "migration 20260817160000". No such migration exists
-- anywhere in this repository — it was never written. The column has therefore
-- never existed in any environment, and PostgREST rejects the ENTIRE extended
-- select with 42703 because of it.
--
-- That single absent column, not the video columns, is what has been latching
-- the schema capability off on every public property query: locality, video,
-- and the nine specification columns below were all being dropped because of it.
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS pincode TEXT;

-- 5. Grants for the specification columns -----------------------------------
--
-- ORDER MATTERS, AND ADDING pincode ALONE WOULD HAVE TAKEN THE SITE DOWN.
--
-- 20260817140000_add_critical_property_specs.sql added these nine columns
-- without granting them. They are unreadable by anon and authenticated today
-- (verified: all nine return 42501 insufficient_privilege), but nothing notices,
-- because the extended query already dies earlier on `pincode`.
--
-- Fix `pincode` on its own and the query gets one column further, hits 42501 on
-- these nine, and FAILS OUTRIGHT — the fallback in propertySchema.ts only
-- retries on 42703, so a permission error is not caught and every public
-- property query breaks. Granting them in the same migration is what keeps the
-- extended select going from "always fails" to "fully succeeds" in one step,
-- with no intermediate state that serves an error page.
--
-- The owner ListingWizard has been collecting all nine from owners and writing
-- them via the service role, so the data is already there; only the public read
-- privilege was missing.
GRANT SELECT (pincode, property_age, total_floors, exact_floor, balconies,
              parking_covered, parking_open, facing, available_from,
              rent_negotiable)
  ON public.properties TO anon, authenticated;
