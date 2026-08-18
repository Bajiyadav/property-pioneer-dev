-- Customer plan entitlements.
--
-- `checkCustomerAccess` reads this table, so without it every access check
-- fails at runtime with 42P01 (undefined_table). The reader degrades to
-- "no access" rather than throwing, but that is a safety net, not a substitute
-- for the table: until this migration is applied, a customer who has paid still
-- gets no access.
--
-- Idempotent throughout, because migrations in this project have been applied
-- out of order before and a re-run must not abort the deploy.

CREATE TABLE IF NOT EXISTS public.customer_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  -- NULL means lifetime access. The reader treats it that way, so the column
  -- must stay nullable.
  active_until timestamptz,
  -- Kept for support and dispute handling: which payment granted this.
  razorpay_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One active row per user per plan; a repeated webhook or a double-click must
-- not create a second entitlement.
CREATE UNIQUE INDEX IF NOT EXISTS customer_entitlements_user_plan_idx
  ON public.customer_entitlements (user_id, plan_id);

-- The access check filters on user_id on every request.
CREATE INDEX IF NOT EXISTS customer_entitlements_user_idx
  ON public.customer_entitlements (user_id);

ALTER TABLE public.customer_entitlements ENABLE ROW LEVEL SECURITY;

-- A user may read only their own entitlement. Writes are server-only: granting
-- yourself a paid plan from the browser is exactly what this must prevent, so
-- there is deliberately no INSERT or UPDATE policy for authenticated.
DROP POLICY IF EXISTS customer_entitlements_select_own ON public.customer_entitlements;
CREATE POLICY customer_entitlements_select_own
  ON public.customer_entitlements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.customer_entitlements FROM anon, authenticated;
