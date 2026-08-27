-- Migration: 20260829000000_create_rental_agreements_table.sql
-- Description: Complete rental agreement lifecycle management with strict RLS and JSONB schema

CREATE TABLE IF NOT EXISTS public.rental_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_number VARCHAR(32) NOT NULL UNIQUE,
  agreement_type VARCHAR(32) NOT NULL DEFAULT 'residential' CHECK (agreement_type IN ('residential', 'commercial')),
  tenant_type VARCHAR(32) NOT NULL DEFAULT 'single' CHECK (tenant_type IN ('single', 'multiple')),
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'REVIEW', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 'SIGNING_PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
  
  -- Structured data payloads
  owner_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  tenants JSONB NOT NULL DEFAULT '[]'::jsonb,
  property_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  rental_terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  clauses JSONB NOT NULL DEFAULT '{}'::jsonb,
  custom_terms TEXT[] DEFAULT '{}',
  
  -- Payment & execution tracking
  payment_status VARCHAR(32) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PENDING', 'PAID', 'REFUNDED')),
  payment_amount NUMERIC(10,2) DEFAULT 0,
  payment_reference VARCHAR(128),
  document_url TEXT,
  
  -- Duplicate / Renewal lineage
  original_agreement_id UUID REFERENCES public.rental_agreements(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_rental_agreements_user_id ON public.rental_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_status ON public.rental_agreements(status);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_number ON public.rental_agreements(agreement_number);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_created_at ON public.rental_agreements(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.rental_agreements ENABLE ROW LEVEL SECURITY;

-- 1. Authenticated users can view only their own agreements
DROP POLICY IF EXISTS "Users can view their own rental agreements" ON public.rental_agreements;
CREATE POLICY "Users can view their own rental agreements"
  ON public.rental_agreements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Authenticated users can create agreements for themselves
DROP POLICY IF EXISTS "Users can insert their own rental agreements" ON public.rental_agreements;
CREATE POLICY "Users can insert their own rental agreements"
  ON public.rental_agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Authenticated users can update their own agreements
DROP POLICY IF EXISTS "Users can update their own rental agreements" ON public.rental_agreements;
CREATE POLICY "Users can update their own rental agreements"
  ON public.rental_agreements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Authenticated users can only delete their own DRAFT agreements
DROP POLICY IF EXISTS "Users can delete their own draft rental agreements" ON public.rental_agreements;
CREATE POLICY "Users can delete their own draft rental agreements"
  ON public.rental_agreements
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'DRAFT');

-- 5. Admins can view and manage all agreements
DROP POLICY IF EXISTS "Admins can view and manage all rental agreements" ON public.rental_agreements;
CREATE POLICY "Admins can manage all rental agreements"
  ON public.rental_agreements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
