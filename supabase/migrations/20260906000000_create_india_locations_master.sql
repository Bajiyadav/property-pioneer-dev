-- ===========================================================================
-- Complete India Location Master Schema & Authoritative Administrative Dataset
-- Sources: Local Government Directory (LGD), Ministry of Panchayati Raj,
-- Census of India (ORGI), and India Post.
-- ===========================================================================

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.locations (
  id VARCHAR(100) PRIMARY KEY,
  parent_id VARCHAR(100) REFERENCES public.locations(id) ON DELETE CASCADE,
  country_code VARCHAR(2) NOT NULL DEFAULT 'IN',
  type VARCHAR(20) NOT NULL, -- COUNTRY, STATE, UNION_TERRITORY, DISTRICT, CITY, TOWN, LOCALITY, PINCODE
  name VARCHAR(150) NOT NULL,
  normalized_name VARCHAR(150) NOT NULL,
  state_code VARCHAR(10),
  district_code VARCHAR(50),
  city_code VARCHAR(50),
  pincode VARCHAR(10),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location geometry(Point, 4326) GENERATED ALWAYS AS (
    CASE
      WHEN latitude IS NOT NULL AND longitude IS NOT NULL
        THEN extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)
      ELSE NULL
    END
  ) STORED,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  source VARCHAR(50) NOT NULL DEFAULT 'LGD_CENSUS_INDIA',
  source_id VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance & Spatial Indexes
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON public.locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_state_code ON public.locations(state_code);
CREATE INDEX IF NOT EXISTS idx_locations_district_code ON public.locations(district_code);
CREATE INDEX IF NOT EXISTS idx_locations_normalized_name ON public.locations(normalized_name);
CREATE INDEX IF NOT EXISTS idx_locations_pincode ON public.locations(pincode);
CREATE INDEX IF NOT EXISTS idx_locations_gist_geom ON public.locations USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_locations_status_type ON public.locations(status, type);

-- Row Level Security (RLS) - Public Read Access
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'locations' AND policyname = 'Allow public read access on locations'
  ) THEN
    CREATE POLICY "Allow public read access on locations"
      ON public.locations
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

GRANT SELECT ON public.locations TO anon, authenticated;

-- ===========================================================================
-- 1. ROOT NATION RECORD
-- ===========================================================================
INSERT INTO public.locations (id, parent_id, country_code, type, name, normalized_name, status, source)
VALUES ('in', NULL, 'IN', 'COUNTRY', 'India', 'india', 'ACTIVE', 'GOI_OFFICIAL')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, normalized_name = EXCLUDED.normalized_name;

-- ===========================================================================
-- 2. ALL 28 STATES & 8 UNION TERRITORIES (36 Total)
-- ===========================================================================
INSERT INTO public.locations (id, parent_id, country_code, type, name, normalized_name, state_code, latitude, longitude, status, source) VALUES
-- States
('in-ap', 'in', 'IN', 'STATE', 'Andhra Pradesh', 'andhra pradesh', 'AP', 15.9129, 79.7400, 'ACTIVE', 'LGD_OFFICIAL'),
('in-ar', 'in', 'IN', 'STATE', 'Arunachal Pradesh', 'arunachal pradesh', 'AR', 28.2180, 94.7278, 'ACTIVE', 'LGD_OFFICIAL'),
('in-as', 'in', 'IN', 'STATE', 'Assam', 'assam', 'AS', 26.2006, 92.9376, 'ACTIVE', 'LGD_OFFICIAL'),
('in-br', 'in', 'IN', 'STATE', 'Bihar', 'bihar', 'BR', 25.0961, 85.3131, 'ACTIVE', 'LGD_OFFICIAL'),
('in-cg', 'in', 'IN', 'STATE', 'Chhattisgarh', 'chhattisgarh', 'CG', 21.2787, 81.8661, 'ACTIVE', 'LGD_OFFICIAL'),
('in-ga', 'in', 'IN', 'STATE', 'Goa', 'goa', 'GA', 15.2993, 74.1240, 'ACTIVE', 'LGD_OFFICIAL'),
('in-gj', 'in', 'IN', 'STATE', 'Gujarat', 'gujarat', 'GJ', 22.2587, 71.1924, 'ACTIVE', 'LGD_OFFICIAL'),
('in-hr', 'in', 'IN', 'STATE', 'Haryana', 'haryana', 'HR', 29.0588, 76.0856, 'ACTIVE', 'LGD_OFFICIAL'),
('in-hp', 'in', 'IN', 'STATE', 'Himachal Pradesh', 'himachal pradesh', 'HP', 31.1048, 77.1734, 'ACTIVE', 'LGD_OFFICIAL'),
('in-jh', 'in', 'IN', 'STATE', 'Jharkhand', 'jharkhand', 'JH', 23.6102, 85.2799, 'ACTIVE', 'LGD_OFFICIAL'),
('in-ka', 'in', 'IN', 'STATE', 'Karnataka', 'karnataka', 'KA', 15.3173, 75.7139, 'ACTIVE', 'LGD_OFFICIAL'),
('in-kl', 'in', 'IN', 'STATE', 'Kerala', 'kerala', 'KL', 10.8505, 76.2711, 'ACTIVE', 'LGD_OFFICIAL'),
('in-mp', 'in', 'IN', 'STATE', 'Madhya Pradesh', 'madhya pradesh', 'MP', 22.9734, 78.6569, 'ACTIVE', 'LGD_OFFICIAL'),
('in-mh', 'in', 'IN', 'STATE', 'Maharashtra', 'maharashtra', 'MH', 19.7515, 75.7139, 'ACTIVE', 'LGD_OFFICIAL'),
('in-mn', 'in', 'IN', 'STATE', 'Manipur', 'manipur', 'MN', 24.6637, 93.9063, 'ACTIVE', 'LGD_OFFICIAL'),
('in-ml', 'in', 'IN', 'STATE', 'Meghalaya', 'meghalaya', 'ML', 25.4670, 91.3662, 'ACTIVE', 'LGD_OFFICIAL'),
('in-mz', 'in', 'IN', 'STATE', 'Mizoram', 'mizoram', 'MZ', 23.1645, 92.9376, 'ACTIVE', 'LGD_OFFICIAL'),
('in-nl', 'in', 'IN', 'STATE', 'Nagaland', 'nagaland', 'NL', 26.1584, 94.5624, 'ACTIVE', 'LGD_OFFICIAL'),
('in-od', 'in', 'IN', 'STATE', 'Odisha', 'odisha', 'OD', 20.9517, 85.0985, 'ACTIVE', 'LGD_OFFICIAL'),
('in-pb', 'in', 'IN', 'STATE', 'Punjab', 'punjab', 'PB', 31.1471, 75.3412, 'ACTIVE', 'LGD_OFFICIAL'),
('in-rj', 'in', 'IN', 'STATE', 'Rajasthan', 'rajasthan', 'RJ', 27.0238, 74.2179, 'ACTIVE', 'LGD_OFFICIAL'),
('in-sk', 'in', 'IN', 'STATE', 'Sikkim', 'sikkim', 'SK', 27.5330, 88.5122, 'ACTIVE', 'LGD_OFFICIAL'),
('in-tn', 'in', 'IN', 'STATE', 'Tamil Nadu', 'tamil nadu', 'TN', 11.1271, 78.6569, 'ACTIVE', 'LGD_OFFICIAL'),
('in-ts', 'in', 'IN', 'STATE', 'Telangana', 'telangana', 'TS', 17.8749, 78.1008, 'ACTIVE', 'LGD_OFFICIAL'),
('in-tr', 'in', 'IN', 'STATE', 'Tripura', 'tripura', 'TR', 23.9408, 91.9882, 'ACTIVE', 'LGD_OFFICIAL'),
('in-up', 'in', 'IN', 'STATE', 'Uttar Pradesh', 'uttar pradesh', 'UP', 26.8467, 80.9462, 'ACTIVE', 'LGD_OFFICIAL'),
('in-uk', 'in', 'IN', 'STATE', 'Uttarakhand', 'uttarakhand', 'UK', 30.0668, 79.0193, 'ACTIVE', 'LGD_OFFICIAL'),
('in-wb', 'in', 'IN', 'STATE', 'West Bengal', 'west bengal', 'WB', 22.9868, 87.8550, 'ACTIVE', 'LGD_OFFICIAL'),
-- Union Territories
('in-an', 'in', 'IN', 'UNION_TERRITORY', 'Andaman and Nicobar Islands', 'andaman and nicobar islands', 'AN', 11.7401, 92.6586, 'ACTIVE', 'LGD_OFFICIAL'),
('in-ch', 'in', 'IN', 'UNION_TERRITORY', 'Chandigarh', 'chandigarh', 'CH', 30.7333, 76.7794, 'ACTIVE', 'LGD_OFFICIAL'),
('in-dn', 'in', 'IN', 'UNION_TERRITORY', 'Dadra and Nagar Haveli and Daman and Diu', 'dadra and nagar haveli and daman and diu', 'DN', 20.4283, 72.8397, 'ACTIVE', 'LGD_OFFICIAL'),
('in-dl', 'in', 'IN', 'UNION_TERRITORY', 'Delhi', 'delhi', 'DL', 28.7041, 77.1025, 'ACTIVE', 'LGD_OFFICIAL'),
('in-jk', 'in', 'IN', 'UNION_TERRITORY', 'Jammu and Kashmir', 'jammu and kashmir', 'JK', 33.7782, 76.5762, 'ACTIVE', 'LGD_OFFICIAL'),
('in-la', 'in', 'IN', 'UNION_TERRITORY', 'Ladakh', 'ladakh', 'LA', 34.1526, 77.5771, 'ACTIVE', 'LGD_OFFICIAL'),
('in-ld', 'in', 'IN', 'UNION_TERRITORY', 'Lakshadweep', 'lakshadweep', 'LD', 10.5667, 72.6417, 'ACTIVE', 'LGD_OFFICIAL'),
('in-py', 'in', 'IN', 'UNION_TERRITORY', 'Puducherry', 'puducherry', 'PY', 11.9416, 79.8083, 'ACTIVE', 'LGD_OFFICIAL')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  normalized_name = EXCLUDED.normalized_name,
  state_code = EXCLUDED.state_code,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

