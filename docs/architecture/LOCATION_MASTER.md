# Seedha Properties — Complete India Location Master Architecture

## 1. Overview & Strategic Mandate

Seedha Properties enforces a **strict location-first discovery model**:
$$\text{India} \longrightarrow \text{State / Union Territory} \longrightarrow \text{District} \longrightarrow \text{City / Town} \longrightarrow \text{Locality / Pincode}$$

Property discovery, search, buy feeds, rent feeds, and commercial listings remain strictly location-gated until a valid State and City/District are established.

This authoritative location dataset is unified across:

- **Backend (Java 21 / Spring Boot 3)**: RESTful location services under `/api/v2/locations/*`
- **Database (PostgreSQL 16 + PostGIS 3.4)**: `public.locations` table with SRID 4326 geometries and spatial GiST indexes
- **React Web Client**: Cascading State $\rightarrow$ District $\rightarrow$ City selector, offline caching, session persistence
- **Flutter Mobile Client**: Shared location contracts, offline resilient fallbacks, zero RenderFlex overflow across 360–430dp

---

## 2. Authoritative Data Sources

1. **Local Government Directory (LGD)** — Ministry of Panchayati Raj, Government of India:
   - Standard administrative hierarchy codes for States, Districts, Sub-districts, and Villages.
2. **Census of India** — Office of the Registrar General & Census Commissioner, India (ORGI):
   - Urban agglomerations, statutory towns, census towns, and standard district codes.
3. **Department of Posts (India Post)**:
   - 6-digit Postal Index Number (PIN) code directory and delivery post office mappings.
4. **Survey of India (SOI)**:
   - WGS84 coordinates (EPSG:4326) for state, district, and city centroids.

---

## 3. Administrative Coverage

### 3.1 All 36 States and Union Territories of India

Seedha Properties supports all 28 States and 8 Union Territories:

| #   | State / UT Name                      | ISO Code       | LGD Type | Regional Focus                                        |
| --- | ------------------------------------ | -------------- | -------- | ----------------------------------------------------- |
| 1   | Andhra Pradesh                       | `IN-AP` / `AP` | State    | Core Operating Market (All 26 Districts)              |
| 2   | Telangana                            | `IN-TG` / `TS` | State    | Core Operating Market (All 33 Districts)              |
| 3   | Karnataka                            | `IN-KA` / `KA` | State    | Active Metro (Bengaluru, Mysuru, Hubballi, Mangaluru) |
| 4   | Maharashtra                          | `IN-MH` / `MH` | State    | Active Metro (Mumbai, Pune, Nagpur, Thane, Nashik)    |
| 5   | Tamil Nadu                           | `IN-TN` / `TN` | State    | Active Metro (Chennai, Coimbatore, Madurai)           |
| 6   | Delhi NCR                            | `IN-DL` / `DL` | UT / NCT | Active Metro (Delhi, Gurugram, Noida, Faridabad)      |
| 7   | Uttar Pradesh                        | `IN-UP` / `UP` | State    | Nationwide Network                                    |
| 8   | West Bengal                          | `IN-WB` / `WB` | State    | Nationwide Network                                    |
| 9   | Gujarat                              | `IN-GJ` / `GJ` | State    | Nationwide Network                                    |
| 10  | Rajasthan                            | `IN-RJ` / `RJ` | State    | Nationwide Network                                    |
| 11  | Kerala                               | `IN-KL` / `KL` | State    | Nationwide Network                                    |
| 12  | Punjab                               | `IN-PB` / `PB` | State    | Nationwide Network                                    |
| 13  | Haryana                              | `IN-HR` / `HR` | State    | Nationwide Network                                    |
| 14  | Madhya Pradesh                       | `IN-MP` / `MP` | State    | Nationwide Network                                    |
| 15  | Bihar                                | `IN-BR` / `BR` | State    | Nationwide Network                                    |
| 16  | Odisha                               | `IN-OD` / `OR` | State    | Nationwide Network                                    |
| 17  | Jharkhand                            | `IN-JH` / `JH` | State    | Nationwide Network                                    |
| 18  | Chhattisgarh                         | `IN-CT` / `CT` | State    | Nationwide Network                                    |
| 19  | Assam                                | `IN-AS` / `AS` | State    | Nationwide Network                                    |
| 20  | Goa                                  | `IN-GA` / `GA` | State    | Nationwide Network                                    |
| 21  | Uttarakhand                          | `IN-UT` / `UK` | State    | Nationwide Network                                    |
| 22  | Himachal Pradesh                     | `IN-HP` / `HP` | State    | Nationwide Network                                    |
| 23  | Jammu and Kashmir                    | `IN-JK` / `JK` | UT       | Nationwide Network                                    |
| 24  | Chandigarh                           | `IN-CH` / `CH` | UT       | Nationwide Network                                    |
| 25  | Ladakh                               | `IN-LA` / `LA` | UT       | Nationwide Network                                    |
| 26  | Dadra & Nagar Haveli and Daman & Diu | `IN-DH` / `DD` | UT       | Nationwide Network                                    |
| 27  | Lakshadweep                          | `IN-LD` / `LD` | UT       | Nationwide Network                                    |
| 28  | Puducherry                           | `IN-PY` / `PY` | UT       | Nationwide Network                                    |
| 29  | Andaman and Nicobar Islands          | `IN-AN` / `AN` | UT       | Nationwide Network                                    |
| 30  | Tripura                              | `IN-TR` / `TR` | State    | Nationwide Network                                    |
| 31  | Meghalaya                            | `IN-ML` / `ML` | State    | Nationwide Network                                    |
| 32  | Manipur                              | `IN-MN` / `MN` | State    | Nationwide Network                                    |
| 33  | Nagaland                             | `IN-NL` / `NL` | State    | Nationwide Network                                    |
| 34  | Arunachal Pradesh                    | `IN-AR` / `AR` | State    | Nationwide Network                                    |
| 35  | Mizoram                              | `IN-MZ` / `MZ` | State    | Nationwide Network                                    |
| 36  | Sikkim                               | `IN-SK` / `SK` | State    | Nationwide Network                                    |

