-- Search sessions table for zero-friction location-first discovery tracking
CREATE TABLE IF NOT EXISTS public.search_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    city VARCHAR(100) NOT NULL,
    locality VARCHAR(100),
    searched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    results_count INT DEFAULT 0,
    filters JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing for quick regional analytics & locality trends
CREATE INDEX IF NOT EXISTS idx_search_sessions_city_locality ON public.search_sessions(city, locality);
CREATE INDEX IF NOT EXISTS idx_search_sessions_searched_at ON public.search_sessions(searched_at DESC);

-- Enable RLS
ALTER TABLE public.search_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for public search activity
CREATE POLICY "Public search session capture"
    ON public.search_sessions
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow authenticated users / admins to read aggregated sessions
CREATE POLICY "Admin read search sessions"
    ON public.search_sessions
    FOR SELECT
    TO authenticated
    USING (true);
