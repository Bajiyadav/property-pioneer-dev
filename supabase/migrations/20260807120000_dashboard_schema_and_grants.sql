-- ===========================================================================
-- Dashboard schema reconciliation
--
-- Fixes drift between the code and the live database that broke the dashboards:
--   1. 20260806000000_enterprise_property_schema.sql added verification columns
--      but never GRANTed them, and was never applied to the live project. Any
--      SELECT naming those columns failed with 42703/42501 and collapsed every
--      listing query onto hard-coded fallback data.
--   2. profiles / favorites / notifications are read by the dashboards but do
--      not exist at all.
--   3. app_role had no 'owner' / 'agent' / 'customer' members, so the app's role
--      model could not be represented in user_roles.
--
-- Idempotent: safe to run against a database at any of these states.
-- ===========================================================================

-- ── 1. Enterprise verification columns (re-stated so this migration is standalone)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS owner_verification_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS property_verification_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verified_by UUID,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_zero_brokerage BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Grant ONLY the new non-PII columns. owner_phone / owner_name / owner_email stay
-- server-side: they are deliberately absent from every client grant.
GRANT SELECT (
  owner_verification_status, property_verification_status, verified_at,
  verification_notes, phone_verified, email_verified, id_verified,
  is_zero_brokerage, is_premium, owner_id
) ON public.properties TO anon, authenticated;

-- Owners manage their own listings through RLS rather than a service-role bypass.
GRANT INSERT, UPDATE, DELETE ON public.properties TO authenticated;

DROP POLICY IF EXISTS "Owners manage their own properties" ON public.properties;
CREATE POLICY "Owners manage their own properties"
  ON public.properties FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE INDEX IF NOT EXISTS properties_owner_id_idx ON public.properties (owner_id);

-- ── 2. Extend app_role with the personas the product actually uses
DO $$
BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agent';
EXCEPTION WHEN others THEN NULL;
END $$;

-- ── 3. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

DROP POLICY IF EXISTS "Users read their own profile" ON public.profiles;
CREATE POLICY "Users read their own profile"
  ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users upsert their own profile" ON public.profiles;
CREATE POLICY "Users upsert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update their own profile" ON public.profiles;
CREATE POLICY "Users update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Keep profiles in step with auth.users automatically.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 4. favorites (server-side mirror of the local wishlist)
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

DROP POLICY IF EXISTS "Users manage their own favorites" ON public.favorites;
CREATE POLICY "Users manage their own favorites"
  ON public.favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites (user_id);

-- ── 5. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  category text NOT NULL DEFAULT 'general',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

DROP POLICY IF EXISTS "Users read their own notifications" ON public.notifications;
CREATE POLICY "Users read their own notifications"
  ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users mark their own notifications read" ON public.notifications;
CREATE POLICY "Users mark their own notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_id_created_idx
  ON public.notifications (user_id, created_at DESC);

-- ── 6. Let owners read enquiries on their OWN listings.
-- The blanket deny-all from 20260730044133 stays in force for everyone else.
DROP POLICY IF EXISTS "Owners read enquiries on their listings" ON public.enquiries;
CREATE POLICY "Owners read enquiries on their listings"
  ON public.enquiries FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = enquiries.property_id AND p.owner_id = auth.uid()
    )
  );

GRANT SELECT (id, name, phone, message, property_id, created_at)
  ON public.enquiries TO authenticated;
