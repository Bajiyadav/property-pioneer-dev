-- Add user_id to enquiries and implement Customer RLS policies

-- 1. Add user_id column
ALTER TABLE public.enquiries
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Add Customer Read Policy
DROP POLICY IF EXISTS "Customers read their own enquiries" ON public.enquiries;
CREATE POLICY "Customers read their own enquiries"
  ON public.enquiries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3. Add Customer Insert Policy
DROP POLICY IF EXISTS "Customers record their own enquiries" ON public.enquiries;
CREATE POLICY "Customers record their own enquiries"
  ON public.enquiries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
