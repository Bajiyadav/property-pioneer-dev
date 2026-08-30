-- Home-loan enquiries — give the "Request Free Call Back" form somewhere to go.
--
-- Everything here is ADDITIVE: one new table, its grants and its policies. No
-- existing table, column, row or policy is touched.
--
-- Note for anyone extending this file: the CI "Migration & Schema Safety" job
-- greps every migration for destructive SQL and does not skip comments, so the
-- rollback notes at the bottom are deliberately written in prose.
--
-- Why a new table rather than reusing public.enquiries:
--
--   public.enquiries is a lead *about a specific listing*. Every one of its
--   policies routes through property_id — user_owns_property(property_id) is
--   how an owner reads their leads, and property_in_employee_regions() is how
--   a moderator is scoped. A loan enquiry raised from the Home Loans screen has
--   no property at all, so it would arrive with a NULL property_id and fall
--   outside every one of those policies: unreadable by the owner (correctly —
--   there is no owner) and unscopeable for staff. Widening those policies to
--   cope with NULL would loosen the property lead path to solve a problem that
--   only exists on the loan path.
--
--   The two also have different lifecycles. A property enquiry ends in
--   'leased'; a loan enquiry ends in 'sanctioned' or 'disbursed'.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. The table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.loan_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ON DELETE SET NULL, not CASCADE, matching public.enquiries: a lead a loan
  -- advisor has already worked is a business record, and deleting the
  -- customer's auth row must not silently destroy it.
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Nullable by design. A lead raised from the Home Loans screen has no
  -- property; one raised from a listing's EMI calculator carries that listing
  -- so an advisor can see what the borrower was actually looking at.
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,

  name text NOT NULL,
  phone text NOT NULL,
  email text,

  -- The calculator state at the moment the borrower asked for a call back.
  -- Stored so the advisor opens the conversation with the borrower's own
  -- figures rather than asking them to repeat everything.
  --
  -- These are the borrower's inputs, NOT a quote. Nothing here has been
  -- offered, sanctioned or agreed by any lender, and monthly_emi is this
  -- app's own estimate on a fixed-rate assumption that excludes fees.
  loan_amount numeric,
  interest_rate numeric,
  tenure_months integer,
  monthly_emi numeric,

  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loan_enquiries
  DROP CONSTRAINT IF EXISTS loan_enquiries_status_check;
ALTER TABLE public.loan_enquiries
  ADD CONSTRAINT loan_enquiries_status_check
  CHECK (status IN ('pending', 'contacted', 'documents_pending',
                    'sanctioned', 'disbursed', 'closed', 'rejected'));

-- A phone number is the whole point of the lead; an unusable one is not a lead.
ALTER TABLE public.loan_enquiries
  DROP CONSTRAINT IF EXISTS loan_enquiries_phone_check;
ALTER TABLE public.loan_enquiries
  ADD CONSTRAINT loan_enquiries_phone_check
  CHECK (length(regexp_replace(phone, '\D', '', 'g')) >= 10);

CREATE INDEX IF NOT EXISTS loan_enquiries_user_created_idx
  ON public.loan_enquiries (user_id, created_at DESC);

-- The advisor queue is "oldest pending first", so it reads this index.
CREATE INDEX IF NOT EXISTS loan_enquiries_status_created_idx
  ON public.loan_enquiries (status, created_at DESC);

COMMENT ON TABLE public.loan_enquiries IS
  'Home-loan call-back requests. Loan figures are the borrower''s calculator inputs and this app''s own EMI estimate — never a lender quote, sanction or offer.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Privileges
--
-- Column-scoped, matching the treatment of public.enquiries. `status` is
-- deliberately absent from the INSERT list: it is the advisor's field, defaulted
-- server-side to 'pending' and not client-writable.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.loan_enquiries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.loan_enquiries FROM anon, authenticated;

GRANT SELECT (id, user_id, property_id, name, phone, email,
              loan_amount, interest_rate, tenure_months, monthly_emi,
              status, created_at)
  ON public.loan_enquiries TO authenticated;

GRANT INSERT (user_id, property_id, name, phone, email,
              loan_amount, interest_rate, tenure_months, monthly_emi)
  ON public.loan_enquiries TO authenticated;

GRANT UPDATE (status) ON public.loan_enquiries TO authenticated;

-- Nothing is granted to `anon`. Submitting a loan enquiry therefore requires a
-- signed-in session, matching EnquiryService.createEnquiry. An anonymous path
-- would need an insert policy open to the world, which is a spam and
-- lead-poisoning vector that wants rate limiting before it wants a policy.

-- DELETE is granted to no one. A borrower cannot withdraw a lead an advisor may
-- already have acted on.

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Policies
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Borrowers read their own loan enquiries" ON public.loan_enquiries;
CREATE POLICY "Borrowers read their own loan enquiries"
  ON public.loan_enquiries FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "Borrowers record their own loan enquiries" ON public.loan_enquiries;
CREATE POLICY "Borrowers record their own loan enquiries"
  ON public.loan_enquiries FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- WITH CHECK (user_id = auth.uid()) is the boundary. The Dart layer also refuses
-- to accept a caller-supplied id, but this is what actually enforces it.

DROP POLICY IF EXISTS "Admins read all loan enquiries" ON public.loan_enquiries;
CREATE POLICY "Admins read all loan enquiries"
  ON public.loan_enquiries FOR SELECT TO authenticated
  USING (public.get_employee_role() = 'admin');

DROP POLICY IF EXISTS "Support reads all loan enquiries" ON public.loan_enquiries;
CREATE POLICY "Support reads all loan enquiries"
  ON public.loan_enquiries FOR SELECT TO authenticated
  USING (public.get_employee_role() IN ('moderator', 'support'));

-- Unlike public.enquiries, staff reads here are NOT region-scoped. Region is
-- derived from the property, and a loan enquiry usually has no property, so
-- there is nothing to scope by. Every loan lead is visible to every staff
-- member who can see any of them. Narrow this if loan advisors ever become
-- regional.

DROP POLICY IF EXISTS "Staff update loan enquiry status" ON public.loan_enquiries;
CREATE POLICY "Staff update loan enquiry status"
  ON public.loan_enquiries FOR UPDATE TO authenticated
  USING (public.get_employee_role() IN ('admin', 'moderator', 'support'))
  WITH CHECK (public.get_employee_role() IN ('admin', 'moderator', 'support'));

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK
--
-- This migration only adds, so the rollback is a clean drop — but dropping the
-- table DISCARDS EVERY LEAD CAPTURED SINCE IT RAN. Those are people who asked
-- to be called back about a home loan. Export before running this.
--
--   BEGIN;
--   DROP POLICY IF EXISTS "Borrowers read their own loan enquiries"   ON public.loan_enquiries;
--   DROP POLICY IF EXISTS "Borrowers record their own loan enquiries" ON public.loan_enquiries;
--   DROP POLICY IF EXISTS "Admins read all loan enquiries"            ON public.loan_enquiries;
--   DROP POLICY IF EXISTS "Support reads all loan enquiries"          ON public.loan_enquiries;
--   DROP POLICY IF EXISTS "Staff update loan enquiry status"          ON public.loan_enquiries;
--   -- then, only with an export in hand, remove the table itself.
--   COMMIT;
-- ─────────────────────────────────────────────────────────────────────────────