---

### 3.2 Andhra Pradesh — Complete 26 Reorganized Districts

On April 4, 2022, the Government of Andhra Pradesh restructured the state into **26 districts**. Seedha Properties indexes all 26:

1. **Alluri Sitharama Raju** (HQ: Paderu) — `IN-AP-ALLURI`
2. **Anakapalli** (HQ: Anakapalli) — `IN-AP-ANAKAPALLI`
3. **Ananthapuramu** (HQ: Anantapur) — `IN-AP-ANANTHAPURAMU`
4. **Annamayya** (HQ: Rayachoti) — `IN-AP-ANNAMAYYA`
5. **Bapatla** (HQ: Bapatla) — `IN-AP-BAPATLA`
6. **Chittoor** (HQ: Chittoor) — `IN-AP-CHITTOOR`
7. **Dr. B.R. Ambedkar Konaseema** (HQ: Amalapuram) — `IN-AP-DRAVIDA`
8. **East Godavari** (HQ: Rajamahendravaram / Rajahmundry) — `IN-AP-EAST-GODAVARI`
9. **Eluru** (HQ: Eluru) — `IN-AP-ELURU`
10. **Guntur** (HQ: Guntur) — `IN-AP-GUNTUR`
11. **Kakinada** (HQ: Kakinada) — `IN-AP-KAKINADA`
12. **Krishna** (HQ: Machilipatnam) — `IN-AP-KRISHNA`
13. **Kurnool** (HQ: Kurnool) — `IN-AP-KURNOOL`
14. **Nandyal** (HQ: Nandyal) — `IN-AP-NANDYAL`
15. **NTR** (HQ: Vijayawada) — `IN-AP-NTR`
16. **Palnadu** (HQ: Narasaraopet) — `IN-AP-PALNADU`
17. **Parvathipuram Manyam** (HQ: Parvathipuram) — `IN-AP-PARVATHIPURAM`
18. **Prakasam** (HQ: Ongole) — `IN-AP-PRAKASAM`
19. **Sri Potti Sriramulu Nellore** (HQ: Nellore) — `IN-AP-NELLORE`
20. **Sri Sathya Sai** (HQ: Puttaparthi) — `IN-AP-SATYASAI`
21. **Srikakulam** (HQ: Srikakulam) — `IN-AP-SRIKAKULAM`
22. **Tirupati** (HQ: Tirupati) — `IN-AP-TIRUPATI`
23. **Visakhapatnam** (HQ: Visakhapatnam) — `IN-AP-VISAKHAPATNAM`
24. **Vizianagaram** (HQ: Vizianagaram) — `IN-AP-VIZIANAGARAM`
25. **West Godavari** (HQ: Bhimavaram) — `IN-AP-WEST-GODAVARI`
26. **YSR Kadapa** (HQ: Kadapa) — `IN-AP-YSR`

---

### 3.3 Telangana — Complete 33 Reorganized Districts

Seedha Properties indexes all **33 districts** of Telangana:

