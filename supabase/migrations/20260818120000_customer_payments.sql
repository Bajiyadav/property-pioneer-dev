-- Razorpay order records for customer plan purchases.
--
-- Rewritten after this migration failed with
--   ERROR: relation "customer_entitlements" already exists (SQLSTATE 42P07)
--
-- Three defects, all found by running it against a real database for the first
-- time:
--
--  1. It re-created `customer_entitlements`, which migration 20260818090000 had
--     already created four steps earlier — with a DIFFERENT shape. That one has a
--     surrogate `id` and UNIQUE (user_id, plan_id), allowing a customer to hold
--     more than one plan; this one made `user_id` the primary key, silently
--     capping them at one. Two migrations defining the same table is a conflict
--     whichever wins, so the table is no longer created here. The applied
--     definition stands.
--
--  2. Both triggers call `public.handle_updated_at()`, which is defined nowhere
--     in this repository. The triggers would have failed even after the table
--     clash was resolved. It is defined below.
--
--  3. Nothing was idempotent. `supabase db push` re-runs a failed migration from
--     the top, so a mid-file failure left the earlier statements applied and the
--     retry aborting on them. Every statement here is now safe to repeat.

-- Shared updated_at trigger function. IF NOT EXISTS is not available for
-- functions, and CREATE OR REPLACE is idempotent by definition.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.customer_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  plan_id text NOT NULL,
  -- Unique so a duplicated webhook or a double-submitted checkout cannot record
  -- the same Razorpay order twice.
  razorpay_order_id text NOT NULL UNIQUE,
  amount_paise integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The reconciliation query: "what has this customer paid for".
CREATE INDEX IF NOT EXISTS customer_orders_user_idx ON public.customer_orders (user_id);

ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;

-- A customer may read their own orders and nothing else. There is deliberately
-- no INSERT or UPDATE policy for `authenticated`: an order is created by the
-- server after Razorpay confirms it, and a client able to write here could mark
-- its own order paid.
DROP POLICY IF EXISTS customer_orders_select_own ON public.customer_orders;
CREATE POLICY customer_orders_select_own
  ON public.customer_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON public.customer_orders FROM anon, authenticated;

DROP TRIGGER IF EXISTS set_customer_orders_updated_at ON public.customer_orders;
CREATE TRIGGER set_customer_orders_updated_at
  BEFORE UPDATE ON public.customer_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- `customer_entitlements` itself belongs to 20260818090000; only its trigger is
-- attached here, because the function it needs is defined above.
DROP TRIGGER IF EXISTS set_customer_entitlements_updated_at ON public.customer_entitlements;
CREATE TRIGGER set_customer_entitlements_updated_at
  BEFORE UPDATE ON public.customer_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