-- ===========================================================================
-- 3. ANDHRA PRADESH — ALL 26 REORGANIZED DISTRICTS & URBAN SETTLEMENTS
-- ===========================================================================
INSERT INTO public.locations (id, parent_id, country_code, type, name, normalized_name, state_code, district_code, latitude, longitude, status, source) VALUES
-- 26 Districts
('in-ap-alluri', 'in-ap', 'IN', 'DISTRICT', 'Alluri Sitharama Raju', 'alluri sitharama raju', 'AP', 'ASR', 18.0833, 82.6667, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-anakapalli', 'in-ap', 'IN', 'DISTRICT', 'Anakapalli', 'anakapalli', 'AP', 'AKP', 17.6913, 83.0039, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-ananthapuramu', 'in-ap', 'IN', 'DISTRICT', 'Ananthapuramu', 'ananthapuramu', 'AP', 'ATP', 14.6819, 77.6006, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-annamayya', 'in-ap', 'IN', 'DISTRICT', 'Annamayya', 'annamayya', 'AP', 'ANN', 14.0500, 78.7500, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-bapatla', 'in-ap', 'IN', 'DISTRICT', 'Bapatla', 'bapatla', 'AP', 'BPT', 15.9056, 80.4678, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-chittoor', 'in-ap', 'IN', 'DISTRICT', 'Chittoor', 'chittoor', 'AP', 'CTR', 13.2172, 79.1003, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-konaseema', 'in-ap', 'IN', 'DISTRICT', 'Dr. B.R. Ambedkar Konaseema', 'dr. b.r. ambedkar konaseema', 'AP', 'KNS', 16.5786, 82.0061, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-eastgodavari', 'in-ap', 'IN', 'DISTRICT', 'East Godavari', 'east godavari', 'AP', 'EGD', 17.0005, 81.7800, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-eluru', 'in-ap', 'IN', 'DISTRICT', 'Eluru', 'eluru', 'AP', 'ELR', 16.7107, 81.0952, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-guntur', 'in-ap', 'IN', 'DISTRICT', 'Guntur', 'guntur', 'AP', 'GNT', 16.3067, 80.4365, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-kakinada', 'in-ap', 'IN', 'DISTRICT', 'Kakinada', 'kakinada', 'AP', 'KKD', 16.9891, 82.2475, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-krishna', 'in-ap', 'IN', 'DISTRICT', 'Krishna', 'krishna', 'AP', 'KRI', 16.1875, 81.1389, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-kurnool', 'in-ap', 'IN', 'DISTRICT', 'Kurnool', 'kurnool', 'AP', 'KNL', 15.8281, 78.0373, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-nandyal', 'in-ap', 'IN', 'DISTRICT', 'Nandyal', 'nandyal', 'AP', 'NDL', 15.4886, 78.4836, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-ntr', 'in-ap', 'IN', 'DISTRICT', 'NTR', 'ntr', 'AP', 'NTR', 16.5062, 80.6480, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-palnadu', 'in-ap', 'IN', 'DISTRICT', 'Palnadu', 'palnadu', 'AP', 'PLN', 16.2333, 80.0500, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-manyam', 'in-ap', 'IN', 'DISTRICT', 'Parvathipuram Manyam', 'parvathipuram manyam', 'AP', 'PVM', 18.7833, 83.4333, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-prakasam', 'in-ap', 'IN', 'DISTRICT', 'Prakasam', 'prakasam', 'AP', 'PKM', 15.5057, 80.0499, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-nellore', 'in-ap', 'IN', 'DISTRICT', 'Sri Potti Sriramulu Nellore', 'sri potti sriramulu nellore', 'AP', 'NLR', 14.4426, 79.9865, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-sathyasai', 'in-ap', 'IN', 'DISTRICT', 'Sri Sathya Sai', 'sri sathya sai', 'AP', 'SSS', 14.1667, 77.8167, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-srikakulam', 'in-ap', 'IN', 'DISTRICT', 'Srikakulam', 'srikakulam', 'AP', 'SKL', 18.2969, 83.8968, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-tirupati', 'in-ap', 'IN', 'DISTRICT', 'Tirupati', 'tirupati', 'AP', 'TPT', 13.6288, 79.4192, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-visakhapatnam', 'in-ap', 'IN', 'DISTRICT', 'Visakhapatnam', 'visakhapatnam', 'AP', 'VSP', 17.6868, 83.2185, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-vizianagaram', 'in-ap', 'IN', 'DISTRICT', 'Vizianagaram', 'vizianagaram', 'AP', 'VZM', 18.1167, 83.4167, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-westgodavari', 'in-ap', 'IN', 'DISTRICT', 'West Godavari', 'west godavari', 'AP', 'WGD', 16.5449, 81.5212, 'ACTIVE', 'LGD_AP_2022'),
('in-ap-kadapa', 'in-ap', 'IN', 'DISTRICT', 'YSR Kadapa', 'ysr kadapa', 'AP', 'KDP', 14.4673, 78.8242, 'ACTIVE', 'LGD_AP_2022')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  normalized_name = EXCLUDED.normalized_name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

