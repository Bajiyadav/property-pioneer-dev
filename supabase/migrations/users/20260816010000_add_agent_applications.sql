-- Migration: Add agent_applications table with RLS
CREATE TABLE IF NOT EXISTS public.agent_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Hyderabad',
    experience_years TEXT NOT NULL,
    preferred_areas TEXT[] NOT NULL DEFAULT '{}',
    languages TEXT[] NOT NULL DEFAULT '{}',
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for lookup and admin sorting
CREATE INDEX IF NOT EXISTS idx_agent_applications_status ON public.agent_applications(status);
CREATE INDEX IF NOT EXISTS idx_agent_applications_created_at ON public.agent_applications(created_at DESC);

-- Enable RLS
ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can submit an agent application"
    ON public.agent_applications
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view own application"
    ON public.agent_applications
    FOR SELECT
    USING (auth.uid() = user_id OR (auth.jwt() ->> 'email') = email);

CREATE POLICY "Admins have full access to agent applications"
    ON public.agent_applications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
