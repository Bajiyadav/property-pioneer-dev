-- Admin email-OTP step-up state.  REVIEW-ONLY: lives outside supabase/migrations
-- so `supabase db push` in CD cannot auto-apply it.  DO NOT apply to production
-- without explicit approval + migration-ledger reconciliation.
--
-- Additive and idempotent.  Service-role only: table grants are revoked from
-- anon/authenticated (checked BEFORE RLS), so no client can read/write step-up
-- state under any policy.  The trusted server path (supabaseAdmin) is the only
-- writer/reader.

CREATE TABLE IF NOT EXISTS public.admin_step_up (
  user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  otp_hash       text,
  otp_expires_at timestamptz,
  attempts       integer NOT NULL DEFAULT 0,
  locked_until   timestamptz,
  verified_until timestamptz,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_step_up ENABLE ROW LEVEL SECURITY;

-- Defense in depth: grants are checked before RLS.  Only the service role
-- (which bypasses both) may touch this table.
REVOKE ALL ON public.admin_step_up FROM anon, authenticated;
