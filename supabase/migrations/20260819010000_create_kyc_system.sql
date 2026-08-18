-- SEEDHA PROPERTIES: Owner KYC Verification System
-- Migration: 20260819010000_create_kyc_system.sql

CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'aadhar', 'pan', 'electricity_bill', 'property_tax'
  file_path TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_kyc_owner_id ON public.kyc_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON public.kyc_documents(status);

-- Enable RLS
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- 1. Owners can view only their own KYC submissions
DROP POLICY IF EXISTS "Owners can view own KYC" ON public.kyc_documents;
CREATE POLICY "Owners can view own KYC" ON public.kyc_documents
  FOR SELECT
  USING (
    auth.uid() = owner_id
  );

-- 2. Owners can upload/insert their own KYC documents
DROP POLICY IF EXISTS "Owners can upload KYC" ON public.kyc_documents;
CREATE POLICY "Owners can upload KYC" ON public.kyc_documents
  FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
  );

-- 3. Storage Bucket Configuration for KYC
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;
