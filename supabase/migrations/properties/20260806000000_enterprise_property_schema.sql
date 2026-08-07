-- Enterprise Property & Verification Schema Upgrade
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS owner_verification_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS property_verification_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verified_by UUID,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_zero_brokerage BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
