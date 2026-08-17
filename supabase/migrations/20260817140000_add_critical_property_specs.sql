-- Add critical property specs
ALTER TABLE public.properties
ADD COLUMN property_age text,
ADD COLUMN total_floors integer,
ADD COLUMN exact_floor integer,
ADD COLUMN balconies integer,
ADD COLUMN parking_covered integer,
ADD COLUMN parking_open integer,
ADD COLUMN facing text,
ADD COLUMN available_from date,
ADD COLUMN rent_negotiable boolean DEFAULT false;

-- The properties table has RLS, but standard columns inherit table-level permissions 
-- for INSERT and UPDATE. Thus, owners can automatically populate these fields.
