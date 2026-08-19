-- Migration: 20260820000000_create_localities_table.sql
-- Description: Create localities master table with performance indexes and pre-loaded Indian metro data

CREATE TABLE IF NOT EXISTS public.localities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city VARCHAR(100) NOT NULL,
  locality_name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  nearby_metro_station VARCHAR(100),
  nearby_tech_parks JSONB DEFAULT '[]'::jsonb,
  nearby_colleges JSONB DEFAULT '[]'::jsonb,
  nearby_hospitals JSONB DEFAULT '[]'::jsonb,
  average_rent_1bhk INT,
  average_rent_2bhk INT,
  average_rent_3bhk INT,
  average_price_1bhk INT,
  average_price_2bhk INT,
  average_price_3bhk INT,
  furnished_percentage INT DEFAULT 65,
  properties_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance & Indexing for fast search
CREATE INDEX IF NOT EXISTS idx_localities_city_name ON public.localities(city, locality_name);
CREATE INDEX IF NOT EXISTS idx_localities_city ON public.localities(city);
CREATE INDEX IF NOT EXISTS idx_properties_city_locality ON public.properties(city, locality);

-- Enable Row Level Security (RLS) with Public Read Access
ALTER TABLE public.localities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on localities"
  ON public.localities
  FOR SELECT
  TO public
  USING (true);

-- Pre-seed rich curated data for major Indian metros
INSERT INTO public.localities (
  city, locality_name, latitude, longitude, nearby_metro_station,
  nearby_tech_parks, nearby_colleges, nearby_hospitals,
  average_rent_1bhk, average_rent_2bhk, average_rent_3bhk,
  average_price_1bhk, average_price_2bhk, average_price_3bhk,
  furnished_percentage, properties_count
) VALUES
-- Hyderabad
(
  'Hyderabad', 'Madhapur', 17.4483, 78.3915, 'Madhapur Metro (0.8 km)',
  '[{"name": "HITEC City / Cyber Towers", "distance_km": 1.2}, {"name": "Mindspace IT Park", "distance_km": 1.8}]'::jsonb,
  '[{"name": "NIFT Hyderabad", "distance_km": 1.5}, {"name": "JNTU Hyderabad", "distance_km": 6.2}]'::jsonb,
  '[{"name": "Medicover Hospital", "distance_km": 1.1}, {"name": "Oakridge Hospital", "distance_km": 2.4}]'::jsonb,
  16000, 28000, 42000, 4800000, 8500000, 14000000, 72, 1420
),
(
  'Hyderabad', 'Gachibowli', 17.4401, 78.3489, 'Raidurg Metro (3.2 km)',
  '[{"name": "Financial District", "distance_km": 2.5}, {"name": "Microsoft & Wipro SEZ", "distance_km": 1.0}]'::jsonb,
  '[{"name": "University of Hyderabad (HCU)", "distance_km": 3.0}, {"name": "IIIT Hyderabad", "distance_km": 1.5}]'::jsonb,
  '[{"name": "AIG Hospital", "distance_km": 2.1}, {"name": "Continental Hospital", "distance_km": 3.5}]'::jsonb,
  17500, 32000, 48000, 5200000, 9500000, 16500000, 78, 1850
),
(
  'Hyderabad', 'Kondapur', 17.4699, 78.3578, 'HITEC City Metro (2.1 km)',
  '[{"name": "HITEC City SEZ", "distance_km": 2.0}, {"name": "Google Kondapur Campus", "distance_km": 1.2}]'::jsonb,
  '[{"name": "Chirec International", "distance_km": 1.8}]'::jsonb,
  '[{"name": "KIMS Hospital Kondapur", "distance_km": 0.9}]'::jsonb,
  15000, 26000, 38000, 4500000, 8000000, 13000000, 68, 1120
),
(
  'Hyderabad', 'Financial District', 17.4156, 78.3378, 'Raidurg Metro (4.5 km)',
  '[{"name": "Amazon HQ & WaveRock SEZ", "distance_km": 0.5}, {"name": "One Golden Mile", "distance_km": 1.2}]'::jsonb,
  '[{"name": "ISB Hyderabad", "distance_km": 2.2}]'::jsonb,
  '[{"name": "Continental Hospital", "distance_km": 1.5}]'::jsonb,
  20000, 38000, 58000, 6000000, 12000000, 21000000, 85, 960
),

