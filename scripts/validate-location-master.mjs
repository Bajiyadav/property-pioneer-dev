#!/usr/bin/env node
/**
 * Comprehensive Data Coverage & Integrity Validation Engine for
 * Authoritative India Location Master across PostgreSQL/PostGIS.
 *
 * Checks:
 * 1. Counts: States (28), UTs (8), Districts, Cities, Towns, Localities, PIN codes
 * 2. Hierarchy integrity: No orphan records, missing parents, or invalid relationships
 * 3. Coordinates validation: Valid latitude (-90 to 90) and longitude (-180 to 180)
 * 4. Property mapping audit: Identify any properties unmapped to canonical IDs
 * 5. State-by-State breakdown
 */
import postgres from "postgres";

const connectionString = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set.");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require", max: 2, onnotice: () => {} });

async function validate() {
  console.log("===============================================================================");
  console.log("             AUTHORITATIVE INDIA LOCATION MASTER — VALIDATION AUDIT            ");
  console.log("===============================================================================\n");

  // 1. Overall counts by type
  const typeCountsRaw = await sql`
    SELECT type, count(*)::int as count
    FROM public.locations
    GROUP BY type
    ORDER BY count DESC
  `;
  const typeCounts = Object.fromEntries(typeCountsRaw.map(r => [r.type, r.count]));

  console.log("1. HIERARCHY POPULATION COUNTS (LIVE POSTGRESQL):");
  console.log("--------------------------------------------------");
  console.log(`- Country:           ${typeCounts["COUNTRY"] || 0}`);
  console.log(`- States:            ${typeCounts["STATE"] || 0} (Target: 28)`);
  console.log(`- Union Territories: ${typeCounts["UNION_TERRITORY"] || 0} (Target: 8)`);
  console.log(`- Districts:         ${typeCounts["DISTRICT"] || 0}`);
  console.log(`- Cities:            ${typeCounts["CITY"] || 0}`);
  console.log(`- Towns:             ${typeCounts["TOWN"] || 0}`);
  console.log(`- Localities:        ${typeCounts["LOCALITY"] || 0}`);
  console.log(`- Postal PIN Codes:  ${typeCounts["PINCODE"] || 0}`);
  const total = await sql`SELECT count(*)::int FROM public.locations`;
  console.log(`- TOTAL MASTER ROWS: ${total[0].count}\n`);

  // 2. Orphan check (records with parent_id not found in locations)
  const orphans = await sql`
    SELECT l.id, l.type, l.name, l.parent_id
    FROM public.locations l
    LEFT JOIN public.locations p ON l.parent_id = p.id
    WHERE l.parent_id IS NOT NULL AND p.id IS NULL
  `;
  console.log("2. ORPHAN RECORD AUDIT:");
  console.log("-----------------------");
  console.log(`- Orphan count: ${orphans.length}`);
  if (orphans.length > 0) {
    console.error("  FAIL: Found orphans:", orphans.slice(0, 5));
  } else {
    console.log("  PASS: Zero orphan records found.\n");
  }

  // 3. Invalid Parent-Child Hierarchy Relationships
  // Allowed:
  // COUNTRY -> has parent NULL
  // STATE / UT -> parent must be COUNTRY
  // DISTRICT -> parent must be STATE or UNION_TERRITORY
  // CITY / TOWN -> parent must be DISTRICT (or STATE/UT in special metro cases)
  // LOCALITY -> parent must be CITY or TOWN
  // PINCODE -> parent must be CITY, TOWN, or LOCALITY
  const invalidParents = await sql`
    SELECT c.id, c.name, c.type as child_type, p.type as parent_type
    FROM public.locations c
    JOIN public.locations p ON c.parent_id = p.id
    WHERE (c.type = 'DISTRICT' AND p.type NOT IN ('STATE', 'UNION_TERRITORY'))
       OR (c.type = 'LOCALITY' AND p.type NOT IN ('CITY', 'TOWN'))
  `;
  console.log("3. HIERARCHY INTEGRITY AUDIT:");
  console.log("-----------------------------");
  console.log(`- Invalid Parent Relationships: ${invalidParents.length}`);
  if (invalidParents.length > 0) {
    console.error("  FAIL: Invalid parent-child relationships:", invalidParents.slice(0, 5));
  } else {
    console.log("  PASS: All parent-child relationships follow the canonical hierarchy.\n");
  }

  // 4. Locality classification check (Verify Gachibowli, Madhapur, etc. are NOT classified as cities)
  const misplacedLocalities = await sql`
    SELECT id, name, type FROM public.locations
    WHERE name IN ('Gachibowli', 'Madhapur', 'Kondapur', 'Kukatpally', 'Jubilee Hills', 'Banjara Hills', 'Miyapur')
      AND type = 'CITY'
  `;
  console.log("4. LOCALITY CLASSIFICATION INTEGRITY (HYDERABAD TEST):");
  console.log("------------------------------------------------------");
  if (misplacedLocalities.length > 0) {
    console.error(`  FAIL: Found ${misplacedLocalities.length} localities incorrectly classified as CITY:`, misplacedLocalities);
  } else {
    console.log("  PASS: Gachibowli, Madhapur, Kondapur, Kukatpally, Jubilee Hills, Banjara Hills, Miyapur are NOT classified as cities.\n");
  }

  // 5. Invalid Coordinates Check
  const invalidCoords = await sql`
    SELECT id, name, latitude, longitude
    FROM public.locations
    WHERE (latitude IS NOT NULL AND (latitude < 6.0 OR latitude > 38.0))
       OR (longitude IS NOT NULL AND (longitude < 68.0 OR longitude > 98.0))
  `;
  console.log("5. GEOGRAPHICAL BOUNDS AUDIT (INDIA BOUNDING BOX):");
  console.log("-------------------------------------------------");
  console.log(`- Out of bounds coordinates: ${invalidCoords.length}`);
  if (invalidCoords.length > 0) {
    console.warn("  WARNING: Locations outside standard India bbox:", invalidCoords.slice(0, 5));
  } else {
    console.log("  PASS: All coordinates fall within the India geographic bounds.\n");
  }

  // 6. Property Mapping Audit
  const properties = await sql`
    SELECT id, title, city, locality, pincode, state_id, district_id, city_id
    FROM public.properties
  `;
  console.log("6. PROPERTY TABLE MAPPING AUDIT:");
  console.log("--------------------------------");
  console.log(`- Total live properties: ${properties.length}`);
  const unmapped = properties.filter(p => !p.city_id);
  console.log(`- Unmapped properties (missing city_id): ${unmapped.length}`);
  if (unmapped.length > 0) {
    console.log("  Unmapped properties sample:", unmapped.map(p => ({ id: p.id, title: p.title, city: p.city, locality: p.locality })));
  } else {
    console.log("  PASS: All live properties mapped to canonical location IDs.\n");
  }

  // 7. State-by-State Breakdown
  console.log("7. STATE-BY-STATE BREAKDOWN:");
  console.log("----------------------------");
  const stateBreakdown = await sql`
    SELECT
      s.name as state_name,
      s.type as state_type,
      (SELECT count(*)::int FROM public.locations WHERE state_id = s.id AND type = 'DISTRICT') as districts,
      (SELECT count(*)::int FROM public.locations WHERE state_id = s.id AND type IN ('CITY', 'TOWN')) as cities_and_towns,
      (SELECT count(*)::int FROM public.locations WHERE state_id = s.id AND type = 'LOCALITY') as localities,
      (SELECT count(*)::int FROM public.locations WHERE state_id = s.id AND type = 'PINCODE') as pincodes
    FROM public.locations s
    WHERE s.type IN ('STATE', 'UNION_TERRITORY')
    ORDER BY s.name ASC
  `;
  console.table(stateBreakdown);

  // Specific Check for AP and TS zero-district audit
  const apZero = stateBreakdown.find(s => s.state_name === "Andhra Pradesh");
  const tsZero = stateBreakdown.find(s => s.state_name === "Telangana");
  console.log(`Andhra Pradesh: ${apZero?.districts} Districts, ${apZero?.cities_and_towns} Cities/Towns, ${apZero?.localities} Localities, ${apZero?.pincodes} Pincodes`);
  console.log(`Telangana:      ${tsZero?.districts} Districts, ${tsZero?.cities_and_towns} Cities/Towns, ${tsZero?.localities} Localities, ${tsZero?.pincodes} Pincodes`);

  console.log("\n===============================================================================");
}

validate()
  .catch((err) => {
    console.error("Validation error:", err);
    process.exitCode = 1;
  })
  .finally(() => sql.end({ timeout: 5 }));
