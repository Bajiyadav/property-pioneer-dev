-- 1. Create tenant_contact_quotas table
CREATE TABLE IF NOT EXISTS public.tenant_contact_quotas (
    tenant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
    unlocked_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (tenant_id, property_id)
);

-- Enable RLS on the quotas table
ALTER TABLE public.tenant_contact_quotas ENABLE ROW LEVEL SECURITY;

-- Tenants can read their own quotas
CREATE POLICY "Tenants can view their own contact quotas"
    ON public.tenant_contact_quotas
    FOR SELECT
    TO authenticated
    USING (auth.uid() = tenant_id);

-- 2. Cleanup Mock Data
-- Note: Doing this in a migration deletes it for everyone in production if this is pushed.
DELETE FROM public.properties 
WHERE owner_phone IS DISTINCT FROM '7331126322' 
  AND owner_phone IS DISTINCT FROM '917331126322';
