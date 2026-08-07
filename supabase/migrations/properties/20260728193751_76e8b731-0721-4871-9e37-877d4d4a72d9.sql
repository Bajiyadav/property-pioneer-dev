
CREATE TYPE public.property_type AS ENUM ('apartment','house','villa','studio','penthouse');
CREATE TYPE public.listing_type AS ENUM ('rent','sale');
CREATE TYPE public.property_status AS ENUM ('available','rented','sold');

CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  bedrooms INT NOT NULL DEFAULT 0,
  bathrooms INT NOT NULL DEFAULT 0,
  area_sqft INT NOT NULL DEFAULT 0,
  property_type public.property_type NOT NULL DEFAULT 'apartment',
  listing_type public.listing_type NOT NULL DEFAULT 'rent',
  status public.property_status NOT NULL DEFAULT 'available',
  images TEXT[] NOT NULL DEFAULT '{}',
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,
  owner_whatsapp TEXT,
  owner_email TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX properties_city_idx ON public.properties(city);
CREATE INDEX properties_price_idx ON public.properties(price);
CREATE INDEX properties_bedrooms_idx ON public.properties(bedrooms);
CREATE INDEX properties_listing_type_idx ON public.properties(listing_type);

GRANT SELECT ON public.properties TO anon;
GRANT SELECT ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved available properties"
  ON public.properties FOR SELECT
  USING (is_approved = true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed demo listings
INSERT INTO public.properties (title, description, price, city, address, bedrooms, bathrooms, area_sqft, property_type, listing_type, images, owner_name, owner_phone, owner_whatsapp, owner_email, is_featured) VALUES
('Sunlit 2BHK in Bandra West', 'A bright, airy 2-bedroom flat just minutes from Carter Road. Modular kitchen, wide balcony overlooking a quiet lane, and a dedicated parking spot.', 65000, 'Mumbai', 'Linking Road, Bandra West', 2, 2, 950, 'apartment', 'rent', ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200'], 'Rahul Mehta', '+919820012345', '+919820012345', 'rahul@example.com', true),
('Modern Studio near Koramangala', 'Fully furnished studio in the heart of Koramangala 5th Block. Ideal for young professionals. Walk to cafes, coworking, and metro.', 28000, 'Bangalore', '5th Block, Koramangala', 1, 1, 450, 'studio', 'rent', ARRAY['https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200','https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200'], 'Priya Nair', '+919845123456', '+919845123456', 'priya@example.com', true),
('Spacious 3BHK Villa with Garden', 'Independent villa with a private garden, servant quarter, and covered parking for two cars. Gated community with 24/7 security.', 18500000, 'Pune', 'Baner Road', 3, 3, 2200, 'villa', 'sale', ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200'], 'Anand Patil', '+919011223344', '+919011223344', 'anand@example.com', true),
('Luxury Penthouse with Skyline View', 'Top-floor penthouse with panoramic city views, private terrace, jacuzzi, and premium Italian marble finishes.', 42000000, 'Mumbai', 'Worli Sea Face', 4, 4, 3400, 'penthouse', 'sale', ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200'], 'Kavita Shah', '+919867543210', '+919867543210', 'kavita@example.com', true),
('Cozy 1BHK in Indiranagar', 'Well-maintained 1BHK with wooden flooring, ample natural light, and a small balcony. Close to 100 Ft Road.', 32000, 'Bangalore', '12th Main, Indiranagar', 1, 1, 620, 'apartment', 'rent', ARRAY['https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=1200','https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200'], 'Suresh Kumar', '+919812345678', '+919812345678', 'suresh@example.com', false),
('Family House in Jubilee Hills', 'Independent house on a 300 sq yd plot with 4 bedrooms, a study, and a private lawn. Quiet residential lane.', 55000, 'Hyderabad', 'Road No. 36, Jubilee Hills', 4, 3, 2800, 'house', 'rent', ARRAY['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200'], 'Meena Reddy', '+919701234567', '+919701234567', 'meena@example.com', false),
('Sea-facing 2BHK in Kochi', 'Wake up to the sound of waves. Semi-furnished 2BHK on the 8th floor with an unobstructed view of the backwaters.', 8500000, 'Kochi', 'Marine Drive', 2, 2, 1150, 'apartment', 'sale', ARRAY['https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200','https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200'], 'Joseph Thomas', '+919447112233', '+919447112233', 'joseph@example.com', true),
('Compact Studio in DLF Phase 3', 'Newly renovated studio, perfect for a working professional. Includes AC, wardrobe, and refrigerator.', 22000, 'Gurugram', 'DLF Phase 3', 1, 1, 380, 'studio', 'rent', ARRAY['https://images.unsplash.com/photo-1522444195799-478538b28823?w=1200'], 'Nikhil Arora', '+919911223344', '+919911223344', 'nikhil@example.com', false),
('Heritage Bungalow in Alibaug', 'Restored bungalow with original teak beams, a large veranda, and a mango orchard. 20 minutes from the beach.', 27500000, 'Alibaug', 'Awas Village', 4, 4, 3800, 'house', 'sale', ARRAY['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200','https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200'], 'Farah Khan', '+919820098765', '+919820098765', 'farah@example.com', false),
('3BHK Apartment in Salt Lake', 'South-facing 3BHK with cross-ventilation, spacious living room, and modular kitchen. Community park and gym.', 45000, 'Kolkata', 'Sector V, Salt Lake', 3, 2, 1450, 'apartment', 'rent', ARRAY['https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200'], 'Ritu Banerjee', '+919831112233', '+919831112233', 'ritu@example.com', false),
('Chic 2BHK near Anna Nagar Tower', 'Contemporary 2BHK with designer interiors, walk-in closet, and rooftop access. Prime Anna Nagar location.', 38000, 'Chennai', '2nd Avenue, Anna Nagar', 2, 2, 1050, 'apartment', 'rent', ARRAY['https://images.unsplash.com/photo-1600566753086-00f18fe6ba68?w=1200','https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=1200'], 'Karthik Iyer', '+919842001122', '+919842001122', 'karthik@example.com', false),
('Hillside Villa in Lonavala', 'Weekend retreat set on a hillside with private pool, deck, and misty valley views. Fully furnished, ready to move in.', 32000000, 'Lonavala', 'Tungarli', 4, 4, 3200, 'villa', 'sale', ARRAY['https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200','https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200'], 'Vikram Desai', '+919820112233', '+919820112233', 'vikram@example.com', true);
