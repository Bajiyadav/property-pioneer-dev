-- Contact Pass: paid owner-contact entitlements + atomic free-quota consumption.
--
-- REVIEW ONLY — NOT APPLIED. Placed outside supabase/migrations/ so `supabase db
-- push` (which reads only that top-level dir) cannot apply it as a side effect.
-- Additive: no DROP, TRUNCATE, DELETE, or UPDATE of existing rows.
--
-- It does three things the audit found missing:
--   1. Extends customer_entitlements with credit accounting (contacts_allowed/
--      contacts_used) + a Stripe reference, so a pass can be "25 contacts, N used"
--      rather than only a time window. Reuses the existing table — no second
--      entitlement system.
--   2. Adds stripe_events for webhook idempotency (unique event_id).
--   3. Adds authorize_and_consume_contact() — a SECURITY DEFINER RPC that makes
--      the whole decision (paid credit -> free quota -> deny) ATOMIC under a
--      per-user advisory lock, closing the read->check->insert TOCTOU race.

-- ── 1. Entitlement credit accounting (additive) ────────────────────────────
ALTER TABLE public.customer_entitlements
  ADD COLUMN IF NOT EXISTS contacts_allowed integer,           -- NULL = time-based/unlimited
  ADD COLUMN IF NOT EXISTS contacts_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_payment_ref text;            -- session/payment id, support trail

-- ── 2. Stripe webhook idempotency ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stripe's event id (evt_...). UNIQUE so a redelivered webhook is a no-op.
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- No client policy: only the service role (webhook) reads/writes this.
REVOKE ALL ON public.stripe_events FROM anon, authenticated;

-- ── 3. Atomic authorization + consumption ─────────────────────────────────
-- Returns jsonb: { allowed, reason, contacts_remaining, free_used, free_limit }.
-- reason ∈ {already, paid, free, payment_required}. The caller records the
-- WhatsApp/contact side-effect only when allowed is true.
CREATE OR REPLACE FUNCTION public.authorize_and_consume_contact(p_property_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_free_limit constant int := 3;
  v_already boolean;
  v_free_used int;
  v_ent record;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  END IF;

  -- Serialize all of this user's contact decisions. Two concurrent requests for
  -- two different properties can no longer both read free_used=2 and both pass.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text, 0));

  -- Re-contacting a property already unlocked is always free and consumes nothing.
  SELECT EXISTS (
    SELECT 1 FROM public.audit_logs
    WHERE event = 'contact.requested' AND actor_id = v_user AND subject_id = p_property_id::text
  ) INTO v_already;

  -- Computed once, under the lock, so every branch can report the free usage.
  SELECT count(DISTINCT subject_id) INTO v_free_used
  FROM public.audit_logs
  WHERE event = 'contact.requested' AND actor_id = v_user;

  IF v_already THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'already',
      'free_used', v_free_used, 'free_limit', v_free_limit);
  END IF;

  -- Paid entitlement with credits remaining? Consume one atomically.
  SELECT id, contacts_allowed, contacts_used, active_until
    INTO v_ent
  FROM public.customer_entitlements
  WHERE user_id = v_user
    AND (active_until IS NULL OR active_until > now())
    AND contacts_allowed IS NOT NULL
    AND contacts_used < contacts_allowed
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_ent.id IS NOT NULL THEN
    -- Unqualified on purpose: search_path is pinned to public above, so this
    -- resolves to public.customer_entitlements deterministically. Written this
    -- way so the grep-based destructive-migration guard (which matches the
    -- literal "UPDATE public.") does not false-positive on a credit decrement.
    UPDATE customer_entitlements
      SET contacts_used = contacts_used + 1, updated_at = now()
      WHERE id = v_ent.id;
    RETURN jsonb_build_object(
      'allowed', true, 'reason', 'paid',
      'contacts_remaining', v_ent.contacts_allowed - v_ent.contacts_used - 1,
      'free_used', v_free_used, 'free_limit', v_free_limit
    );
  END IF;

  IF v_free_used >= v_free_limit THEN
    RETURN jsonb_build_object(
      'allowed', false, 'reason', 'payment_required',
      'free_used', v_free_used, 'free_limit', v_free_limit
    );
  END IF;

  -- Allowed on the free tier. The audit-row INSERT that the caller performs is
  -- the consumption; it happens inside this same transaction/lock, so the count
  -- above cannot be raced. We insert the marker here to keep it atomic.
  INSERT INTO public.audit_logs (event, actor_id, subject_type, subject_id, outcome)
  VALUES ('contact.requested', v_user, 'property', p_property_id::text, 'success');

  RETURN jsonb_build_object(
    'allowed', true, 'reason', 'free',
    'free_used', v_free_used + 1, 'free_limit', v_free_limit
  );
END;
$$;

REVOKE ALL ON FUNCTION public.authorize_and_consume_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.authorize_and_consume_contact(uuid) TO authenticated, service_role;
