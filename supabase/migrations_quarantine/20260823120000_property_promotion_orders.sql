-- Owner property-promotion orders (₹299 / ₹499 optional visibility).
--
-- WHY A NEW TABLE RATHER THAN public.customer_orders
-- customer_orders already models plan payments, but it is scoped to a USER
-- buying a contact-quota plan: it has no property_id, and its RLS and naming
-- both read as tenant-side. Owner promotion must stay separate from tenant
-- contact monetisation — they are different products with different buyers, and
-- conflating them would make "what did this owner pay to promote this listing"
-- unanswerable. This table therefore mirrors customer_orders' conventions
-- (paise, RLS shape, revoked client writes) while adding property scope.
--
-- SAFETY: purely additive. It creates one new table and its indexes/policies;
-- it removes nothing and rewrites no existing row. public.properties is NOT altered — the promotion
-- window lives on the order, because properties has no expiry column and this
-- feature must not change that table.
--
-- NOT YET APPLIED. Gateway identifiers are nullable precisely because no
-- payment provider is connected; an order can exist in 'pending' long before a
-- gateway ever issues an id.

CREATE TABLE IF NOT EXISTS public.promotion_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  plan_id text NOT NULL,

  -- Server-computed from plan_id. Never accepted from the browser.
  amount_paise integer NOT NULL CHECK (amount_paise > 0),
  currency text NOT NULL DEFAULT 'INR',

  -- A boolean is_paid cannot express "the gateway took the money but the
  -- webhook has not landed yet", which is exactly when support gets called.
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','created','processing','paid','failed','cancelled','refunded')),

  -- All nullable: no gateway is connected yet, and an order is created before
  -- any provider has issued identifiers for it.
  gateway text,
  gateway_order_id text,
  gateway_payment_id text,
  gateway_signature text,

  -- The promotion window this order buys. Set only on verified payment.
  promotion_starts_at timestamptz,
  promotion_ends_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Partial unique index rather than a UNIQUE column: many rows legitimately hold
-- NULL gateway_order_id while unpaid, but a duplicated webhook must never be
-- able to record the same gateway order twice.
CREATE UNIQUE INDEX IF NOT EXISTS promotion_orders_gateway_order_key
  ON public.promotion_orders (gateway_order_id)
  WHERE gateway_order_id IS NOT NULL;

-- IDEMPOTENCY. gateway_order_id is NULL until a provider issues one, and
-- Postgres permits unlimited NULLs in a unique index — so the index above does
-- NOT stop an owner who taps "Continue to Payment" twice from creating two
-- open orders for the same listing. This constrains a property to ONE open
-- order at a time; the server reuses it rather than stacking duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS promotion_orders_one_open_per_property
  ON public.promotion_orders (property_id)
  WHERE status IN ('pending', 'created', 'processing');

CREATE INDEX IF NOT EXISTS promotion_orders_user_idx ON public.promotion_orders (user_id);
CREATE INDEX IF NOT EXISTS promotion_orders_property_idx ON public.promotion_orders (property_id);

ALTER TABLE public.promotion_orders ENABLE ROW LEVEL SECURITY;

-- An owner may READ their own orders. There is deliberately no INSERT or UPDATE
-- policy for `authenticated`: orders are written by the server after ownership
-- is verified, and a client able to write here could mark its own order paid.
DROP POLICY IF EXISTS promotion_orders_select_own ON public.promotion_orders;
CREATE POLICY promotion_orders_select_own
  ON public.promotion_orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin/employee read for the payments view. Read-only: reconciliation never
-- needs to mutate an order from a dashboard.
DROP POLICY IF EXISTS promotion_orders_select_staff ON public.promotion_orders;
CREATE POLICY promotion_orders_select_staff
  ON public.promotion_orders
  FOR SELECT
  TO authenticated
  USING (public.get_employee_role() IN ('admin','ops','analyst') OR public.is_admin());

REVOKE INSERT, UPDATE, DELETE ON public.promotion_orders FROM anon, authenticated;
GRANT SELECT ON public.promotion_orders TO authenticated;

COMMENT ON TABLE public.promotion_orders IS
  'Owner-paid optional visibility promotion. Separate from customer_orders (tenant contact plans). Client cannot write; amount is server-computed from plan_id.';
