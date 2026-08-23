-- ===========================================================================
-- Dealer / Territory Partner system — SCHEMA ONLY, NOT APPLIED.
--
-- Written for review. It is NOT applied to production, and it must not be
-- applied casually: see the IRREVERSIBILITY note below.
--
-- WHAT ALREADY EXISTS (verified against the live database, not assumed)
--   public.user_roles + public.app_role   the authoritative role system
--   public.localities (city, locality_name)   bottom two levels of geography
--   public.employee_regions (employee_id, city)   a city-scoped assignment pattern
--   public.customer_entitlements (user_id, plan_id, active_until,
--                                 razorpay_payment_id)   the entitlement pattern
--                                 this file deliberately mirrors
--
-- WHAT DOES NOT EXIST
--   'dealer' is not a member of public.app_role
--   STATE and DISTRICT are absent from the entire schema — zero columns. The
--   State -> District -> City -> Locality hierarchy the product needs is only
--   half-modelled today, so geography has to be introduced before a territory
--   can be assigned at state or district level.
--
-- IRREVERSIBILITY — READ BEFORE APPLYING
--   `ALTER TYPE ... ADD VALUE` cannot be undone. PostgreSQL provides no
--   DROP VALUE, so once 'dealer' exists in app_role it is permanent short of
--   rebuilding the type and every column that uses it. It also cannot run
--   inside a transaction block on older servers, which means this file is not
--   atomic: if a later statement fails, the enum change still stands.
--   Apply section 1 deliberately and separately.
-- ===========================================================================

-- ── 1. The dealer role ------------------------------------------------------
-- Authorisation comes from user_roles, never from a client-writable profile
-- column. A dealer therefore cannot grant themselves the role, for the same
-- reason a customer cannot grant themselves 'admin' (see 20260822170000).
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dealer';

-- ── 2. Geography ------------------------------------------------------------
-- Introduced because nothing in the schema models a state or a district.
-- Kept as reference tables rather than free text so a territory can be assigned
-- by identity instead of by a string that drifts ("Telangana" vs "TELANGANA").
CREATE TABLE IF NOT EXISTS public.states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id uuid NOT NULL REFERENCES public.states(id) ON DELETE RESTRICT,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (state_id, name)
);

-- ── 3. Dealer profile -------------------------------------------------------
-- One row per territory partner. `user_id` is nullable so an application can be
-- recorded before an account exists — the partnership is a commercial
-- relationship first and a login second.
CREATE TABLE IF NOT EXISTS public.dealer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  dealer_code text NOT NULL UNIQUE,
  full_name text NOT NULL,
  company_name text,
  phone text NOT NULL,
  email text NOT NULL,
  business_id text,
  address text,
  -- Controlled transitions; a form submission must never land on 'active'.
  status text NOT NULL DEFAULT 'application'
    CHECK (status IN ('application','under_review','approved','payment_pending',
                      'active','suspended','expired','terminated',
                      'refund_pending','refunded')),
  -- The commercial value is DATA, not a constant in code, so it can change
  -- without a deploy. ₹5,00,000 is today's figure, not a rule.
  partnership_fee_inr numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  valid_from date,
  valid_until date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── 4. Territory assignment -------------------------------------------------
-- One row per granted area, at whichever level the grant was made. A dealer may
-- hold a whole state, or three localities, or both.
CREATE TABLE IF NOT EXISTS public.dealer_territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealer_profiles(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('state','district','city','locality')),
  state_id uuid REFERENCES public.states(id) ON DELETE RESTRICT,
  district_id uuid REFERENCES public.districts(id) ON DELETE RESTRICT,
  city text,
  locality text,
  status text NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned','pending','suspended','released')),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  -- The named level must actually carry its identifier.
  CONSTRAINT dealer_territory_level_shape CHECK (
    (level = 'state'    AND state_id IS NOT NULL) OR
    (level = 'district' AND district_id IS NOT NULL) OR
    (level = 'city'     AND city IS NOT NULL) OR
    (level = 'locality' AND locality IS NOT NULL AND city IS NOT NULL)
  )
);

-- Exclusivity, enforced by the database rather than by a UI check.
-- Partial unique indexes: only one dealer may hold a given live area. Released
-- and suspended grants are excluded so history is preserved.
CREATE UNIQUE INDEX IF NOT EXISTS dealer_territory_state_unique
  ON public.dealer_territories (state_id)
  WHERE level = 'state' AND status = 'assigned';
CREATE UNIQUE INDEX IF NOT EXISTS dealer_territory_district_unique
  ON public.dealer_territories (district_id)
  WHERE level = 'district' AND status = 'assigned';