1. **Adilabad** — `IN-TG-ADILABAD`
2. **Bhadradri Kothagudem** (HQ: Kothagudem) — `IN-TG-BHADRADRI`
3. **Hanumakonda** — `IN-TG-HANUMAKONDA`
4. **Hyderabad** — `IN-TG-HYDERABAD`
5. **Jagtial** — `IN-TG-JAGTIAL`
6. **Jangaon** — `IN-TG-JANGAON`
7. **Jayashankar Bhupalpally** — `IN-TG-JAYASHANKAR`
8. **Jogulamba Gadwal** (HQ: Gadwal) — `IN-TG-JOGULAMBA`
9. **Kamareddy** — `IN-TG-KAMAREDDY`
10. **Karimnagar** — `IN-TG-KARIMNAGAR`
11. **Khammam** — `IN-TG-KHAMMAM`
12. **Kumuram Bheem Asifabad** (HQ: Asifabad) — `IN-TG-KUMURAM`
13. **Mahabubabad** — `IN-TG-MAHABUBABAD`
14. **Mahabubnagar** — `IN-TG-MAHABUBNAGAR`
15. **Mancherial** — `IN-TG-MANCHERIAL`
16. **Medak** — `IN-TG-MEDAK`
17. **Medchal-Malkajgiri** — `IN-TG-MEDCHAL`
18. **Mulugu** — `IN-TG-MULUGU`
19. **Nagarkurnool** — `IN-TG-NAGARKURNOOL`
20. **Nalgonda** — `IN-TG-NALGONDA`
21. **Narayanpet** — `IN-TG-NARAYANPET`
22. **Nirmal** — `IN-TG-NIRMAL`
23. **Nizamabad** — `IN-TG-NIZAMABAD`
24. **Peddapalli** — `IN-TG-PEDDAPALLI`
25. **Rajanna Sircilla** (HQ: Sircilla) — `IN-TG-RAJANNA`
26. **Ranga Reddy** (HQ: Shamshabad) — `IN-TG-RANGAREDDY`
27. **Sangareddy** — `IN-TG-SANGAREDDY`
28. **Siddipet** — `IN-TG-SIDDIPET`
29. **Suryapet** — `IN-TG-SURYAPET`
30. **Vikarabad** — `IN-TG-VIKARABAD`
31. **Wanaparthy** — `IN-TG-WANAPARTHY`
32. **Warangal** — `IN-TG-WARANGAL`
33. **Yadadri Bhuvanagiri** (HQ: Bhongir) — `IN-TG-YADADRI`

---

## 4. Database Schema & PostGIS Architecture

Migration: `supabase/migrations/20260906000000_create_india_locations_master.sql`

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS public.locations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32),
    type VARCHAR(32) NOT NULL CHECK (type IN ('STATE', 'DISTRICT', 'CITY', 'LOCALITY')),
    parent_id VARCHAR(64) REFERENCES public.locations(id) ON DELETE CASCADE,
    state_code VARCHAR(8),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    coordinates geometry(Point, 4326),
    pincode VARCHAR(16),
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Spatial GiST Index for sub-millisecond radius and bbox queries
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON public.locations USING GIST (coordinates);

-- B-Tree indexes for fast hierarchical queries
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON public.locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_name_trgm ON public.locations USING gin (name gin_trgm_ops);
```

---

## 5. Spring Boot 3 REST API Specification

Base Path: `/api/v2/locations`

| Method | Path                             | Description                        | Query Parameters / Path Vars                                | Response                      |
| ------ | -------------------------------- | ---------------------------------- | ----------------------------------------------------------- | ----------------------------- |
| `GET`  | `/states`                        | List all 36 States & UTs           | None                                                        | `List<LocationEntity>`        |
| `GET`  | `/states/{stateId}/districts`    | List districts in state            | `stateId`: code or ID (e.g., `AP`, `IN-AP`)                 | `List<LocationEntity>`        |
| `GET`  | `/districts/{districtId}/cities` | List cities in district            | `districtId`: ID or district name                           | `List<LocationEntity>`        |
| `GET`  | `/cities/{cityId}/localities`    | List localities in city            | `cityId`: ID or city name                                   | `List<LocationEntity>`        |
| `GET`  | `/search`                        | Full-text & prefix location search | `q` (min 2 chars), `state` (optional), `limit` (default 10) | `List<LocationEntity>`        |
| `GET`  | `/{id}`                          | Lookup canonical location by ID    | `id`: canonical ID                                          | `LocationEntity` (200) or 404 |

---

## 6. Frontend & Mobile Client Resiliency

1. **Web Client (`src/modules/location/services/locationMasterService.ts`)**:
   - Primary: Fetches `/api/v2/locations/*` with in-memory caching.
   - Secondary / Offline: Comprehensive Government of India fallback dataset embedded directly.
   - Preserves `seedha_selected_state`, `seedha_selected_city`, and `seedha_selected_location_id` in `sessionStorage` and `localStorage`.
2. **Flutter Mobile Client (`apps/mobile/lib/core/network/native_api_client.dart` & `constants.dart`)**:
   - `getStates()`, `getDistricts(stateId)`, `getCities(districtId)`, and `searchLocations(q)`.
   - Complete offline dictionary in `AppConstants.allStates`, `AppConstants.citiesByState`, and `AppConstants.cityCentroids`.
   - Verified 100% overflow-free layout across 360dp, 375dp, 390dp, and 412dp screen widths.
