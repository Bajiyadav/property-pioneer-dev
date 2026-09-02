/**
 * Seedha Properties - Location-Scoped Statistics API (/api/v2/stats/location)
 * Authoritative server-side statistics scoped strictly to State -> City.
 */

import { sql } from "@/server/db";
import { createSanitizedResponse } from "@/server/security-middleware";

export interface LocationStats {
  state: string;
  city: string;
  totalListings: number;
  buyCount: number;
  rentCount: number;
  commercialCount: number;
  verifiedCount: number;
  topLocalities: Array<{ locality: string; count: number }>;
}

export async function getLocationScopedStats(state: string, city: string): Promise<LocationStats> {
  const normalizedState = state.trim().toLowerCase();
  const normalizedCity = city.trim().toLowerCase();

  // Execute single optimized aggregate query against PostgreSQL
  const [stats] = await sql`
    SELECT 
      COUNT(*)::int AS total_listings,
      COUNT(*) FILTER (WHERE LOWER(listing_type) = 'buy')::int AS buy_count,
      COUNT(*) FILTER (WHERE LOWER(listing_type) = 'rent')::int AS rent_count,
      COUNT(*) FILTER (WHERE LOWER(listing_type) = 'commercial')::int AS commercial_count,
      COUNT(*) FILTER (WHERE is_verified = true)::int AS verified_count
    FROM properties
    WHERE LOWER(state_name) = ${normalizedState}
      AND LOWER(city_name) = ${normalizedCity}
      AND status = 'ACTIVE';
  `;

  // Fetch top 5 localities within this state + city
  const topLocalities = await sql`
    SELECT locality, COUNT(*)::int AS count
    FROM properties
    WHERE LOWER(state_name) = ${normalizedState}
      AND LOWER(city_name) = ${normalizedCity}
      AND status = 'ACTIVE'
    GROUP BY locality
    ORDER BY count DESC
    LIMIT 5;
  `;

  return {
    state,
    city,
    totalListings: stats?.total_listings ?? 0,
    buyCount: stats?.buy_count ?? 0,
    rentCount: stats?.rent_count ?? 0,
    commercialCount: stats?.commercial_count ?? 0,
    verifiedCount: stats?.verified_count ?? 0,
    topLocalities: topLocalities.map((row: any) => ({
      locality: row.locality,
      count: row.count,
    })),
  };
}

export async function handleLocationStats(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const city = url.searchParams.get("city");

  if (!state || !city || state.trim().length === 0 || city.trim().length === 0) {
    return createSanitizedResponse(
      {
        ok: false,
        error: "Both 'state' and 'city' parameters are mandatory for location-scoped statistics.",
      },
      400,
      request,
    );
  }

  try {
    const stats = await getLocationScopedStats(state, city);
    return createSanitizedResponse({ ok: true, data: stats }, 200, request);
  } catch (error: any) {
    return createSanitizedResponse(
      { ok: false, error: error?.message || "Failed to load location statistics" },
      500,
      request,
    );
  }
}