CREATE UNIQUE INDEX IF NOT EXISTS dealer_territory_city_unique
  ON public.dealer_territories (lower(city))
  WHERE level = 'city' AND status = 'assigned';
CREATE UNIQUE INDEX IF NOT EXISTS dealer_territory_locality_unique
  ON public.dealer_territories (lower(city), lower(locality))
  WHERE level = 'locality' AND status = 'assigned';

CREATE INDEX IF NOT EXISTS dealer_territories_dealer_idx
  ON public.dealer_territories (dealer_id);

-- ── 5. Payments -------------------------------------------------------------
-- Mirrors customer_entitlements: the gateway reference is stored, and status is
-- set by the server after verification. A row here is a RECORD of payment, not
-- permission — activation is a separate, explicit admin action.
CREATE TABLE IF NOT EXISTS public.dealer_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealer_profiles(id) ON DELETE CASCADE,
  amount_inr numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','partially_paid','failed','refunded')),
  method text CHECK (method IN ('razorpay','bank_transfer','cheque','other')),
  razorpay_order_id text,
  razorpay_payment_id text,
  reference text,
  paid_at timestamptz,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dealer_payments_dealer_idx
  ON public.dealer_payments (dealer_id, created_at DESC);

-- ── 6. Documents and activity ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.dealer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealer_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('agreement','invoice','receipt','business','identity','other')),
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dealer_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealer_profiles(id) ON DELETE CASCADE,
  event text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dealer_activity_dealer_idx
  ON public.dealer_activity (dealer_id, created_at DESC);

-- ── 7. Authorisation --------------------------------------------------------
ALTER TABLE public.states              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_territories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_activity     ENABLE ROW LEVEL SECURITY;

-- Geography is public reference data; everything else is private.
GRANT SELECT ON public.states, public.districts TO anon, authenticated;
DROP POLICY IF EXISTS "Anyone may read states" ON public.states;
CREATE POLICY "Anyone may read states" ON public.states FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Anyone may read districts" ON public.districts;
CREATE POLICY "Anyone may read districts" ON public.districts FOR SELECT TO public USING (true);

-- Dealer tables: NOTHING is granted to anon. A dealer reads only their own row;
-- everything else is admin-only, and all writes go through the service role.
GRANT SELECT ON public.dealer_profiles, public.dealer_territories,
                public.dealer_payments, public.dealer_documents,
                public.dealer_activity TO authenticated;
GRANT ALL ON public.dealer_profiles, public.dealer_territories,
             public.dealer_payments, public.dealer_documents,
             public.dealer_activity TO service_role;

-- `public.is_admin()` (20260818140100) reads user_roles and takes no argument,
-- so it can only answer "am I an admin" — never probe another user.
DROP POLICY IF EXISTS "Admins manage dealer profiles" ON public.dealer_profiles;
CREATE POLICY "Admins manage dealer profiles" ON public.dealer_profiles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Dealers read their own profile" ON public.dealer_profiles;
CREATE POLICY "Dealers read their own profile" ON public.dealer_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Scoped child-table access, expressed once per table.
DROP POLICY IF EXISTS "Admins manage dealer territories" ON public.dealer_territories;
CREATE POLICY "Admins manage dealer territories" ON public.dealer_territories
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Dealers read their own territories" ON public.dealer_territories;
CREATE POLICY "Dealers read their own territories" ON public.dealer_territories
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dealer_profiles d
                 WHERE d.id = dealer_territories.dealer_id AND d.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage dealer payments" ON public.dealer_payments;
CREATE POLICY "Admins manage dealer payments" ON public.dealer_payments
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Dealers read their own payments" ON public.dealer_payments;
CREATE POLICY "Dealers read their own payments" ON public.dealer_payments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dealer_profiles d
                 WHERE d.id = dealer_payments.dealer_id AND d.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins manage dealer documents" ON public.dealer_documents;
CREATE POLICY "Admins manage dealer documents" ON public.dealer_documents
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Dealers read their own documents" ON public.dealer_documents;
CREATE POLICY "Dealers read their own documents" ON public.dealer_documents
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dealer_profiles d
                 WHERE d.id = dealer_documents.dealer_id AND d.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins read dealer activity" ON public.dealer_activity;
CREATE POLICY "Admins read dealer activity" ON public.dealer_activity
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Dealers read their own activity" ON public.dealer_activity;
CREATE POLICY "Dealers read their own activity" ON public.dealer_activity
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dealer_profiles d
                 WHERE d.id = dealer_activity.dealer_id AND d.user_id = auth.uid()));
