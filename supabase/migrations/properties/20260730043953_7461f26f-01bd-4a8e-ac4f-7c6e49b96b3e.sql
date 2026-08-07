REVOKE SELECT ON public.properties FROM authenticated;
REVOKE SELECT ON public.properties FROM anon;

GRANT SELECT (
  id, title, description, price, city, address, bedrooms, bathrooms,
  area_sqft, property_type, listing_type, status, images,
  is_approved, is_featured, created_at, updated_at
) ON public.properties TO anon;

GRANT SELECT (
  id, title, description, price, city, address, bedrooms, bathrooms,
  area_sqft, property_type, listing_type, status, images,
  is_approved, is_featured, created_at, updated_at
) ON public.properties TO authenticated;

DROP POLICY IF EXISTS "Public can view approved available properties" ON public.properties;
CREATE POLICY "Public can view approved properties"
  ON public.properties FOR SELECT
  TO anon, authenticated
  USING (is_approved = true);

GRANT ALL ON public.properties TO service_role;