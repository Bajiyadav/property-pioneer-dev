-- Payment webhook idempotency ledger.
--
-- NOT auto-applied: `supabase db push` only reads supabase/migrations/*.sql, so
-- files here are reviewed and applied deliberately (alongside the quarantined
-- promotion_orders migration) — never on a deploy, never to production without
-- explicit action.
--
-- WHY: a payment gateway does not promise exactly-once webhook delivery. The
-- same event can arrive several times, and out of order. This table records
-- each provider event id once; the webhook handler inserts here first and a
-- UNIQUE collision means "already processed" — so a redelivery changes no
-- order state and grants no service or notification twice.
--
-- SAFETY: purely additive. One new table, no existing row touched.

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 'razorpay' | 'stripe'. One id space per provider.
  provider text NOT NULL,

  -- The provider's own event id. UNIQUE per provider is the idempotency key.
  event_id text NOT NULL,
  event_type text NOT NULL,

  -- Optional linkage for reconciliation/debugging. No secrets, no signatures.
  gateway_order_id text,
  gateway_payment_id text,

  received_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT payment_webhook_events_provider_event_key UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS payment_webhook_events_order_idx
  ON public.payment_webhook_events (gateway_order_id);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- This ledger is written and read only by the server (service role). No client
-- policy: there is nothing here a browser or app should read or write.
REVOKE ALL ON public.payment_webhook_events FROM anon, authenticated;

COMMENT ON TABLE public.payment_webhook_events IS
  'Idempotency ledger for payment webhooks. One row per provider event id; a duplicate insert means already processed. Server-only.';
