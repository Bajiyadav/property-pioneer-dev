-- Migration: Create site_visitors table

CREATE TABLE IF NOT EXISTS public.site_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT,
    city TEXT,
    region TEXT,
    country TEXT,
    latitude FLOAT8,
    longitude FLOAT8,
    user_agent TEXT,
    platform TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    visited_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to insert
CREATE POLICY "Anyone can insert site visitors"
    ON public.site_visitors
    FOR INSERT
    TO public, anon
    WITH CHECK (true);

-- Allow admins to select
CREATE POLICY "Admins can view site visitors"
    ON public.site_visitors
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.employee_access
            WHERE employee_access.user_id = auth.uid()
        )
    );
