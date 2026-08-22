-- ===========================================================================
-- Strict Profiles RLS Enforcement
--
-- Security fix:
-- 1. Drops the permissive "Public profiles read access" policy which allowed
--    any user (anonymous or authenticated) to read all profile rows.
-- 2. Grants SELECT to anon and authenticated with RLS enabled.
-- 3. Strictly enforces that users can ONLY read and update their own profile
--    row (auth.uid() = id). For anonymous callers (auth.uid() IS NULL), RLS
--    evaluates to false and returns 0 rows.
-- 4. Service role retains full administrative access for server functions.
-- ===========================================================================

-- 1. Table level RLS and Grants
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2. Drop legacy / permissive policies
DROP POLICY IF EXISTS "Public profiles read access" ON public.profiles;
DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users upsert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert their own profile" ON public.profiles;

-- 3. Create strict user-scoped policies
CREATE POLICY "Users read their own profile"
  ON public.profiles FOR SELECT TO public
  USING (auth.uid() = id);

CREATE POLICY "Users insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
