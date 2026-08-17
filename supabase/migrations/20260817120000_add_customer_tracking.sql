-- Customer activity tracking: property views and search history.
--
-- Design constraints this encodes:
--
--  * A row is the visitor's own data. RLS scopes reads to `auth.uid() = user_id`,
--    so one account can never read another's history, and anonymous rows
--    (user_id IS NULL) are readable by nobody through the client at all.
--  * Clients may INSERT their own rows and nothing else. No UPDATE, no DELETE,
--    no SELECT of other people's rows. Aggregates for the admin dashboard are
--    read server-side with the service role.
--  * `user_id` is nullable so a signed-out visit can still be counted, but an
--    anonymous row carries no identifier that could re-link it to a person —
--    no IP, no fingerprint, no cookie id. It is a bare counter.
--  * ON DELETE CASCADE, so "delete my account" removes this history with it
--    rather than leaving orphans behind.
--
-- Additive and idempotent: creates two tables and their policies, alters
-- nothing that exists, drops nothing.

-- ── property_views ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.property_views (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id  text NOT NULL,
  viewed_at    timestamptz NOT NULL DEFAULT now(),
  -- Seconds on the page. Bounded so a stuck tab cannot poison aggregates.
  time_spent   integer CHECK (time_spent IS NULL OR (time_spent >= 0 AND time_spent <= 86400)),
  device       text CHECK (device IS NULL OR device IN ('mobile', 'tablet', 'desktop'))
);

CREATE INDEX IF NOT EXISTS property_views_user_idx     ON public.property_views (user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS property_views_property_idx ON public.property_views (property_id, viewed_at DESC);

ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.property_views TO authenticated;
GRANT INSERT          ON public.property_views TO anon;
GRANT ALL             ON public.property_views TO service_role;

DROP POLICY IF EXISTS "Users read their own property views" ON public.property_views;
CREATE POLICY "Users read their own property views"
  ON public.property_views FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- A signed-in visitor may only file a view under their own id; a signed-out one
-- may only file an anonymous row. Neither can attribute activity to anyone else.
DROP POLICY IF EXISTS "Users record their own property views" ON public.property_views;
CREATE POLICY "Users record their own property views"
  ON public.property_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anonymous visitors record unattributed views" ON public.property_views;
CREATE POLICY "Anonymous visitors record unattributed views"
  ON public.property_views FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

-- ── search_history ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.search_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  query       text,
  city        text,
  locality    text,
  listing     text CHECK (listing IS NULL OR listing IN ('rent', 'sale')),
  filters     jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_count integer CHECK (result_count IS NULL OR result_count >= 0),
  searched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_history_user_idx ON public.search_history (user_id, searched_at DESC);
CREATE INDEX IF NOT EXISTS search_history_city_idx ON public.search_history (city, searched_at DESC);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.search_history TO authenticated;
GRANT INSERT          ON public.search_history TO anon;
GRANT ALL             ON public.search_history TO service_role;

DROP POLICY IF EXISTS "Users read their own searches" ON public.search_history;
CREATE POLICY "Users read their own searches"
  ON public.search_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users record their own searches" ON public.search_history;
CREATE POLICY "Users record their own searches"
  ON public.search_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anonymous visitors record unattributed searches" ON public.search_history;
CREATE POLICY "Anonymous visitors record unattributed searches"
  ON public.search_history FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);
