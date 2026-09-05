-- ==============================================================================
-- Migration: 008_create_property_management_tables.sql
-- Target:    staging (Neon) / PostgreSQL 16
--
-- Seedha Property Management & Rental Management Tables
-- Strictly private internal notes for Seedha Admins.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.property_management_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
    assigned_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_manager_name VARCHAR(120),
    owner_contact_name VARCHAR(120),
    owner_contact_phone VARCHAR(32) NOT NULL,
    owner_contact_email VARCHAR(120),
    services_requested TEXT[] NOT NULL DEFAULT ARRAY['TENANT_SCREENING', 'RENT_COLLECTION', 'MAINTENANCE']::TEXT[],
    owner_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_pmr_status CHECK (
        status IN (
            'SUBMITTED',
            'UNDER_REVIEW',
            'MORE_INFORMATION_REQUIRED',
            'APPROVED',
            'MANAGEMENT_ACTIVE',
            'COMPLETED',
            'REJECTED',
            'CANCELLED'
        )
    )
);

-- Ensure only one active management request per property at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_pmr_one_active_per_property
ON public.property_management_requests (property_id)
WHERE status NOT IN ('COMPLETED', 'REJECTED', 'CANCELLED');

CREATE INDEX IF NOT EXISTS idx_pmr_owner_id ON public.property_management_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_pmr_status ON public.property_management_requests(status);
CREATE INDEX IF NOT EXISTS idx_pmr_created_at ON public.property_management_requests(created_at DESC);

-- Internal Admin Notes table: Strictly private to authorized Seedha staff
CREATE TABLE IF NOT EXISTS public.property_management_internal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    management_request_id UUID NOT NULL REFERENCES public.property_management_requests(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name VARCHAR(120) NOT NULL,
    author_role VARCHAR(32) NOT NULL DEFAULT 'ADMIN',
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pmin_request_id ON public.property_management_internal_notes(management_request_id, created_at ASC);

-- Conditional Row-Level Security (RLS) if auth schema exists (Supabase environment)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        ALTER TABLE public.property_management_requests ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.property_management_internal_notes ENABLE ROW LEVEL SECURITY;

        -- Owner can view and create their own requests
        DROP POLICY IF EXISTS pmr_owner_select ON public.property_management_requests;
        CREATE POLICY pmr_owner_select ON public.property_management_requests
        FOR SELECT USING (
            auth.uid() = owner_id
            OR EXISTS (
                SELECT 1 FROM public.user_roles ur
                WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
            )
        );

        DROP POLICY IF EXISTS pmr_owner_insert ON public.property_management_requests;
        CREATE POLICY pmr_owner_insert ON public.property_management_requests
        FOR INSERT WITH CHECK (
            auth.uid() = owner_id
        );

        DROP POLICY IF EXISTS pmr_admin_all ON public.property_management_requests;
        CREATE POLICY pmr_admin_all ON public.property_management_requests
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.user_roles ur
                WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
            )
        );

        -- STRICT PRIVACY: Internal notes have ZERO owner policy! Only Admins can view/edit.
        DROP POLICY IF EXISTS pmin_admin_all ON public.property_management_internal_notes;
        CREATE POLICY pmin_admin_all ON public.property_management_internal_notes
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.user_roles ur
                WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
            )
        );
    END IF;
END $$;
