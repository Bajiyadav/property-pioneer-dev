-- Migration: Media Management & Moderation Fields
-- Description: Adds media_status and media_notes columns to public.properties for Admin & Agent media workflow

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS media_status TEXT DEFAULT 'pending_review' CHECK (media_status IN ('pending_review', 'verified', 'needs_reshoot')),
ADD COLUMN IF NOT EXISTS media_notes TEXT;

-- RLS policy moved to 20260822170000_close_profiles_role_escalation.sql
--
-- This migration used to create an UPDATE policy on public.properties whose
-- USING clause read:
--
--   EXISTS (SELECT 1 FROM public.profiles
--           WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
--
-- `authenticated` holds UPDATE on public.profiles and RLS lets a user update
-- their own row, so `profiles.role` is writable by the account holder. Trusting
-- it for authorisation let any signed-up user grant themselves UPDATE on every
-- listing in the marketplace.
--
-- The policy is created in 20260822170000 instead, using public.is_admin() and
-- public.caller_has_role(), which read public.user_roles — the source that
-- session.ts calls authoritative and that the account holder cannot write.
--
-- It is not simply rewritten in place here: this migration has already been
-- applied, so an edit to it never runs again (see supabase/migrations/README.md),
-- and the helpers it would need do not exist yet at this point in the ordering.
-- Removing the policy from this file keeps a freshly-built database from ever
-- holding the vulnerable version, even briefly.
DROP POLICY IF EXISTS "Agents can update properties in assigned localities" ON public.properties;