-- Key Cities / Towns in Andhra Pradesh
INSERT INTO public.locations (id, parent_id, country_code, type, name, normalized_name, state_code, district_code, city_code, pincode, latitude, longitude, status, source) VALUES
-- Visakhapatnam District
('in-ap-vsp-city', 'in-ap-visakhapatnam', 'IN', 'CITY', 'Visakhapatnam', 'visakhapatnam', 'AP', 'VSP', 'VSP_CITY', '530001', 17.6868, 83.2185, 'ACTIVE', 'CENSUS_2011'),
('in-ap-vsp-bheemili', 'in-ap-visakhapatnam', 'IN', 'TOWN', 'Bheemunipatnam', 'bheemunipatnam', 'AP', 'VSP', 'BHM', '531163', 17.8900, 83.4500, 'ACTIVE', 'CENSUS_2011'),
-- NTR District
('in-ap-ntr-vijayawada', 'in-ap-ntr', 'IN', 'CITY', 'Vijayawada', 'vijayawada', 'AP', 'NTR', 'VJA_CITY', '520001', 16.5062, 80.6480, 'ACTIVE', 'CENSUS_2011'),
('in-ap-ntr-ibrahimpatnam', 'in-ap-ntr', 'IN', 'TOWN', 'Ibrahimpatnam', 'ibrahimpatnam', 'AP', 'NTR', 'IBP', '521456', 16.5861, 80.5286, 'ACTIVE', 'CENSUS_2011'),
('in-ap-ntr-jaggaiahpeta', 'in-ap-ntr', 'IN', 'TOWN', 'Jaggaiahpeta', 'jaggaiahpeta', 'AP', 'NTR', 'JPT', '521175', 16.8928, 80.0978, 'ACTIVE', 'CENSUS_2011'),
-- Guntur District
('in-ap-gnt-city', 'in-ap-guntur', 'IN', 'CITY', 'Guntur', 'guntur', 'AP', 'GNT', 'GNT_CITY', '522001', 16.3067, 80.4365, 'ACTIVE', 'CENSUS_2011'),
('in-ap-gnt-tenali', 'in-ap-guntur', 'IN', 'CITY', 'Tenali', 'tenali', 'AP', 'GNT', 'TNL', '522201', 16.2430, 80.6400, 'ACTIVE', 'CENSUS_2011'),
('in-ap-gnt-mangalagiri', 'in-ap-guntur', 'IN', 'CITY', 'Mangalagiri', 'mangalagiri', 'AP', 'GNT', 'MGL', '522503', 16.4300, 80.5700, 'ACTIVE', 'CENSUS_2011'),
('in-ap-gnt-tadepalli', 'in-ap-guntur', 'IN', 'TOWN', 'Tadepalli', 'tadepalli', 'AP', 'GNT', 'TDP', '522501', 16.4800, 80.6000, 'ACTIVE', 'CENSUS_2011'),
-- Tirupati District
('in-ap-tpt-city', 'in-ap-tirupati', 'IN', 'CITY', 'Tirupati', 'tirupati', 'AP', 'TPT', 'TPT_CITY', '517501', 13.6288, 79.4192, 'ACTIVE', 'CENSUS_2011'),
('in-ap-tpt-srikalahasti', 'in-ap-tirupati', 'IN', 'CITY', 'Srikalahasti', 'srikalahasti', 'AP', 'TPT', 'SKH', '517644', 13.7500, 79.7000, 'ACTIVE', 'CENSUS_2011'),
('in-ap-tpt-gudur', 'in-ap-tirupati', 'IN', 'TOWN', 'Gudur', 'gudur', 'AP', 'TPT', 'GDR', '524101', 14.1500, 79.8500, 'ACTIVE', 'CENSUS_2011'),
('in-ap-tpt-sullurpeta', 'in-ap-tirupati', 'IN', 'TOWN', 'Sullurpeta', 'sullurpeta', 'AP', 'TPT', 'SLP', '524121', 13.7000, 80.0200, 'ACTIVE', 'CENSUS_2011'),
-- SPS Nellore District
('in-ap-nlr-city', 'in-ap-nellore', 'IN', 'CITY', 'Nellore', 'nellore', 'AP', 'NLR', 'NLR_CITY', '524001', 14.4426, 79.9865, 'ACTIVE', 'CENSUS_2011'),
('in-ap-nlr-kavali', 'in-ap-nellore', 'IN', 'CITY', 'Kavali', 'kavali', 'AP', 'NLR', 'KVL', '524201', 14.9130, 79.9920, 'ACTIVE', 'CENSUS_2011'),
-- Kurnool District
('in-ap-knl-city', 'in-ap-kurnool', 'IN', 'CITY', 'Kurnool', 'kurnool', 'AP', 'KNL', 'KNL_CITY', '518001', 15.8281, 78.0373, 'ACTIVE', 'CENSUS_2011'),
('in-ap-knl-adoni', 'in-ap-kurnool', 'IN', 'CITY', 'Adoni', 'adoni', 'AP', 'KNL', 'ADN', '518301', 15.6300, 77.2800, 'ACTIVE', 'CENSUS_2011'),
('in-ap-knl-yemmiganur', 'in-ap-kurnool', 'IN', 'TOWN', 'Yemmiganur', 'yemmiganur', 'AP', 'KNL', 'YMG', '518360', 15.7700, 77.4800, 'ACTIVE', 'CENSUS_2011'),
-- Nandyal District
('in-ap-ndl-city', 'in-ap-nandyal', 'IN', 'CITY', 'Nandyal', 'nandyal', 'AP', 'NDL', 'NDL_CITY', '518501', 15.4886, 78.4836, 'ACTIVE', 'CENSUS_2011'),
('in-ap-ndl-allagadda', 'in-ap-nandyal', 'IN', 'TOWN', 'Allagadda', 'allagadda', 'AP', 'NDL', 'AGD', '518543', 15.1300, 78.5200, 'ACTIVE', 'CENSUS_2011'),
-- East Godavari District
('in-ap-egd-rajahmundry', 'in-ap-eastgodavari', 'IN', 'CITY', 'Rajahmundry', 'rajahmundry', 'AP', 'EGD', 'RJY_CITY', '533101', 17.0005, 81.7800, 'ACTIVE', 'CENSUS_2011'),
-- Kakinada District
('in-ap-kkd-city', 'in-ap-kakinada', 'IN', 'CITY', 'Kakinada', 'kakinada', 'AP', 'KKD', 'KKD_CITY', '533001', 16.9891, 82.2475, 'ACTIVE', 'CENSUS_2011'),
('in-ap-kkd-samalkota', 'in-ap-kakinada', 'IN', 'TOWN', 'Samalkota', 'samalkota', 'AP', 'KKD', 'SMK', '533440', 17.0500, 82.1700, 'ACTIVE', 'CENSUS_2011'),
('in-ap-kkd-tuni', 'in-ap-kakinada', 'IN', 'TOWN', 'Tuni', 'tuni', 'AP', 'KKD', 'TNI', '533401', 17.3500, 82.5500, 'ACTIVE', 'CENSUS_2011'),
-- West Godavari District
('in-ap-wgd-bhimavaram', 'in-ap-westgodavari', 'IN', 'CITY', 'Bhimavaram', 'bhimavaram', 'AP', 'WGD', 'BMV', '534201', 16.5449, 81.5212, 'ACTIVE', 'CENSUS_2011'),
('in-ap-wgd-tadepalligudem', 'in-ap-westgodavari', 'IN', 'CITY', 'Tadepalligudem', 'tadepalligudem', 'AP', 'WGD', 'TPG', '534101', 16.8100, 81.5300, 'ACTIVE', 'CENSUS_2011'),
('in-ap-wgd-tanuku', 'in-ap-westgodavari', 'IN', 'TOWN', 'Tanuku', 'tanuku', 'AP', 'WGD', 'TNK', '534211', 16.7500, 81.6800, 'ACTIVE', 'CENSUS_2011'),
-- Eluru District
('in-ap-elr-city', 'in-ap-eluru', 'IN', 'CITY', 'Eluru', 'eluru', 'AP', 'ELR', 'ELR_CITY', '534001', 16.7107, 81.0952, 'ACTIVE', 'CENSUS_2011'),
-- Ananthapuramu District
('in-ap-atp-city', 'in-ap-ananthapuramu', 'IN', 'CITY', 'Anantapur', 'anantapur', 'AP', 'ATP', 'ATP_CITY', '515001', 14.6819, 77.6006, 'ACTIVE', 'CENSUS_2011'),
('in-ap-atp-guntakal', 'in-ap-ananthapuramu', 'IN', 'CITY', 'Guntakal', 'guntakal', 'AP', 'ATP', 'GTL', '515801', 15.1700, 77.3800, 'ACTIVE', 'CENSUS_2011'),
('in-ap-atp-tadipatri', 'in-ap-ananthapuramu', 'IN', 'CITY', 'Tadipatri', 'tadipatri', 'AP', 'ATP', 'TDP', '515411', 14.9100, 78.0100, 'ACTIVE', 'CENSUS_2011'),
-- Sri Sathya Sai District
('in-ap-sss-hindupur', 'in-ap-sathyasai', 'IN', 'CITY', 'Hindupur', 'hindupur', 'AP', 'SSS', 'HDP', '515201', 13.8300, 77.4900, 'ACTIVE', 'CENSUS_2011'),
('in-ap-sss-dharmavaram', 'in-ap-sathyasai', 'IN', 'CITY', 'Dharmavaram', 'dharmavaram', 'AP', 'SSS', 'DHM', '515671', 14.4140, 77.7190, 'ACTIVE', 'CENSUS_2011'),
('in-ap-sss-puttaparthi', 'in-ap-sathyasai', 'IN', 'TOWN', 'Puttaparthi', 'puttaparthi', 'AP', 'SSS', 'PTP', '515134', 14.1667, 77.8167, 'ACTIVE', 'CENSUS_2011'),
-- YSR Kadapa District
('in-ap-kdp-city', 'in-ap-kadapa', 'IN', 'CITY', 'Kadapa', 'kadapa', 'AP', 'KDP', 'KDP_CITY', '516001', 14.4673, 78.8242, 'ACTIVE', 'CENSUS_2011'),
('in-ap-kdp-proddatur', 'in-ap-kadapa', 'IN', 'CITY', 'Proddatur', 'proddatur', 'AP', 'KDP', 'PRD', '516360', 14.7500, 78.5500, 'ACTIVE', 'CENSUS_2011'),
-- Annamayya District
('in-ap-ann-madanapalle', 'in-ap-annamayya', 'IN', 'CITY', 'Madanapalle', 'madanapalle', 'AP', 'ANN', 'MDP', '517325', 13.5500, 78.5000, 'ACTIVE', 'CENSUS_2011'),
('in-ap-ann-rayachoti', 'in-ap-annamayya', 'IN', 'TOWN', 'Rayachoti', 'rayachoti', 'AP', 'ANN', 'RYC', '516269', 14.0500, 78.7500, 'ACTIVE', 'CENSUS_2011'),
-- Chittoor District
('in-ap-ctr-city', 'in-ap-chittoor', 'IN', 'CITY', 'Chittoor', 'chittoor', 'AP', 'CTR', 'CTR_CITY', '517001', 13.2172, 79.1003, 'ACTIVE', 'CENSUS_2011'),
-- Prakasam District
('in-ap-pkm-ongole', 'in-ap-prakasam', 'IN', 'CITY', 'Ongole', 'ongole', 'AP', 'PKM', 'OGL', '523001', 15.5057, 80.0499, 'ACTIVE', 'CENSUS_2011'),
('in-ap-pkm-chirala', 'in-ap-prakasam', 'IN', 'CITY', 'Chirala', 'chirala', 'AP', 'PKM', 'CRL', '523155', 15.8200, 80.3500, 'ACTIVE', 'CENSUS_2011'),
-- Palnadu District
('in-ap-pln-narasaraopet', 'in-ap-palnadu', 'IN', 'CITY', 'Narasaraopet', 'narasaraopet', 'AP', 'PLN', 'NRT', '522601', 16.2333, 80.0500, 'ACTIVE', 'CENSUS_2011'),
('in-ap-pln-chilakaluripet', 'in-ap-palnadu', 'IN', 'CITY', 'Chilakaluripet', 'chilakaluripet', 'AP', 'PLN', 'CPT', '522616', 16.0892, 80.1672, 'ACTIVE', 'CENSUS_2011'),
-- Srikakulam District
('in-ap-skl-city', 'in-ap-srikakulam', 'IN', 'CITY', 'Srikakulam', 'srikakulam', 'AP', 'SKL', 'SKL_CITY', '532001', 18.2969, 83.8968, 'ACTIVE', 'CENSUS_2011'),
-- Vizianagaram District
('in-ap-vzm-city', 'in-ap-vizianagaram', 'IN', 'CITY', 'Vizianagaram', 'vizianagaram', 'AP', 'VZM', 'VZM_CITY', '535001', 18.1167, 83.4167, 'ACTIVE', 'CENSUS_2011'),
-- Anakapalli District
('in-ap-akp-city', 'in-ap-anakapalli', 'IN', 'CITY', 'Anakapalli', 'anakapalli', 'AP', 'AKP', 'AKP_CITY', '531001', 17.6913, 83.0039, 'ACTIVE', 'CENSUS_2011')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  normalized_name = EXCLUDED.normalized_name,
  pincode = EXCLUDED.pincode,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

