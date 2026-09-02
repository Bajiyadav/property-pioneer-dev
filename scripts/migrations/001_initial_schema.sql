-- ===========================================================================
-- SEEDHA PROPERTIES: Production-Grade RDS PostgreSQL + PostGIS Schema (v2)
-- Target Engine: AWS RDS PostgreSQL 16.x with PostGIS 3.4+
-- Idempotent, Non-Destructive Migration File
-- ===========================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Custom Enums
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user', 'customer', 'owner', 'agent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE video_status_enum AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_stage_enum AS ENUM (
    'new', 'contacted', 'qualified', 'visit_scheduled', 'negotiation', 'closed', 'lost'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Users & Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role app_role NOT NULL DEFAULT 'customer',
  assigned_localities TEXT[] DEFAULT '{}',
  agency_name TEXT,
  agent_status TEXT DEFAULT 'active',
  is_verified_agent BOOLEAN DEFAULT false,
  rera_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 4. User Roles Mapping Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- 5. Properties Table (Core Marketplace Inventory)
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  bedrooms INTEGER NOT NULL DEFAULT 1,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  area_sqft NUMERIC NOT NULL DEFAULT 0,
  property_type TEXT NOT NULL DEFAULT 'apartment',
  listing_type TEXT NOT NULL DEFAULT 'rent',
  status TEXT NOT NULL DEFAULT 'available',
  images TEXT[] NOT NULL DEFAULT '{}',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  owner_verification_status TEXT DEFAULT 'pending',
  property_verification_status TEXT DEFAULT 'pending',
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  phone_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  id_verified BOOLEAN DEFAULT false,
  is_zero_brokerage BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  video_url TEXT,
  video_thumbnail_url TEXT,
  video_duration INTEGER,
  video_status video_status_enum DEFAULT 'pending',
  video_uploaded_at TIMESTAMPTZ,
  locality TEXT,
  landmark TEXT,
  metro_station TEXT,
  it_park TEXT,
  college TEXT,
  hospital TEXT,
  region TEXT,
  project_name TEXT,
  bhk_type TEXT,
  area_unit TEXT DEFAULT 'sqft',
  media_status TEXT DEFAULT 'pending',
  media_notes TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location geometry(Point, 4326) GENERATED ALWAYS AS (
    CASE
      WHEN latitude IS NOT NULL AND longitude IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
      ELSE NULL
    END
  ) STORED,
  approx_latitude DOUBLE PRECISION,
  approx_longitude DOUBLE PRECISION,
  balconies INTEGER DEFAULT 0,
  exact_floor INTEGER,
  total_floors INTEGER,
  property_age TEXT,
  facing TEXT,
  parking_covered INTEGER DEFAULT 0,
  parking_open INTEGER DEFAULT 0,
  pincode TEXT,
  available_from DATE,
  rent_negotiable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_city_status ON public.properties(city, status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties USING GIST(location);

-- 6. Enquiries Table
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_property_id ON public.enquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_user_id ON public.enquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at DESC);

-- 7. Property Visits Table
CREATE TABLE IF NOT EXISTS public.property_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT NOT NULL,
  visitor_email TEXT,
  visit_type TEXT NOT NULL DEFAULT 'in_person',
  visit_date DATE NOT NULL,
  visit_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_visits_property_id ON public.property_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_user_id ON public.property_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_status ON public.property_visits(status);

-- 8. Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

-- 9. Rental Agreements Table
CREATE TABLE IF NOT EXISTS public.rental_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  agreement_number TEXT UNIQUE NOT NULL,
  agreement_type TEXT NOT NULL DEFAULT 'residential_lease',
  tenant_type TEXT NOT NULL DEFAULT 'individual',
  status TEXT NOT NULL DEFAULT 'draft',
  owner_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  tenants JSONB NOT NULL DEFAULT '[]'::jsonb,
  property_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  rental_terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_terms JSONB,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_amount NUMERIC NOT NULL DEFAULT 0,
  payment_reference TEXT,
  original_agreement_id UUID,
  document_url TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_agreements_user_id ON public.rental_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_status ON public.rental_agreements(status);

-- 10. KYC Documents Table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_path TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kyc_owner_id ON public.kyc_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON public.kyc_documents(status);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT NOT NULL DEFAULT 'info',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, read_at);

-- 12. Refresh Tokens Table (Native JWT Rotation)
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  device_info TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);

-- 13. Audit Logs Table (Immutable Security Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  outcome TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject_type TEXT,
  subject_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON public.audit_logs(event);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
