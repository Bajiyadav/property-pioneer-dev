-- ============================================================================
-- Migration: 002_staging_compatibility.sql
-- Description: Staging schema compatibility and bi-directional synchronisation
--              between Java 21 / Spring Boot backend and Seedha marketplace tables.
-- Target: NEON STAGING DATABASE ONLY (Do NOT apply directly to Production).
-- ============================================================================

-- 1. Users Table (Independent Java Auth & Session Management)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'SEEKER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 2. Property Column Compatibility & Bi-directional Synchronization
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS state_name TEXT DEFAULT 'Telangana';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS city_name TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bhk INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS builtup_area_sqft INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS furnishing_status TEXT DEFAULT 'UNFURNISHED';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS security_deposit NUMERIC DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS maintenance_charges NUMERIC DEFAULT 0;
ALTER TABLE public.properties ALTER COLUMN city DROP NOT NULL;

-- Backfill initial values from legacy columns
UPDATE public.properties SET city_name = city WHERE city_name IS NULL AND city IS NOT NULL;
UPDATE public.properties SET bhk = bedrooms WHERE bhk IS NULL AND bedrooms IS NOT NULL;
UPDATE public.properties SET builtup_area_sqft = area_sqft::integer WHERE builtup_area_sqft IS NULL AND area_sqft IS NOT NULL;
UPDATE public.properties SET is_verified = is_approved WHERE is_verified IS NULL AND is_approved IS NOT NULL;

-- Trigger for bi-directional property field synchronization
CREATE OR REPLACE FUNCTION sync_property_city_fields() 
RETURNS trigger AS $$
BEGIN
    IF NEW.city IS NULL AND NEW.city_name IS NOT NULL THEN
        NEW.city := NEW.city_name;
    ELSIF NEW.city_name IS NULL AND NEW.city IS NOT NULL THEN
        NEW.city_name := NEW.city;
    END IF;
    
    IF NEW.bedrooms IS NULL AND NEW.bhk IS NOT NULL THEN
        NEW.bedrooms := NEW.bhk;
    ELSIF NEW.bhk IS NULL AND NEW.bedrooms IS NOT NULL THEN
        NEW.bhk := NEW.bedrooms;
    END IF;

    IF NEW.area_sqft IS NULL AND NEW.builtup_area_sqft IS NOT NULL THEN
        NEW.area_sqft := NEW.builtup_area_sqft;
    ELSIF NEW.builtup_area_sqft IS NULL AND NEW.area_sqft IS NOT NULL THEN
        NEW.builtup_area_sqft := NEW.area_sqft::integer;
    END IF;

    IF NEW.is_approved IS NULL AND NEW.is_verified IS NOT NULL THEN
        NEW.is_approved := NEW.is_verified;
    ELSIF NEW.is_verified IS NULL AND NEW.is_approved IS NOT NULL THEN
        NEW.is_verified := NEW.is_approved;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_property_city ON public.properties;
CREATE TRIGGER trg_sync_property_city
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION sync_property_city_fields();

-- 3. Site Visits Table
CREATE TABLE IF NOT EXISTS public.site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  seeker_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  visit_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'REQUESTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_visits_property_id ON public.site_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_seeker_id ON public.site_visits(seeker_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_owner_id ON public.site_visits(owner_id);

-- 4. Home Loan Enquiries Table
CREATE TABLE IF NOT EXISTS public.home_loan_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  loan_amount NUMERIC NOT NULL,
  monthly_income NUMERIC NOT NULL,
  employment_type TEXT NOT NULL,
  city_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_home_loan_enquiries_user_id ON public.home_loan_enquiries(user_id);

-- 5. Notifications Compatibility
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'GENERAL';

UPDATE public.notifications SET message = body WHERE message IS NULL AND body IS NOT NULL;

-- 6. Enquiries Compatibility
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS seeker_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';
ALTER TABLE public.enquiries ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.enquiries ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.enquiries ALTER COLUMN email DROP NOT NULL;

-- 7. Rental Agreements Compatibility
ALTER TABLE public.rental_agreements ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.rental_agreements ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.rental_agreements ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC DEFAULT 0;
ALTER TABLE public.rental_agreements ADD COLUMN IF NOT EXISTS security_deposit NUMERIC DEFAULT 0;
ALTER TABLE public.rental_agreements ADD COLUMN IF NOT EXISTS lease_start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.rental_agreements ADD COLUMN IF NOT EXISTS lease_duration_months INTEGER DEFAULT 11;
ALTER TABLE public.rental_agreements ADD COLUMN IF NOT EXISTS agreement_pdf_url TEXT;
ALTER TABLE public.rental_agreements ALTER COLUMN agreement_number DROP NOT NULL;
ALTER TABLE public.rental_agreements ALTER COLUMN user_id DROP NOT NULL;

-- 8. Synchronize Users to Profiles for Foreign Key Integrity
CREATE OR REPLACE FUNCTION sync_user_to_profile() 
RETURNS trigger AS $$
DECLARE
    mapped_role app_role;
BEGIN
    IF LOWER(COALESCE(NEW.role, '')) = 'owner' THEN
        mapped_role := 'owner'::app_role;
    ELSIF LOWER(COALESCE(NEW.role, '')) = 'admin' THEN
        mapped_role := 'admin'::app_role;
    ELSIF LOWER(COALESCE(NEW.role, '')) = 'agent' THEN
        mapped_role := 'agent'::app_role;
    ELSE
        mapped_role := 'customer'::app_role;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, phone, role)
    VALUES (NEW.id, NEW.email, NEW.full_name, NEW.phone, mapped_role)
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email, 
        full_name = EXCLUDED.full_name, 
        phone = EXCLUDED.phone;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_user_to_profile ON public.users;
CREATE TRIGGER trg_sync_user_to_profile
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION sync_user_to_profile();
