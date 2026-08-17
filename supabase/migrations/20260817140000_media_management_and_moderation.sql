-- Migration: Media Management & Moderation Fields
-- Description: Adds media_status and media_notes columns to public.properties for Admin & Agent media workflow

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS media_status TEXT DEFAULT 'pending_review' CHECK (media_status IN ('pending_review', 'verified', 'needs_reshoot')),
ADD COLUMN IF NOT EXISTS media_notes TEXT;

-- Update RLS policies to allow Admins and assigned Area Agents to update media fields
DROP POLICY IF EXISTS "Agents can update properties in assigned localities" ON public.properties;
CREATE POLICY "Agents can update properties in assigned localities"
ON public.properties
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (
          profiles.role = 'agent'
          AND properties.locality = ANY(profiles.assigned_localities)
        )
      )
    )
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role = 'admin'
        OR (
          profiles.role = 'agent'
          AND properties.locality = ANY(profiles.assigned_localities)
        )
      )
    )
  )
);
