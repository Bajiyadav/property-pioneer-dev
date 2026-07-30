REVOKE ALL ON public.enquiries FROM anon, authenticated;
REVOKE ALL ON public.audit_logs FROM anon, authenticated;

GRANT ALL ON public.enquiries TO service_role;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No client access to enquiries" ON public.enquiries;
CREATE POLICY "No client access to enquiries"
  ON public.enquiries FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No client access to audit logs" ON public.audit_logs;
CREATE POLICY "No client access to audit logs"
  ON public.audit_logs FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);