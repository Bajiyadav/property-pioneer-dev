-- Add created_by_agent_id to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS created_by_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create function to auto-link properties to new owners based on phone number
CREATE OR REPLACE FUNCTION public.link_agent_properties_to_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_phone_val text;
BEGIN
  -- Extract phone from profile
  owner_phone_val := NEW.phone;
  IF owner_phone_val IS NULL THEN
    RETURN NEW;
  END IF;

  -- Update any properties that have the same phone number and no owner_id
  UPDATE public.properties
  SET owner_id = NEW.id
  WHERE owner_id IS NULL
    AND owner_phone = owner_phone_val;

  RETURN NEW;
END;
$$;

-- Trigger to run when a profile is created or its phone number is updated
DROP TRIGGER IF EXISTS on_profile_created_link_properties ON public.profiles;
CREATE TRIGGER on_profile_created_link_properties
  AFTER INSERT OR UPDATE OF phone ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.link_agent_properties_to_owner();