-- Bengaluru
(
  'Bengaluru', 'Indiranagar', 12.9784, 77.6408, 'Indiranagar Metro (0.4 km)',
  '[{"name": "Bagmane Tech Park", "distance_km": 2.8}, {"name": "EGL Business Park", "distance_km": 3.5}]'::jsonb,
  '[{"name": "National Public School", "distance_km": 1.0}]'::jsonb,
  '[{"name": "Manipal Hospital HAL", "distance_km": 2.2}]'::jsonb,
  22000, 38000, 60000, 7500000, 14000000, 25000000, 80, 1680
),
(
  'Bengaluru', 'HSR Layout', 12.9121, 77.6446, 'Silk Board Metro (2.0 km)',
  '[{"name": "EcoSpace / Outer Ring Road", "distance_km": 3.2}, {"name": "Koramangala Startups", "distance_km": 2.5}]'::jsonb,
  '[{"name": "NIFT Bengaluru", "distance_km": 1.2}]'::jsonb,
  '[{"name": "Narayana Multispeciality", "distance_km": 1.5}]'::jsonb,
  18000, 32000, 48000, 6000000, 11000000, 18000000, 75, 2100
),
(
  'Bengaluru', 'Whitefield', 12.9698, 77.7499, 'Whitefield Metro (0.6 km)',
  '[{"name": "ITPL Tech Park", "distance_km": 1.2}, {"name": "GR Tech Park", "distance_km": 2.0}]'::jsonb,
  '[{"name": "Vydehi Institute", "distance_km": 1.5}]'::jsonb,
  '[{"name": "Manipal Hospital Whitefield", "distance_km": 1.8}, {"name": "Columbia Asia", "distance_km": 2.5}]'::jsonb,
  16000, 28000, 42000, 5000000, 9500000, 16000000, 70, 2450
),

-- Mumbai
(
  'Mumbai', 'Powai', 19.1176, 72.9060, 'Kanjurmarg Station (2.5 km)',
  '[{"name": "Hiranandani Business Park", "distance_km": 0.8}, {"name": "SEEPZ Andheri", "distance_km": 4.5}]'::jsonb,
  '[{"name": "IIT Bombay", "distance_km": 1.2}]'::jsonb,
  '[{"name": "Hiranandani Hospital", "distance_km": 0.5}]'::jsonb,
  28000, 48000, 75000, 9500000, 18000000, 32000000, 82, 1340
),
(
  'Mumbai', 'Bandra West', 19.0596, 72.8295, 'Bandra Station (1.2 km)',
  '[{"name": "Bandra Kurla Complex (BKC)", "distance_km": 3.8}]'::jsonb,
  '[{"name": "St. Andrews College", "distance_km": 1.0}, {"name": "National College", "distance_km": 1.5}]'::jsonb,
  '[{"name": "Lilavati Hospital", "distance_km": 1.2}, {"name": "Holy Family Hospital", "distance_km": 1.0}]'::jsonb,
  45000, 85000, 140000, 18000000, 35000000, 65000000, 88, 980
),

-- Pune
(
  'Pune', 'Hinjewadi', 18.5913, 73.7389, 'Hinjewadi Metro (1.0 km)',
  '[{"name": "Rajiv Gandhi Infotech Park Phase 1-3", "distance_km": 0.8}]'::jsonb,
  '[{"name": "Symbiosis Institute", "distance_km": 2.5}]'::jsonb,
  '[{"name": "Ruby Hall Clinic Hinjewadi", "distance_km": 1.2}]'::jsonb,
  12000, 21000, 32000, 3800000, 7000000, 11500000, 65, 1920
),
(
  'Pune', 'Baner', 18.5590, 73.7868, 'Aundh Metro (3.0 km)',
  '[{"name": "Amar Business Park", "distance_km": 1.2}, {"name": "Hinjewadi IT Park", "distance_km": 6.5}]'::jsonb,
  '[{"name": "Pune University", "distance_km": 5.0}]'::jsonb,
  '[{"name": "Jupiter Hospital", "distance_km": 2.2}]'::jsonb,
  16000, 27000, 40000, 5200000, 9200000, 15000000, 74, 1480
)
ON CONFLICT (id) DO NOTHING;
