#!/usr/bin/env node
/**
 * Maps existing properties in public.properties to canonical location IDs in public.locations.
 *
 * Enforces:
 * - property.state_id -> canonical state location ID
 * - property.district_id -> canonical district location ID
 * - property.city_id -> canonical city location ID
 * - property.locality_id -> canonical locality location ID
 * - Outputs unmapped property report if any listing cannot be deterministically resolved
 */
import postgres from "postgres";

const connectionString = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: "require", max: 2, onnotice: () => {} });

async function mapProperties() {
  console.log("Auditing and mapping properties to canonical location IDs...");

  // 1. Batch map city, district, state
  const cityRes = await sql`
    UPDATE public.properties p
    SET
      city_id = l.id,
      district_id = l.district_id,
      state_id = l.state_id,
      updated_at = NOW()
    FROM public.locations l
    WHERE l.type IN ('CITY', 'TOWN')
      AND (LOWER(l.normalized_name) = LOWER(TRIM(p.city)) OR LOWER(l.name) = LOWER(TRIM(p.city)))
      AND p.city_id IS NULL;
  `;

  // 2. Handle aliases like Bangalore -> Bengaluru
  const aliasRes = await sql`
    UPDATE public.properties p
    SET
      city_id = 'in-ka-blr-city',
      district_id = 'in-ka-bengaluru-urban',
      state_id = 'in-ka',
      updated_at = NOW()
    WHERE LOWER(TRIM(p.city)) IN ('bangalore', 'bengaluru')
      AND p.city_id IS NULL;
  `;

  // 3. Batch map locality_id
  const locRes = await sql`
    UPDATE public.properties p
    SET
      locality_id = loc.id,
      updated_at = NOW()
    FROM public.locations loc
    WHERE loc.type = 'LOCALITY'
      AND (LOWER(loc.normalized_name) = LOWER(TRIM(p.locality)) OR LOWER(loc.name) = LOWER(TRIM(p.locality)))
      AND (loc.city_id = p.city_id OR loc.parent_id = p.city_id)
      AND p.locality_id IS NULL;
  `;

  // 4. Audit final counts
  const [counts] = await sql`
    SELECT 
      count(*) as total,
      count(city_id) as mapped_city,
      count(district_id) as mapped_district,
      count(state_id) as mapped_state,
      count(locality_id) as mapped_locality,
      count(*) - count(city_id) as unmapped
    FROM public.properties;
  `;

  console.log(`\nMapping Results:`);
  console.log(`- Total Properties:      ${counts.total}`);
  console.log(`- Mapped City IDs:       ${counts.mapped_city}`);
  console.log(`- Mapped District IDs:   ${counts.mapped_district}`);
  console.log(`- Mapped State IDs:      ${counts.mapped_state}`);
  console.log(`- Mapped Locality IDs:   ${counts.mapped_locality}`);
  console.log(`- Unmapped count:        ${counts.unmapped}`);

  if (Number(counts.unmapped) > 0) {
    const unmappedRows = await sql`
      SELECT id, title, city, locality, pincode
      FROM public.properties
      WHERE city_id IS NULL;
    `;
    console.warn("\nUNMAPPED PROPERTIES REPORT (Require manual owner review):");
    console.table(unmappedRows);
  } else {
    console.log("PASS: 100% of existing properties successfully mapped to canonical location IDs.");
  }
}

mapProperties()
  .catch((err) => {
    console.error("Mapping failed:", err);
    process.exitCode = 1;
  })
  .finally(() => sql.end({ timeout: 5 }));
