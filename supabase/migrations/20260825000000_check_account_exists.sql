CREATE OR REPLACE FUNCTION public.check_account_exists(search_email text, search_phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = search_email 
       OR (search_phone IS NOT NULL AND search_phone != '' AND phone = search_phone)
  ) INTO account_exists;
  
  RETURN account_exists;
END;
$$;
