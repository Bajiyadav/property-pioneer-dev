
CREATE TABLE public.enquiries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  message text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.enquiries TO service_role;

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- No policies: only service_role (server-side admin) may access.

CREATE INDEX enquiries_ip_created_idx ON public.enquiries (ip_address, created_at DESC);
CREATE INDEX enquiries_property_created_idx ON public.enquiries (property_id, created_at DESC);
