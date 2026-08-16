-- Video tours and location context for properties.
--
-- Rewritten to be idempotent and re-runnable. The original version was not:
-- `CREATE TYPE`, eight bare `ADD COLUMN`s and four `CREATE POLICY` statements
-- all abort on a second run, so a partially-applied migration could never be
-- completed and `supabase db push` would fail the CD gate.
--
-- The storage policies are also renamed and scoped to this bucket. They were
-- called "Public Access", "Authenticated users can upload videos", and so on —
-- and "Public Access" in particular is the name Supabase gives the default
-- policy of every public bucket. Creating it here would collide with the
-- existing `property-images` bucket's policy and abort the migration; dropping
-- that name to make room would silently remove another bucket's access rule.
-- Prefixed names can be dropped and recreated safely because nothing else owns
-- them.
--
-- Indexing: deliberately none. The location columns are queried with
-- `ilike '%term%'`, which a btree index cannot serve, and the table is small
-- enough that a sequential scan is the right plan. If listing volume grows,
-- add `pg_trgm` GIN indexes on (locality, landmark) — that is a separate,
-- measured change, not a guess made here.

-- 1. Video moderation state -------------------------------------------------
DO $$
BEGIN
  CREATE TYPE public.video_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- 2. Columns ----------------------------------------------------------------
-- Additive only. Existing rows take the defaults; nothing is rewritten.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_status public.video_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS locality TEXT,
  ADD COLUMN IF NOT EXISTS landmark TEXT,
  ADD COLUMN IF NOT EXISTS metro_station TEXT,
  ADD COLUMN IF NOT EXISTS it_park TEXT,
  ADD COLUMN IF NOT EXISTS college TEXT,
  ADD COLUMN IF NOT EXISTS hospital TEXT;

-- The client selects these columns for anon and authenticated readers. Without
-- the grant the migration would land but every public query would still fail,
-- which is the failure mode this migration exists to remove.
GRANT SELECT (video_url, video_status, locality, landmark, metro_station, it_park, college, hospital)
  ON public.properties TO anon, authenticated;

-- 3. Video storage bucket ---------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('property_videos', 'property_videos', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Bucket-scoped storage policies ----------------------------------------
DROP POLICY IF EXISTS "property_videos_public_read" ON storage.objects;
CREATE POLICY "property_videos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'property_videos');

DROP POLICY IF EXISTS "property_videos_authenticated_insert" ON storage.objects;
CREATE POLICY "property_videos_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property_videos');

DROP POLICY IF EXISTS "property_videos_owner_update" ON storage.objects;
CREATE POLICY "property_videos_owner_update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'property_videos' AND auth.uid() = owner
  );

DROP POLICY IF EXISTS "property_videos_owner_delete" ON storage.objects;
CREATE POLICY "property_videos_owner_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'property_videos' AND auth.uid() = owner
  );
