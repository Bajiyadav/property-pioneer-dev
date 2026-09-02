import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";
import { sql, timedQuery } from "@/server/db";
import { serverCache } from "@/server/cache";

export const Route = createFileRoute("/api/v2/properties")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const city = url.searchParams.get("city")?.trim() || "";
          const listingType = url.searchParams.get("listing_type")?.trim() || "";
          const minPrice = Number(url.searchParams.get("min_price")) || 0;
          const maxPrice = Number(url.searchParams.get("max_price")) || 0;
          const bedrooms = Number(url.searchParams.get("bedrooms")) || 0;
          const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100);
          const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

          const cacheKey = `props:${city}:${listingType}:${minPrice}:${maxPrice}:${bedrooms}:${limit}:${offset}`;

          // Check memory cache first (sub-1ms)
          const cached = serverCache.get(cacheKey);
          if (cached) {
            return jsonResponse(
              {
                ok: true,
                source: "cache",
                data: cached,
                latencyMs: 0.5,
              },
              200,
            );
          }

          // Execute query directly against PostgreSQL pool with prepared statements
          const { data: rows, durationMs } = await timedQuery("fetchProperties", async () => {
            return sql`
              SELECT 
                id,
                title,
                description,
                price,
                city,
                locality,
                property_type,
                listing_type,
                bedrooms,
                bathrooms,
                built_up_sqft,
                furnishing,
                status,
                is_approved,
                images,
                created_at,
                updated_at
              FROM properties
              WHERE is_approved = true
                ${city ? sql`AND city ILIKE ${"%" + city + "%"}` : sql``}
                ${listingType ? sql`AND listing_type ILIKE ${"%" + listingType + "%"}` : sql``}
                ${bedrooms > 0 ? sql`AND bedrooms >= ${bedrooms}` : sql``}
                ${minPrice > 0 ? sql`AND price >= ${minPrice}` : sql``}
                ${maxPrice > 0 ? sql`AND price <= ${maxPrice}` : sql``}
              ORDER BY created_at DESC
              LIMIT ${limit}
              OFFSET ${offset}
            `;
          });

          // Cache public results for 60 seconds
          serverCache.set(cacheKey, rows, 60);

          return jsonResponse(
            {
              ok: true,
              source: "database",
              data: rows,
              count: rows.length,
              latencyMs: durationMs,
            },
            200,
          );
        } catch (error: any) {
          return jsonResponse(
            {
              ok: false,
              error: "Failed to fetch properties",
              details: error?.message,
            },
            500,
          );
        }
      },
    },
  },
});
