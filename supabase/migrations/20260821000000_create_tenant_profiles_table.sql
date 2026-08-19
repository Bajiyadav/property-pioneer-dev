-- Migration: 20260821000000_create_tenant_profiles_table.sql
-- Description: Tenant profiles with mandatory location capture, commute preferences, and smart matching

CREATE TABLE IF NOT EXISTS public.tenant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  company_name VARCHAR(100),
  profession VARCHAR(100),
  annual_salary_min INT,
  annual_salary_max INT,
  budget_min INT NOT NULL DEFAULT 10000,
  budget_max INT NOT NULL DEFAULT 40000,
  preferred_bhk TEXT[] NOT NULL DEFAULT '{"1 BHK", "2 BHK"}',
  move_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_vegetarian BOOLEAN DEFAULT FALSE,
  pets_allowed BOOLEAN DEFAULT FALSE,
  preferred_furnishing VARCHAR(50) DEFAULT 'semi-furnished',
  preferred_building_type VARCHAR(50) DEFAULT 'Apartment',
  special_amenities TEXT[] DEFAULT '{}',
  
  -- MANDATORY LOCATION
  primary_city VARCHAR(100) NOT NULL DEFAULT 'Hyderabad',
  primary_locality VARCHAR(100) NOT NULL DEFAULT 'Madhapur',
  primary_latitude DECIMAL(10, 8),
  primary_longitude DECIMAL(11, 8),
  
  secondary_cities TEXT[] DEFAULT '{}',
  
  -- Commute preferences
  office_name VARCHAR(100),
  office_latitude DECIMAL(10, 8),
  office_longitude DECIMAL(11, 8),
  max_commute_minutes INT DEFAULT 30,
  
  profile_completeness INT DEFAULT 85,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast location & budget matching
CREATE INDEX IF NOT EXISTS idx_tenant_city_locality ON public.tenant_profiles(primary_city, primary_locality);
CREATE INDEX IF NOT EXISTS idx_tenant_budget ON public.tenant_profiles(budget_min, budget_max);
CREATE INDEX IF NOT EXISTS idx_tenant_user_id ON public.tenant_profiles(user_id);

-- Enable RLS
ALTER TABLE public.tenant_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own tenant profile" ON public.tenant_profiles;
CREATE POLICY "Users can view their own tenant profile"
  ON public.tenant_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert/update their own tenant profile" ON public.tenant_profiles;
CREATE POLICY "Users can insert/update their own tenant profile"
  ON public.tenant_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all tenant profiles" ON public.tenant_profiles;
CREATE POLICY "Admins can manage all tenant profiles"
  ON public.tenant_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
