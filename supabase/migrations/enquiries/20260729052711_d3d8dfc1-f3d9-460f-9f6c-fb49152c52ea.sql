
-- Restrict column access on public.properties so anonymous visitors cannot read owner contact info
REVOKE SELECT ON public.properties FROM anon;
REVOKE SELECT ON public.properties FROM authenticated;

GRANT SELECT (
  id, title, description, price, city, address,
  bedrooms, bathrooms, area_sqft, property_type, listing_type,
  status, images, is_approved, is_featured, created_at, updated_at
) ON public.properties TO anon;

GRANT SELECT (
  id, title, description, price, city, address,
  bedrooms, bathrooms, area_sqft, property_type, listing_type,
  status, images, is_approved, is_featured, created_at, updated_at,
  owner_name, owner_phone, owner_whatsapp, owner_email
) ON public.properties TO authenticated;
