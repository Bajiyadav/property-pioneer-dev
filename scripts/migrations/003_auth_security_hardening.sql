-- ============================================================================
-- Migration: 003_auth_security_hardening.sql
-- Description: Adds Token Family tracking, revocation flags, and security audit
--              structures for production-grade JWT refresh token rotation.
-- Target: Neon Staging Database ONLY (Do NOT run on Production Supabase)
-- ============================================================================

-- 1. Extend refresh_tokens with token family and revocation metadata
ALTER TABLE public.refresh_tokens
  ADD COLUMN IF NOT EXISTS family_id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS replaced_by_hash TEXT;

-- 2. Indexes for O(1) Token Hash and Family lookup & revocation
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_id ON public.refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON public.refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_revoked ON public.refresh_tokens(user_id, is_revoked);

-- 3. Security Audit Logs Table if not already present
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(64) NOT NULL,
  user_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user ON public.security_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event ON public.security_audit_logs(event_type, created_at DESC);
