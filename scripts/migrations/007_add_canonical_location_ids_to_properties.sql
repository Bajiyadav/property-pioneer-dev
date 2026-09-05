-- ===========================================================================
-- Add Canonical Location IDs to Properties Table
-- Enforces relational linkage to authoritative public.locations master
-- ===========================================================================

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS state_id VARCHAR(100) REFERENCES public.locations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS district_id VARCHAR(100) REFERENCES public.locations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS city_id VARCHAR(100) REFERENCES public.locations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS locality_id VARCHAR(100) REFERENCES public.locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_state_id ON public.properties(state_id);
CREATE INDEX IF NOT EXISTS idx_properties_district_id ON public.properties(district_id);
CREATE INDEX IF NOT EXISTS idx_properties_city_id ON public.properties(city_id);
CREATE INDEX IF NOT EXISTS idx_properties_locality_id ON public.properties(locality_id);