-- ===========================================================================
-- 4. TELANGANA — ALL 33 REORGANIZED DISTRICTS & URBAN SETTLEMENTS
-- ===========================================================================
INSERT INTO public.locations (id, parent_id, country_code, type, name, normalized_name, state_code, district_code, latitude, longitude, status, source) VALUES
-- 33 Districts
('in-ts-adilabad', 'in-ts', 'IN', 'DISTRICT', 'Adilabad', 'adilabad', 'TS', 'ADB', 19.6667, 78.5333, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-kothagudem', 'in-ts', 'IN', 'DISTRICT', 'Bhadradri Kothagudem', 'bhadradri kothagudem', 'TS', 'BDK', 17.5500, 80.6167, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-hanamkonda', 'in-ts', 'IN', 'DISTRICT', 'Hanamkonda', 'hanamkonda', 'TS', 'HNK', 18.0073, 79.5583, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-hyderabad', 'in-ts', 'IN', 'DISTRICT', 'Hyderabad', 'hyderabad', 'TS', 'HYD', 17.3850, 78.4867, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-jagtial', 'in-ts', 'IN', 'DISTRICT', 'Jagtial', 'jagtial', 'TS', 'JGL', 18.7900, 78.9100, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-jangaon', 'in-ts', 'IN', 'DISTRICT', 'Jangaon', 'jangaon', 'TS', 'JGN', 17.7200, 79.1800, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-bhupalpally', 'in-ts', 'IN', 'DISTRICT', 'Jayashankar Bhupalpally', 'jayashankar bhupalpally', 'TS', 'JSB', 18.4300, 79.8600, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-gadwal', 'in-ts', 'IN', 'DISTRICT', 'Jogulamba Gadwal', 'jogulamba gadwal', 'TS', 'JLG', 16.2300, 77.8000, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-kamareddy', 'in-ts', 'IN', 'DISTRICT', 'Kamareddy', 'kamareddy', 'TS', 'KMR', 18.3200, 78.3400, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-karimnagar', 'in-ts', 'IN', 'DISTRICT', 'Karimnagar', 'karimnagar', 'TS', 'KRN', 18.4386, 79.1288, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-khammam', 'in-ts', 'IN', 'DISTRICT', 'Khammam', 'khammam', 'TS', 'KHM', 17.2473, 80.1514, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-asifabad', 'in-ts', 'IN', 'DISTRICT', 'Kumuram Bheem Asifabad', 'kumuram bheem asifabad', 'TS', 'KBA', 19.3600, 79.2900, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-mahabubabad', 'in-ts', 'IN', 'DISTRICT', 'Mahabubabad', 'mahabubabad', 'TS', 'MBD', 17.6000, 80.0000, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-mahabubnagar', 'in-ts', 'IN', 'DISTRICT', 'Mahabubnagar', 'mahabubnagar', 'TS', 'MBN', 16.7400, 77.9900, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-mancherial', 'in-ts', 'IN', 'DISTRICT', 'Mancherial', 'mancherial', 'TS', 'MCL', 18.8700, 79.4600, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-medak', 'in-ts', 'IN', 'DISTRICT', 'Medak', 'medak', 'TS', 'MDK', 18.0400, 78.2600, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-medchal', 'in-ts', 'IN', 'DISTRICT', 'Medchal-Malkajgiri', 'medchal-malkajgiri', 'TS', 'MDM', 17.6300, 78.4800, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-mulugu', 'in-ts', 'IN', 'DISTRICT', 'Mulugu', 'mulugu', 'TS', 'MLG', 18.1900, 79.9400, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-nagarkurnool', 'in-ts', 'IN', 'DISTRICT', 'Nagarkurnool', 'nagarkurnool', 'TS', 'NGK', 16.4800, 78.3300, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-nalgonda', 'in-ts', 'IN', 'DISTRICT', 'Nalgonda', 'nalgonda', 'TS', 'NLG', 17.0500, 79.2700, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-narayanpet', 'in-ts', 'IN', 'DISTRICT', 'Narayanpet', 'narayanpet', 'TS', 'NPT', 16.7300, 77.5000, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-nirmal', 'in-ts', 'IN', 'DISTRICT', 'Nirmal', 'nirmal', 'TS', 'NRM', 19.0900, 78.3400, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-nizamabad', 'in-ts', 'IN', 'DISTRICT', 'Nizamabad', 'nizamabad', 'TS', 'NZB', 18.6725, 78.0941, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-peddapalli', 'in-ts', 'IN', 'DISTRICT', 'Peddapalli', 'peddapalli', 'TS', 'PDP', 18.6200, 79.3800, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-sircilla', 'in-ts', 'IN', 'DISTRICT', 'Rajanna Sircilla', 'rajanna sircilla', 'TS', 'RJS', 18.3900, 78.8100, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-rangareddy', 'in-ts', 'IN', 'DISTRICT', 'Ranga Reddy', 'ranga reddy', 'TS', 'RRD', 17.3300, 78.5800, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-sangareddy', 'in-ts', 'IN', 'DISTRICT', 'Sangareddy', 'sangareddy', 'TS', 'SRD', 17.6294, 78.0917, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-siddipet', 'in-ts', 'IN', 'DISTRICT', 'Siddipet', 'siddipet', 'TS', 'SDP', 18.1000, 78.8500, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-suryapet', 'in-ts', 'IN', 'DISTRICT', 'Suryapet', 'suryapet', 'TS', 'SRP', 17.1400, 79.6200, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-vikarabad', 'in-ts', 'IN', 'DISTRICT', 'Vikarabad', 'vikarabad', 'TS', 'VKB', 17.3400, 77.9000, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-wanaparthy', 'in-ts', 'IN', 'DISTRICT', 'Wanaparthy', 'wanaparthy', 'TS', 'WNP', 16.3600, 78.0600, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-warangal', 'in-ts', 'IN', 'DISTRICT', 'Warangal', 'warangal', 'TS', 'WGL', 17.9689, 79.5941, 'ACTIVE', 'LGD_TS_2016'),
('in-ts-bhuvanagiri', 'in-ts', 'IN', 'DISTRICT', 'Yadadri Bhuvanagiri', 'yadadri bhuvanagiri', 'TS', 'YDB', 17.5100, 78.8900, 'ACTIVE', 'LGD_TS_2016')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  normalized_name = EXCLUDED.normalized_name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

-- Key Cities / Towns in Telangana
INSERT INTO public.locations (id, parent_id, country_code, type, name, normalized_name, state_code, district_code, city_code, pincode, latitude, longitude, status, source) VALUES
-- Hyderabad District
('in-ts-hyd-city', 'in-ts-hyderabad', 'IN', 'CITY', 'Hyderabad', 'hyderabad', 'TS', 'HYD', 'HYD_CITY', '500001', 17.3850, 78.4867, 'ACTIVE', 'CENSUS_2011'),
('in-ts-hyd-secunderabad', 'in-ts-hyderabad', 'IN', 'CITY', 'Secunderabad', 'secunderabad', 'TS', 'HYD', 'SCB_CITY', '500003', 17.4399, 78.4983, 'ACTIVE', 'CENSUS_2011'),
-- Ranga Reddy District
('in-ts-rrd-gachibowli', 'in-ts-rangareddy', 'IN', 'CITY', 'Gachibowli', 'gachibowli', 'TS', 'RRD', 'GCB', '500032', 17.4401, 78.3489, 'ACTIVE', 'CENSUS_2011'),
('in-ts-rrd-manikonda', 'in-ts-rangareddy', 'IN', 'CITY', 'Manikonda', 'manikonda', 'TS', 'RRD', 'MNK', '500089', 17.3995, 78.3840, 'ACTIVE', 'CENSUS_2011'),
('in-ts-rrd-shamshabad', 'in-ts-rangareddy', 'IN', 'TOWN', 'Shamshabad', 'shamshabad', 'TS', 'RRD', 'SHB', '501218', 17.2500, 78.4300, 'ACTIVE', 'CENSUS_2011'),
('in-ts-rrd-shadnagar', 'in-ts-rangareddy', 'IN', 'TOWN', 'Shadnagar', 'shadnagar', 'TS', 'RRD', 'SDN', '509216', 17.0700, 78.2000, 'ACTIVE', 'CENSUS_2011'),
-- Medchal-Malkajgiri District
('in-ts-mdm-kukatpally', 'in-ts-medchal', 'IN', 'CITY', 'Kukatpally', 'kukatpally', 'TS', 'MDM', 'KKT', '500072', 17.4875, 78.3953, 'ACTIVE', 'CENSUS_2011'),
('in-ts-mdm-malkajgiri', 'in-ts-medchal', 'IN', 'CITY', 'Malkajgiri', 'malkajgiri', 'TS', 'MDM', 'MLK', '500047', 17.4500, 78.5300, 'ACTIVE', 'CENSUS_2011'),
('in-ts-mdm-uppal', 'in-ts-medchal', 'IN', 'CITY', 'Uppal', 'uppal', 'TS', 'MDM', 'UPL', '500039', 17.4000, 78.5600, 'ACTIVE', 'CENSUS_2011'),
('in-ts-mdm-kompally', 'in-ts-medchal', 'IN', 'CITY', 'Kompally', 'kompally', 'TS', 'MDM', 'KMP', '500100', 17.5300, 78.4800, 'ACTIVE', 'CENSUS_2011'),
('in-ts-mdm-medchal', 'in-ts-medchal', 'IN', 'TOWN', 'Medchal', 'medchal', 'TS', 'MDM', 'MDC', '501401', 17.6300, 78.4800, 'ACTIVE', 'CENSUS_2011'),
-- Hanamkonda & Warangal
('in-ts-hnk-city', 'in-ts-hanamkonda', 'IN', 'CITY', 'Hanamkonda', 'hanamkonda', 'TS', 'HNK', 'HNK_CITY', '506001', 18.0073, 79.5583, 'ACTIVE', 'CENSUS_2011'),
('in-ts-wgl-city', 'in-ts-warangal', 'IN', 'CITY', 'Warangal', 'warangal', 'TS', 'WGL', 'WGL_CITY', '506002', 17.9689, 79.5941, 'ACTIVE', 'CENSUS_2011'),
('in-ts-wgl-kazipet', 'in-ts-hanamkonda', 'IN', 'CITY', 'Kazipet', 'kazipet', 'TS', 'HNK', 'KZP', '506003', 17.9800, 79.5200, 'ACTIVE', 'CENSUS_2011'),
-- Karimnagar District
('in-ts-krn-city', 'in-ts-karimnagar', 'IN', 'CITY', 'Karimnagar', 'karimnagar', 'TS', 'KRN', 'KRN_CITY', '505001', 18.4386, 79.1288, 'ACTIVE', 'CENSUS_2011'),
-- Nizamabad District
('in-ts-nzb-city', 'in-ts-nizamabad', 'IN', 'CITY', 'Nizamabad', 'nizamabad', 'TS', 'NZB', 'NZB_CITY', '503001', 18.6725, 78.0941, 'ACTIVE', 'CENSUS_2011'),
('in-ts-nzb-bodhan', 'in-ts-nizamabad', 'IN', 'CITY', 'Bodhan', 'bodhan', 'TS', 'NZB', 'BDH', '503185', 18.6600, 77.8900, 'ACTIVE', 'CENSUS_2011'),
('in-ts-nzb-armoor', 'in-ts-nizamabad', 'IN', 'CITY', 'Armoor', 'armoor', 'TS', 'NZB', 'AMR', '503224', 18.7900, 78.2900, 'ACTIVE', 'CENSUS_2011'),
-- Khammam District
('in-ts-khm-city', 'in-ts-khammam', 'IN', 'CITY', 'Khammam', 'khammam', 'TS', 'KHM', 'KHM_CITY', '507001', 17.2473, 80.1514, 'ACTIVE', 'CENSUS_2011'),
-- Bhadradri Kothagudem District
('in-ts-bdk-kothagudem', 'in-ts-kothagudem', 'IN', 'CITY', 'Kothagudem', 'kothagudem', 'TS', 'BDK', 'KTD', '507101', 17.5500, 80.6167, 'ACTIVE', 'CENSUS_2011'),
('in-ts-bdk-palwancha', 'in-ts-kothagudem', 'IN', 'CITY', 'Palwancha', 'palwancha', 'TS', 'BDK', 'PLW', '507115', 17.5800, 80.7000, 'ACTIVE', 'CENSUS_2011'),
-- Mahabubnagar District
('in-ts-mbn-city', 'in-ts-mahabubnagar', 'IN', 'CITY', 'Mahabubnagar', 'mahabubnagar', 'TS', 'MBN', 'MBN_CITY', '509001', 16.7400, 77.9900, 'ACTIVE', 'CENSUS_2011'),
-- Nalgonda District
('in-ts-nlg-city', 'in-ts-nalgonda', 'IN', 'CITY', 'Nalgonda', 'nalgonda', 'TS', 'NLG', 'NLG_CITY', '508001', 17.0500, 79.2700, 'ACTIVE', 'CENSUS_2011'),
('in-ts-nlg-miryalaguda', 'in-ts-nalgonda', 'IN', 'CITY', 'Miryalaguda', 'miryalaguda', 'TS', 'NLG', 'MLG', '508207', 16.8700, 79.5600, 'ACTIVE', 'CENSUS_2011'),
-- Suryapet District
('in-ts-srp-city', 'in-ts-suryapet', 'IN', 'CITY', 'Suryapet', 'suryapet', 'TS', 'SRP', 'SRP_CITY', '508213', 17.1400, 79.6200, 'ACTIVE', 'CENSUS_2011'),
-- Siddipet District
('in-ts-sdp-city', 'in-ts-siddipet', 'IN', 'CITY', 'Siddipet', 'siddipet', 'TS', 'SDP', 'SDP_CITY', '502103', 18.1000, 78.8500, 'ACTIVE', 'CENSUS_2011'),
-- Sangareddy District
('in-ts-srd-city', 'in-ts-sangareddy', 'IN', 'CITY', 'Sangareddy', 'sangareddy', 'TS', 'SRD', 'SRD_CITY', '502001', 17.6294, 78.0917, 'ACTIVE', 'CENSUS_2011'),
('in-ts-srd-patancheru', 'in-ts-sangareddy', 'IN', 'CITY', 'Patancheru', 'patancheru', 'TS', 'SRD', 'PTC', '502319', 17.5300, 78.2600, 'ACTIVE', 'CENSUS_2011'),
('in-ts-srd-tellapur', 'in-ts-sangareddy', 'IN', 'CITY', 'Tellapur', 'tellapur', 'TS', 'SRD', 'TLP', '502032', 17.4800, 78.2800, 'ACTIVE', 'CENSUS_2011'),
-- Peddapalli District
('in-ts-pdp-ramagundam', 'in-ts-peddapalli', 'IN', 'CITY', 'Ramagundam', 'ramagundam', 'TS', 'PDP', 'RMD', '505208', 18.7600, 79.4700, 'ACTIVE', 'CENSUS_2011')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  normalized_name = EXCLUDED.normalized_name,
  pincode = EXCLUDED.pincode,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

-- ===========================================================================
-- 5. OTHER MAJOR INDIAN STATES — METROPOLITAN & COMMERCIAL HUBS
-- ===========================================================================
INSERT INTO public.locations (id, parent_id, country_code, type, name, normalized_name, state_code, district_code, city_code, pincode, latitude, longitude, status, source) VALUES
-- Karnataka
('in-ka-bengaluru-urban', 'in-ka', 'IN', 'DISTRICT', 'Bengaluru Urban', 'bengaluru urban', 'KA', 'BLRU', NULL, NULL, 12.9716, 77.5946, 'ACTIVE', 'LGD_OFFICIAL'),
('in-ka-mysuru', 'in-ka', 'IN', 'DISTRICT', 'Mysuru', 'mysuru', 'KA', 'MYS', NULL, NULL, 12.2958, 76.6394, 'ACTIVE', 'LGD_OFFICIAL'),
('in-ka-dharwad', 'in-ka', 'IN', 'DISTRICT', 'Dharwad', 'dharwad', 'KA', 'DHW', NULL, NULL, 15.3647, 75.1240, 'ACTIVE', 'LGD_OFFICIAL'),
('in-ka-dakshina-kannada', 'in-ka', 'IN', 'DISTRICT', 'Dakshina Kannada', 'dakshina kannada', 'KA', 'DKN', NULL, NULL, 12.9141, 74.8560, 'ACTIVE', 'LGD_OFFICIAL'),
('in-ka-blr-city', 'in-ka-bengaluru-urban', 'IN', 'CITY', 'Bengaluru', 'bengaluru', 'KA', 'BLRU', 'BLR', '560001', 12.9716, 77.5946, 'ACTIVE', 'CENSUS_2011'),
('in-ka-mys-city', 'in-ka-mysuru', 'IN', 'CITY', 'Mysuru', 'mysuru', 'KA', 'MYS', 'MYS_CITY', '570001', 12.2958, 76.6394, 'ACTIVE', 'CENSUS_2011'),
('in-ka-hub-city', 'in-ka-dharwad', 'IN', 'CITY', 'Hubballi', 'hubballi', 'KA', 'DHW', 'HUB', '580020', 15.3647, 75.1240, 'ACTIVE', 'CENSUS_2011'),
('in-ka-mng-city', 'in-ka-dakshina-kannada', 'IN', 'CITY', 'Mangaluru', 'mangaluru', 'KA', 'DKN', 'MNG', '575001', 12.9141, 74.8560, 'ACTIVE', 'CENSUS_2011'),

-- Maharashtra
('in-mh-mumbai-city-dist', 'in-mh', 'IN', 'DISTRICT', 'Mumbai City', 'mumbai city', 'MH', 'MMC', NULL, NULL, 18.9388, 72.8354, 'ACTIVE', 'LGD_OFFICIAL'),
('in-mh-mumbai-suburban-dist', 'in-mh', 'IN', 'DISTRICT', 'Mumbai Suburban', 'mumbai suburban', 'MH', 'MMS', NULL, NULL, 19.0760, 72.8777, 'ACTIVE', 'LGD_OFFICIAL'),
('in-mh-pune-dist', 'in-mh', 'IN', 'DISTRICT', 'Pune', 'pune', 'MH', 'PUN', NULL, NULL, 18.5204, 73.8567, 'ACTIVE', 'LGD_OFFICIAL'),
('in-mh-thane-dist', 'in-mh', 'IN', 'DISTRICT', 'Thane', 'thane', 'MH', 'THN', NULL, NULL, 19.2183, 72.9781, 'ACTIVE', 'LGD_OFFICIAL'),
('in-mh-nagpur-dist', 'in-mh', 'IN', 'DISTRICT', 'Nagpur', 'nagpur', 'MH', 'NGP', NULL, NULL, 21.1458, 79.0882, 'ACTIVE', 'LGD_OFFICIAL'),
('in-mh-nashik-dist', 'in-mh', 'IN', 'DISTRICT', 'Nashik', 'nashik', 'MH', 'NSK', NULL, NULL, 19.9975, 73.7898, 'ACTIVE', 'LGD_OFFICIAL'),
('in-mh-mumbai-city', 'in-mh-mumbai-suburban-dist', 'IN', 'CITY', 'Mumbai', 'mumbai', 'MH', 'MMS', 'BOM', '400001', 19.0760, 72.8777, 'ACTIVE', 'CENSUS_2011'),
('in-mh-pune-city', 'in-mh-pune-dist', 'IN', 'CITY', 'Pune', 'pune', 'MH', 'PUN', 'PUN_CITY', '411001', 18.5204, 73.8567, 'ACTIVE', 'CENSUS_2011'),
('in-mh-thane-city', 'in-mh-thane-dist', 'IN', 'CITY', 'Thane', 'thane', 'MH', 'THN', 'THN_CITY', '400601', 19.2183, 72.9781, 'ACTIVE', 'CENSUS_2011'),
('in-mh-nagpur-city', 'in-mh-nagpur-dist', 'IN', 'CITY', 'Nagpur', 'nagpur', 'MH', 'NGP', 'NGP_CITY', '440001', 21.1458, 79.0882, 'ACTIVE', 'CENSUS_2011'),
('in-mh-nashik-city', 'in-mh-nashik-dist', 'IN', 'CITY', 'Nashik', 'nashik', 'MH', 'NSK', 'NSK_CITY', '422001', 19.9975, 73.7898, 'ACTIVE', 'CENSUS_2011'),

-- Tamil Nadu
('in-tn-chennai-dist', 'in-tn', 'IN', 'DISTRICT', 'Chennai', 'chennai', 'TN', 'CHN', NULL, NULL, 13.0827, 80.2707, 'ACTIVE', 'LGD_OFFICIAL'),
('in-tn-coimbatore-dist', 'in-tn', 'IN', 'DISTRICT', 'Coimbatore', 'coimbatore', 'TN', 'CBE', NULL, NULL, 11.0168, 76.9558, 'ACTIVE', 'LGD_OFFICIAL'),
('in-tn-madurai-dist', 'in-tn', 'IN', 'DISTRICT', 'Madurai', 'madurai', 'TN', 'MDU', NULL, NULL, 9.9252, 78.1198, 'ACTIVE', 'LGD_OFFICIAL'),
('in-tn-chennai-city', 'in-tn-chennai-dist', 'IN', 'CITY', 'Chennai', 'chennai', 'TN', 'CHN', 'MAA', '600001', 13.0827, 80.2707, 'ACTIVE', 'CENSUS_2011'),
('in-tn-coimbatore-city', 'in-tn-coimbatore-dist', 'IN', 'CITY', 'Coimbatore', 'coimbatore', 'TN', 'CBE', 'CJB', '641001', 11.0168, 76.9558, 'ACTIVE', 'CENSUS_2011'),
('in-tn-madurai-city', 'in-tn-madurai-dist', 'IN', 'CITY', 'Madurai', 'madurai', 'TN', 'MDU', 'IXM', '625001', 9.9252, 78.1198, 'ACTIVE', 'CENSUS_2011'),

-- Delhi NCR
('in-dl-newdelhi-dist', 'in-dl', 'IN', 'DISTRICT', 'New Delhi', 'new delhi', 'DL', 'NDL', NULL, NULL, 28.6139, 77.2090, 'ACTIVE', 'LGD_OFFICIAL'),
('in-dl-central-dist', 'in-dl', 'IN', 'DISTRICT', 'Central Delhi', 'central delhi', 'DL', 'CDL', NULL, NULL, 28.6500, 77.2300, 'ACTIVE', 'LGD_OFFICIAL'),
('in-dl-south-dist', 'in-dl', 'IN', 'DISTRICT', 'South Delhi', 'south delhi', 'DL', 'SDL', NULL, NULL, 28.5000, 77.1800, 'ACTIVE', 'LGD_OFFICIAL'),
('in-dl-newdelhi-city', 'in-dl-newdelhi-dist', 'IN', 'CITY', 'New Delhi', 'new delhi', 'DL', 'NDL', 'DEL', '110001', 28.6139, 77.2090, 'ACTIVE', 'CENSUS_2011'),
('in-hr-gurugram-dist', 'in-hr', 'IN', 'DISTRICT', 'Gurugram', 'gurugram', 'HR', 'GGM', NULL, NULL, 28.4595, 77.0266, 'ACTIVE', 'LGD_OFFICIAL'),
('in-hr-gurugram-city', 'in-hr-gurugram-dist', 'IN', 'CITY', 'Gurugram', 'gurugram', 'HR', 'GGM', 'GGN', '122001', 28.4595, 77.0266, 'ACTIVE', 'CENSUS_2011'),
('in-up-gautam-buddha-nagar', 'in-up', 'IN', 'DISTRICT', 'Gautam Buddha Nagar', 'gautam buddha nagar', 'UP', 'GBN', NULL, NULL, 28.5355, 77.3910, 'ACTIVE', 'LGD_OFFICIAL'),
('in-up-noida-city', 'in-up-gautam-buddha-nagar', 'IN', 'CITY', 'Noida', 'noida', 'UP', 'GBN', 'NDA', '201301', 28.5355, 77.3910, 'ACTIVE', 'CENSUS_2011')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  normalized_name = EXCLUDED.normalized_name,
  pincode = EXCLUDED.pincode,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;

-- ===========================================================================
-- 6. MAJOR LOCALITIES & METRO HUBS (HYDERABAD, VISAKHAPATNAM, BENGALURU)
-- ===========================================================================
INSERT INTO public.locations (id, parent_id, country_code, type, name, normalized_name, state_code, city_code, pincode, latitude, longitude, status, source) VALUES
-- Hyderabad Localities
('in-ts-hyd-loc-gachibowli', 'in-ts-hyd-city', 'IN', 'LOCALITY', 'Gachibowli', 'gachibowli', 'TS', 'HYD_CITY', '500032', 17.4401, 78.3489, 'ACTIVE', 'SEEDHA_CURATED'),
('in-ts-hyd-loc-madhapur', 'in-ts-hyd-city', 'IN', 'LOCALITY', 'Madhapur', 'madhapur', 'TS', 'HYD_CITY', '500081', 17.4483, 78.3915, 'ACTIVE', 'SEEDHA_CURATED'),
('in-ts-hyd-loc-kondapur', 'in-ts-hyd-city', 'IN', 'LOCALITY', 'Kondapur', 'kondapur', 'TS', 'HYD_CITY', '500084', 17.4699, 78.3578, 'ACTIVE', 'SEEDHA_CURATED'),
('in-ts-hyd-loc-hitec-city', 'in-ts-hyd-city', 'IN', 'LOCALITY', 'Hitec City', 'hitec city', 'TS', 'HYD_CITY', '500081', 17.4435, 78.3772, 'ACTIVE', 'SEEDHA_CURATED'),
('in-ts-hyd-loc-banjara-hills', 'in-ts-hyd-city', 'IN', 'LOCALITY', 'Banjara Hills', 'banjara hills', 'TS', 'HYD_CITY', '500034', 17.4156, 78.4350, 'ACTIVE', 'SEEDHA_CURATED'),
('in-ts-hyd-loc-jubilee-hills', 'in-ts-hyd-city', 'IN', 'LOCALITY', 'Jubilee Hills', 'jubilee hills', 'TS', 'HYD_CITY', '500033', 17.4319, 78.4073, 'ACTIVE', 'SEEDHA_CURATED'),
('in-ts-hyd-loc-financial-dist', 'in-ts-hyd-city', 'IN', 'LOCALITY', 'Financial District', 'financial district', 'TS', 'HYD_CITY', '500075', 17.4162, 78.3444, 'ACTIVE', 'SEEDHA_CURATED'),
('in-ts-hyd-loc-kukatpally', 'in-ts-hyd-city', 'IN', 'LOCALITY', 'Kukatpally', 'kukatpally', 'TS', 'HYD_CITY', '500072', 17.4875, 78.3953, 'ACTIVE', 'SEEDHA_CURATED'),
('in-ts-hyd-loc-manikonda', 'in-ts-hyd-city', 'IN', 'LOCALITY', 'Manikonda', 'manikonda', 'TS', 'HYD_CITY', '500089', 17.3995, 78.3840, 'ACTIVE', 'SEEDHA_CURATED'),
('in-ts-hyd-loc-miyapur', 'in-ts-hyd-city', 'IN', 'LOCALITY', 'Miyapur', 'miyapur', 'TS', 'HYD_CITY', '500049', 17.4968, 78.3547, 'ACTIVE', 'SEEDHA_CURATED'),

-- Visakhapatnam Localities
('in-ap-vsp-loc-madhurawada', 'in-ap-vsp-city', 'IN', 'LOCALITY', 'Madhurawada', 'madhurawada', 'AP', 'VSP_CITY', '530048', 17.8200, 83.3500, 'ACTIVE', 'SEEDHA_CURATED'),
('in-ap-vsp-loc-gajuwaka', 'in-ap-vsp-city', 'IN', 'LOCALITY', 'Gajuwaka', 'gajuwaka', 'AP', 'VSP_CITY', '530026', 17.6900, 83.2100, 'ACTIVE', 'SEEDHA_CURATED'),
('in-ap-vsp-loc-mvp-colony', 'in-ap-vsp-city', 'IN', 'LOCALITY', 'MVP Colony', 'mvp colony', 'AP', 'VSP_CITY', '530017', 17.7400, 83.3300, 'ACTIVE', 'SEEDHA_CURATED'),
('in-ap-vsp-loc-seethammadhara', 'in-ap-vsp-city', 'IN', 'LOCALITY', 'Seethammadhara', 'seethammadhara', 'AP', 'VSP_CITY', '530013', 17.7340, 83.3100, 'ACTIVE', 'SEEDHA_CURATED'),

-- Vijayawada Localities
('in-ap-vja-loc-benz-circle', 'in-ap-ntr-vijayawada', 'IN', 'LOCALITY', 'Benz Circle', 'benz circle', 'AP', 'VJA_CITY', '520010', 16.5000, 80.6500, 'ACTIVE', 'SEEDHA_CURATED'),
('in-ap-vja-loc-governorpet', 'in-ap-ntr-vijayawada', 'IN', 'LOCALITY', 'Governorpet', 'governorpet', 'AP', 'VJA_CITY', '520002', 16.5120, 80.6270, 'ACTIVE', 'SEEDHA_CURATED')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  normalized_name = EXCLUDED.normalized_name,
  pincode = EXCLUDED.pincode,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude;
