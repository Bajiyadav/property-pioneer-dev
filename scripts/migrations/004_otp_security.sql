-- ==============================================================================
-- Migration 004: Enterprise OTP Security Schema
-- Target: Neon PostgreSQL Staging
-- Purpose: Ephemeral hashed OTP storage with single-use, rate limits, attempt bounding, and purpose binding
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.otp_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact VARCHAR(255) NOT NULL,
    contact_type VARCHAR(20) NOT NULL, -- EMAIL, PHONE
    purpose VARCHAR(50) NOT NULL,      -- LOGIN, SIGNUP, PASSWORD_RESET, PHONE_VERIFY, EMAIL_VERIFY
    otp_hash VARCHAR(128) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    is_consumed BOOLEAN NOT NULL DEFAULT false,
    consumed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Index for fast challenge lookup by contact, purpose, and active status
CREATE INDEX IF NOT EXISTS idx_otp_challenges_lookup 
ON public.otp_challenges (contact, purpose, is_consumed, expires_at);

-- Index for IP rate limiting queries
CREATE INDEX IF NOT EXISTS idx_otp_challenges_ip 
ON public.otp_challenges (ip_address, created_at);

-- Index for contact rate limiting and cooldown queries
CREATE INDEX IF NOT EXISTS idx_otp_challenges_contact_created 
ON public.otp_challenges (contact, created_at);
