
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event text NOT NULL,
  actor_id uuid,
  subject_type text,
  subject_id text,
  outcome text NOT NULL DEFAULT 'success',
  ip_address text,
  user_agent text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- No policies: audit logs are readable only by server-side admin code.

CREATE INDEX audit_logs_event_created_idx ON public.audit_logs (event, created_at DESC);
CREATE INDEX audit_logs_ip_created_idx ON public.audit_logs (ip_address, created_at DESC);
