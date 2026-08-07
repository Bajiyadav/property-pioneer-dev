-- ===========================================================================
-- Urban Properties — single-file bootstrap for a BLANK Supabase project
--
-- Target project: iyttetfaavokzyexvqam
-- Paste this whole file into Supabase → SQL Editor → Run. It is idempotent:
-- safe to run more than once.
--
-- Contains, in dependency order:
--   1. properties + enquiries + audit_logs
--   2. column-level grants (owner PII never exposed to anon/authenticated)
--   3. RLS policies
--   4. user_roles + app_role enum + has_role()
--   5. enterprise verification columns
--   6. profiles / favorites / notifications + owner_id + triggers
--   7. your 12 live listings, carried over from bukzokzeqlgpzeoaahqw
-- ===========================================================================

BEGIN;

-- ── 1. Core tables ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.properties (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text NOT NULL DEFAULT '',
  price         numeric NOT NULL DEFAULT 0,
  city          text NOT NULL,
  address       text NOT NULL DEFAULT '',
  bedrooms      integer NOT NULL DEFAULT 0,
  bathrooms     integer NOT NULL DEFAULT 0,
  area_sqft     integer NOT NULL DEFAULT 0,
  property_type text NOT NULL DEFAULT 'Apartment',
  listing_type  text NOT NULL DEFAULT 'rent',
  status        text NOT NULL DEFAULT 'available',
  images        text[] NOT NULL DEFAULT '{}',
  owner_name    text,
  owner_phone   text,
  owner_email   text,
  is_approved   boolean NOT NULL DEFAULT false,
  is_featured   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enquiries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name        text NOT NULL,
  phone       text NOT NULL,
  message     text NOT NULL,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event        text NOT NULL,
  outcome      text NOT NULL DEFAULT 'success',
  actor_id     uuid,
  subject_type text,
  subject_id   text,
  ip_address   text,
  user_agent   text,
  details      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Grants. Owner PII columns are deliberately NOT granted. ────────────
REVOKE ALL ON public.properties FROM anon, authenticated;
GRANT SELECT (
  id, title, description, price, city, address, bedrooms, bathrooms,
  area_sqft, property_type, listing_type, status, images,
  is_approved, is_featured, created_at, updated_at
) ON public.properties TO anon, authenticated;
GRANT ALL ON public.properties TO service_role;

REVOKE ALL ON public.enquiries  FROM anon, authenticated;
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
GRANT ALL ON public.enquiries  TO service_role;
GRANT ALL ON public.audit_logs TO service_role;

-- ── 3. RLS ────────────────────────────────────────────────────────────────
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved properties" ON public.properties;
CREATE POLICY "Public can view approved properties"
  ON public.properties FOR SELECT TO anon, authenticated
  USING (is_approved = true);

DROP POLICY IF EXISTS "No client access to enquiries" ON public.enquiries;
CREATE POLICY "No client access to enquiries"
  ON public.enquiries FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No client access to audit logs" ON public.audit_logs;
CREATE POLICY "No client access to audit logs"
  ON public.audit_logs FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ── 4. Roles ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user','customer','owner','agent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

REVOKE ALL ON public.user_roles FROM anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL    ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- ── 5. Verification columns ───────────────────────────────────────────────
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS owner_verification_status    text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS property_verification_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verified_by        uuid,
  ADD COLUMN IF NOT EXISTS verified_at        timestamptz,
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS phone_verified     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS id_verified        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_zero_brokerage  boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_premium         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL;

GRANT SELECT (
  owner_verification_status, property_verification_status, verified_at,
  phone_verified, email_verified, id_verified, is_zero_brokerage, is_premium
) ON public.properties TO anon, authenticated;

DROP POLICY IF EXISTS "Owners manage their own listings" ON public.properties;
CREATE POLICY "Owners manage their own listings"
  ON public.properties FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ── 6. Dashboard tables ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text,
  phone      text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  body       text,
  kind       text NOT NULL DEFAULT 'info',
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE          ON public.profiles      TO authenticated;
GRANT SELECT, INSERT, DELETE          ON public.favorites     TO authenticated;
GRANT SELECT, UPDATE                  ON public.notifications TO authenticated;
GRANT ALL ON public.profiles, public.favorites, public.notifications TO service_role;

DROP POLICY IF EXISTS "Own profile" ON public.profiles;
CREATE POLICY "Own profile" ON public.profiles FOR ALL TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Own favorites" ON public.favorites;
CREATE POLICY "Own favorites" ON public.favorites FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Own notifications" ON public.notifications;
CREATE POLICY "Own notifications" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_properties_approved  ON public.properties (is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_city      ON public.properties (city);
CREATE INDEX IF NOT EXISTS idx_properties_owner     ON public.properties (owner_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_property   ON public.enquiries (property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_ip_created ON public.enquiries (ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_created  ON public.audit_logs (event, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user       ON public.favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON public.notifications (user_id, created_at DESC);

-- Auto-create a profile + default role for every new sign-up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'phone')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'role',''), 'customer')::public.app_role
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN others THEN
  RETURN NEW;  -- never block sign-up on profile bookkeeping
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, full_name, phone)
SELECT u.id, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'phone'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- ── 7. Your 12 live listings, carried over ────────────────────────────────
INSERT INTO public.properties (id, title, description, price, city, address, bedrooms, bathrooms, area_sqft, property_type, listing_type, status, images, is_approved, is_featured, created_at) VALUES
  ('0c667134-1b7b-4353-8221-277a6b80bdc2', 'Sunlit 2BHK in Bandra West', 'A bright, airy 2-bedroom flat just minutes from Carter Road. Modular kitchen, wide balcony overlooking a quiet lane, and a dedicated parking spot.', 65000.0, 'Mumbai', 'Linking Road, Bandra West', 2, 2, 950, 'apartment', 'rent', 'available', '{"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200", "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200"}', true, true, '2026-07-28T19:37:55.370148+00:00'),
  ('19d07121-5e75-4257-bef1-8e1c8955253d', 'Modern Studio near Koramangala', 'Fully furnished studio in the heart of Koramangala 5th Block. Ideal for young professionals. Walk to cafes, coworking, and metro.', 28000.0, 'Bangalore', '5th Block, Koramangala', 1, 1, 450, 'studio', 'rent', 'available', '{"https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200", "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200"}', true, true, '2026-07-28T19:37:55.370148+00:00'),
  ('3ac9ca8e-de72-46b5-b2e2-b4a368f31797', 'Spacious 3BHK Villa with Garden', 'Independent villa with a private garden, servant quarter, and covered parking for two cars. Gated community with 24/7 security.', 18500000.0, 'Pune', 'Baner Road', 3, 3, 2200, 'villa', 'sale', 'available', '{"https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200"}', true, true, '2026-07-28T19:37:55.370148+00:00'),
  ('fa15f158-51a2-4657-b2ae-aa64347e4670', 'Luxury Penthouse with Skyline View', 'Top-floor penthouse with panoramic city views, private terrace, jacuzzi, and premium Italian marble finishes.', 42000000.0, 'Mumbai', 'Worli Sea Face', 4, 4, 3400, 'penthouse', 'sale', 'available', '{"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200", "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200"}', true, true, '2026-07-28T19:37:55.370148+00:00'),
  ('1e50c151-7960-4cf6-8608-455f361829eb', 'Cozy 1BHK in Indiranagar', 'Well-maintained 1BHK with wooden flooring, ample natural light, and a small balcony. Close to 100 Ft Road.', 32000.0, 'Bangalore', '12th Main, Indiranagar', 1, 1, 620, 'apartment', 'rent', 'available', '{"https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200", "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200"}', true, false, '2026-07-28T19:37:55.370148+00:00'),
  ('f491389c-0d36-47b6-b427-ce29b507a735', 'Family House in Jubilee Hills', 'Independent house on a 300 sq yd plot with 4 bedrooms, a study, and a private lawn. Quiet residential lane.', 55000.0, 'Hyderabad', 'Road No. 36, Jubilee Hills', 4, 3, 2800, 'house', 'rent', 'available', '{"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200"}', true, false, '2026-07-28T19:37:55.370148+00:00'),
  ('3ebfcbf7-c993-4dc6-a363-0e90f58c580a', 'Sea-facing 2BHK in Kochi', 'Wake up to the sound of waves. Semi-furnished 2BHK on the 8th floor with an unobstructed view of the backwaters.', 8500000.0, 'Kochi', 'Marine Drive', 2, 2, 1150, 'apartment', 'sale', 'available', '{"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200", "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200"}', true, true, '2026-07-28T19:37:55.370148+00:00'),
  ('6632042a-4972-4ba1-b9ef-4f2774d523a7', 'Compact Studio in DLF Phase 3', 'Newly renovated studio, perfect for a working professional. Includes AC, wardrobe, and refrigerator.', 22000.0, 'Gurugram', 'DLF Phase 3', 1, 1, 380, 'studio', 'rent', 'available', '{"https://images.unsplash.com/photo-1522444195799-478538b28823?w=1200"}', true, false, '2026-07-28T19:37:55.370148+00:00'),
  ('598da06f-4f7e-479b-9c5b-79ea4a941b59', 'Heritage Bungalow in Alibaug', 'Restored bungalow with original teak beams, a large veranda, and a mango orchard. 20 minutes from the beach.', 27500000.0, 'Alibaug', 'Awas Village', 4, 4, 3800, 'house', 'sale', 'available', '{"https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200", "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200"}', true, false, '2026-07-28T19:37:55.370148+00:00'),
  ('4826e5cf-941a-46b4-9c2b-3865586a5eef', '3BHK Apartment in Salt Lake', 'South-facing 3BHK with cross-ventilation, spacious living room, and modular kitchen. Community park and gym.', 45000.0, 'Kolkata', 'Sector V, Salt Lake', 3, 2, 1450, 'apartment', 'rent', 'available', '{"https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200"}', true, false, '2026-07-28T19:37:55.370148+00:00'),
  ('1235a91d-581d-454a-bf87-09b490434fa0', 'Chic 2BHK near Anna Nagar Tower', 'Contemporary 2BHK with designer interiors, walk-in closet, and rooftop access. Prime Anna Nagar location.', 38000.0, 'Chennai', '2nd Avenue, Anna Nagar', 2, 2, 1050, 'apartment', 'rent', 'available', '{"https://images.unsplash.com/photo-1600566753086-00f18fe6ba68?w=1200", "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=1200"}', true, false, '2026-07-28T19:37:55.370148+00:00'),
  ('de84e53f-4f48-4753-9714-80d45d9f09dc', 'Hillside Villa in Lonavala', 'Weekend retreat set on a hillside with private pool, deck, and misty valley views. Fully furnished, ready to move in.', 32000000.0, 'Lonavala', 'Tungarli', 4, 4, 3200, 'villa', 'sale', 'available', '{"https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200", "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200"}', true, true, '2026-07-28T19:37:55.370148+00:00')
ON CONFLICT (id) DO NOTHING;

COMMIT;
