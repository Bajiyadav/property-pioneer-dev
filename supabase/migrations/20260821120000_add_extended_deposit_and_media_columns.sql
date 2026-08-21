-- Extended Deposit, Maintenance, Furnishing Status, and Video URLs columns
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS deposit NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS maintenance NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS furnishing_status TEXT DEFAULT 'unfurnished',
  ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';

GRANT SELECT (deposit, maintenance, furnishing_status, video_urls)
  ON public.properties TO anon, authenticated;
