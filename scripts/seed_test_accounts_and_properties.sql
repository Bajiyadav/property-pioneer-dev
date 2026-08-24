-- ==============================================================================
-- SEEDHA PROPERTIES - CLEAN DIRECT SQL SCRIPT (SUPABASE COMPATIBLE)
-- ==============================================================================

-- 1. ADD EXTENDED COLUMNS IF MISSING
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS locality TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS bhk_type TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS deposit NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS maintenance NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS furnishing_status TEXT DEFAULT 'unfurnished';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS owner_verification_status TEXT DEFAULT 'pending';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_verification_status TEXT DEFAULT 'pending';

-- 2. INSERT KONDAPUR LISTING
INSERT INTO public.properties (
  id,
  title,
  description,
  address,
  city,
  locality,
  property_type,
  listing_type,
  bhk_type,
  bedrooms,
  bathrooms,
  area_sqft,
  price,
  deposit,
  maintenance,
  furnishing_status,
  owner_name,
  owner_phone,
  images,
  video_urls,
  is_approved,
  is_featured,
  status,
  owner_verification_status,
  property_verification_status
) VALUES (
  'prop-kondapur-101',
  '2 BHK Luxury Flat in Kondapur',
  'Spacious 2 BHK apartment near Botanical Garden Road with parking and 24-7 security.',
  'Flat 302 GLS Heights Kondapur',
  'Hyderabad',
  'Kondapur',
  'apartment',
  'rent',
  '2 BHK',
  2,
  2,
  1250,
  32000,
  64000,
  2500,
  'semi-furnished',
  'Javisetty Naga Pavan Kumar',
  '6301196547',
  ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'],
  ARRAY['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
  true,
  true,
  'available',
  'verified',
  'verified'
) ON CONFLICT (id) DO UPDATE SET is_approved = true, is_featured = true;

-- 3. INSERT MADHAPUR LISTING
INSERT INTO public.properties (
  id,
  title,
  description,
  address,
  city,
  locality,
  property_type,
  listing_type,
  bhk_type,
  bedrooms,
  bathrooms,
  area_sqft,
  price,
  deposit,
  maintenance,
  furnishing_status,
  owner_name,
  owner_phone,
  images,
  video_urls,
  is_approved,
  is_featured,
  status,
  owner_verification_status,
  property_verification_status
) VALUES (
  'prop-madhapur-102',
  '3 BHK Gated Villa in Madhapur',
  'Luxury 3 BHK villa near Cyber Towers with private terrace and garden.',
  'Villa 14 Silicon Valley Madhapur',
  'Hyderabad',
  'Madhapur',
  'villa',
  'rent',
  '3 BHK',
  3,
  3,
  2200,
  65000,
  130000,
  4500,
  'fully-furnished',
  'Suresh Reddy',
  '9876543210',
  ARRAY['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
  ARRAY[]::text[],
  true,
  true,
  'available',
  'verified',
  'verified'
) ON CONFLICT (id) DO UPDATE SET is_approved = true, is_featured = true;

-- 4. INSERT SAMPLE VISIT SCHEDULE
INSERT INTO public.visit_schedules (
  id,
  property_id,
  customer_name,
  customer_phone,
  locality,
  preferred_date,
  preferred_time_slot,
  visit_mode,
  status
) VALUES (
  'visit-kondapur-301',
  'prop-kondapur-101',
  'Kiran Kumar Customer',
  '9988776655',
  'Kondapur',
  CURRENT_DATE + INTERVAL '2 days',
  '11:00 AM - 01:00 PM',
  'In-Person Walkthrough',
  'pending'
) ON CONFLICT (id) DO NOTHING;
