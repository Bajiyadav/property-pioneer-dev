-- Migration: Storage Buckets, Agent Locality Scoping, Live Activity Tracking & Visit Schedules
-- Idempotent script for Supabase Postgres

-- 1. Storage Buckets for Property Images and Property Videos
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('property-images', 'property-images', true),
  ('property-videos', 'property-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Bucket-scoped RLS policies for property-images
DROP POLICY IF EXISTS "property_images_public_read" ON storage.objects;
CREATE POLICY "property_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "property_images_authenticated_insert" ON storage.objects;
CREATE POLICY "property_images_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-images');

DROP POLICY IF EXISTS "property_images_owner_update" ON storage.objects;
CREATE POLICY "property_images_owner_update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'property-images' AND auth.uid() = owner
  );

DROP POLICY IF EXISTS "property_images_owner_delete" ON storage.objects;
CREATE POLICY "property_images_owner_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'property-images' AND auth.uid() = owner
  );

-- Bucket-scoped RLS policies for property-videos
DROP POLICY IF EXISTS "property_videos_public_read" ON storage.objects;
CREATE POLICY "property_videos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-videos');

DROP POLICY IF EXISTS "property_videos_authenticated_insert" ON storage.objects;
CREATE POLICY "property_videos_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-videos');

DROP POLICY IF EXISTS "property_videos_owner_update" ON storage.objects;
CREATE POLICY "property_videos_owner_update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'property-videos' AND auth.uid() = owner
  );

DROP POLICY IF EXISTS "property_videos_owner_delete" ON storage.objects;
CREATE POLICY "property_videos_owner_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'property-videos' AND auth.uid() = owner
  );


-- 2. Extend Profiles Table for Agent Locality Scoping & Agency Metadata
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assigned_localities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS agent_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS agency_name TEXT;

-- Grant access on newly added columns
GRANT SELECT, UPDATE ON public.profiles TO authenticated;


-- 3. Live Visitor & Lead Activity Tracking Table
CREATE TABLE IF NOT EXISTS public.live_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('search', 'view_listing', 'draft_listing', 'enquiry', 'schedule_visit')),
  locality TEXT NOT NULL DEFAULT 'Hyderabad',
  city TEXT NOT NULL DEFAULT 'Hyderabad',
  latitude NUMERIC,
  longitude NUMERIC,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  search_query TEXT,
  assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'converted', 'closed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for high performance filtering
CREATE INDEX IF NOT EXISTS idx_live_activities_locality ON public.live_activities(locality);
CREATE INDEX IF NOT EXISTS idx_live_activities_created ON public.live_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_activities_agent ON public.live_activities(assigned_agent_id);

ALTER TABLE public.live_activities ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + auth) can log an activity (e.g. searching, viewing)
GRANT INSERT ON public.live_activities TO anon, authenticated;
GRANT SELECT, UPDATE ON public.live_activities TO authenticated;
GRANT ALL ON public.live_activities TO service_role;

DROP POLICY IF EXISTS "Anyone can insert live activity" ON public.live_activities;
CREATE POLICY "Anyone can insert live activity" ON public.live_activities
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins and agents view live activity" ON public.live_activities;
CREATE POLICY "Admins and agents view live activity" ON public.live_activities
  FOR SELECT TO authenticated
  USING (
    -- Admin sees all
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR
    -- Agent sees assigned activity or assigned locality
    assigned_agent_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND locality = ANY(assigned_localities)
    )
    OR
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Admins and agents update assigned live activity" ON public.live_activities;
CREATE POLICY "Admins and agents update assigned live activity" ON public.live_activities
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR assigned_agent_id = auth.uid()
  );


-- 4. Customer Visit Scheduling Table
CREATE TABLE IF NOT EXISTS public.visit_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  visit_type TEXT NOT NULL DEFAULT 'in_person' CHECK (visit_type IN ('in_person', 'video_call')),
  preferred_date DATE NOT NULL,
  preferred_slot TEXT NOT NULL DEFAULT 'Morning (9 AM - 12 PM)',
  locality TEXT NOT NULL DEFAULT 'Hyderabad',
  assigned_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visit_schedules_property ON public.visit_schedules(property_id);
CREATE INDEX IF NOT EXISTS idx_visit_schedules_customer ON public.visit_schedules(customer_id);
CREATE INDEX IF NOT EXISTS idx_visit_schedules_agent ON public.visit_schedules(assigned_agent_id);

ALTER TABLE public.visit_schedules ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.visit_schedules TO authenticated;
GRANT INSERT ON public.visit_schedules TO anon;
GRANT ALL ON public.visit_schedules TO service_role;

DROP POLICY IF EXISTS "Customers create visits" ON public.visit_schedules;
CREATE POLICY "Customers create visits" ON public.visit_schedules
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users view relevant visits" ON public.visit_schedules;
CREATE POLICY "Users view relevant visits" ON public.visit_schedules
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR assigned_agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = visit_schedules.property_id AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins and agents update visit status" ON public.visit_schedules;
CREATE POLICY "Admins and agents update visit status" ON public.visit_schedules
  FOR UPDATE TO authenticated
  USING (
    assigned_agent_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR customer_id = auth.uid()
  );
