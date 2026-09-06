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
          const suggest =
            url.searchParams.get("suggest") === "true" ||
            url.searchParams.get("mode") === "suggest";

          // Free-text keyword search
          const q = (
            url.searchParams.get("q") ||
            url.searchParams.get("query") ||
            url.searchParams.get("search") ||
            ""
          ).trim();

          // Geographic location scoping
          const city = url.searchParams.get("city")?.trim() || "";
          const locality = url.searchParams.get("locality")?.trim() || "";

          // Instant Autocomplete / Locality Suggestion Mode
          if (suggest) {
            const cacheKey = `suggest:${city}:${locality || q}`;
            const cached = serverCache.get(cacheKey);
            if (cached) {
              return jsonResponse({ ok: true, source: "cache", data: cached, latencyMs: 0.5 }, 200);
            }

            const term = (locality || q).trim();
            const { data: suggestions, durationMs } = await timedQuery(
              "suggestLocalities",
              async () => {
                return sql`
                  SELECT 
                    locality,
                    city,
                    COUNT(*)::int AS count
                  FROM properties
                  WHERE is_approved = true
                    AND locality IS NOT NULL
                    AND TRIM(locality) != ''
                    ${city ? sql`AND city ILIKE ${"%" + city + "%"}` : sql``}
                    ${term ? sql`AND locality ILIKE ${"%" + term + "%"}` : sql``}
                  GROUP BY locality, city
                  ORDER BY count DESC, locality ASC
                  LIMIT 10
                `;
              },
            );

            serverCache.set(cacheKey, suggestions, 120);
            return jsonResponse(
              { ok: true, source: "database", data: suggestions, latencyMs: durationMs },
              200,
            );
          }

          // Property category & types
          const listingType = (
            url.searchParams.get("listing_type") ||
            url.searchParams.get("listingType") ||
            url.searchParams.get("listing") ||
            ""
          ).trim();

          const propertyType = (
            url.searchParams.get("property_type") ||
            url.searchParams.get("propertyType") ||
            url.searchParams.get("type") ||
            ""
          ).trim();

          const furnishing = (
            url.searchParams.get("furnishing") ||
            url.searchParams.get("furnishing_status") ||
            ""
          ).trim();

          // Numerical range filters
          const minPrice =
            Number(url.searchParams.get("min_price") || url.searchParams.get("minPrice")) || 0;
          const maxPrice =
            Number(url.searchParams.get("max_price") || url.searchParams.get("maxPrice")) || 0;
          const bedrooms =
            Number(url.searchParams.get("bedrooms") || url.searchParams.get("beds")) || 0;
          const bathrooms =
            Number(url.searchParams.get("bathrooms") || url.searchParams.get("baths")) || 0;
          const minArea =
            Number(url.searchParams.get("min_area") || url.searchParams.get("minArea")) || 0;
          const maxArea =
            Number(url.searchParams.get("max_area") || url.searchParams.get("maxArea")) || 0;

          // Geospatial proximity filters
          const lat = Number(url.searchParams.get("lat") || url.searchParams.get("latitude")) || 0;
          const lng = Number(url.searchParams.get("lng") || url.searchParams.get("longitude")) || 0;
          const radiusKm =
            Number(url.searchParams.get("radius_km") || url.searchParams.get("radius")) || 0;

          // Sorting
          const sort = (url.searchParams.get("sort") || url.searchParams.get("sort_by") || "newest")
            .trim()
            .toLowerCase();

          // Pagination
          const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100);
          const page = Number(url.searchParams.get("page")) || 1;
          const offset = url.searchParams.has("offset")
            ? Math.max(Number(url.searchParams.get("offset")) || 0, 0)
            : Math.max((page - 1) * limit, 0);

          const cacheKey = `props:${q}:${city}:${locality}:${listingType}:${propertyType}:${furnishing}:${minPrice}:${maxPrice}:${bedrooms}:${bathrooms}:${minArea}:${maxArea}:${sort}:${limit}:${offset}`;

          // Check memory cache first (sub-1ms)
          const cached = serverCache.get<{ rows: any[]; total: number; hasMore: boolean }>(
            cacheKey,
          );
          if (cached) {
            return jsonResponse(
              {
                ok: true,
                source: "cache",
                data: cached.rows,
                count: cached.rows.length,
                total: cached.total,
                hasMore: cached.hasMore,
                latencyMs: 0.5,
              },
              200,
            );
          }

          // Compute bounding box delta if lat/lng/radius provided (1 deg lat ~ 111km)
          const latDelta = radiusKm > 0 ? radiusKm / 111 : 0;
          const lngDelta =
            radiusKm > 0 && lat !== 0 ? radiusKm / (111 * Math.cos((lat * Math.PI) / 180)) : 0;

          // Execute query directly against PostgreSQL pool with prepared statements
          const { data: rows, durationMs } = await timedQuery(
            "fetchPropertiesEnhanced",
            async () => {
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
                COALESCE(area_sqft, 0) AS area_sqft,
                COALESCE(area_sqft, 0) AS built_up_sqft,
                COALESCE(furnishing_status, 'unfurnished') AS furnishing,
                COALESCE(furnishing_status, 'unfurnished') AS furnishing_status,
                COALESCE(approx_latitude, latitude) AS latitude,
                COALESCE(approx_longitude, longitude) AS longitude,
                status,
                is_approved,
                is_featured,
                images,
                created_at,
                updated_at
              FROM properties
              WHERE is_approved = true
                ${city ? sql`AND city ILIKE ${"%" + city + "%"}` : sql``}
                ${locality ? sql`AND locality ILIKE ${"%" + locality + "%"}` : sql``}
                ${listingType ? sql`AND listing_type ILIKE ${"%" + listingType + "%"}` : sql``}
                ${propertyType ? sql`AND property_type ILIKE ${"%" + propertyType + "%"}` : sql``}
                ${furnishing ? sql`AND furnishing_status ILIKE ${"%" + furnishing + "%"}` : sql``}
                ${bedrooms > 0 ? sql`AND bedrooms >= ${bedrooms}` : sql``}
                ${bathrooms > 0 ? sql`AND bathrooms >= ${bathrooms}` : sql``}
                ${minPrice > 0 ? sql`AND price >= ${minPrice}` : sql``}
                ${maxPrice > 0 ? sql`AND price <= ${maxPrice}` : sql``}
                ${minArea > 0 ? sql`AND area_sqft >= ${minArea}` : sql``}
                ${maxArea > 0 ? sql`AND area_sqft <= ${maxArea}` : sql``}
                ${
                  q
                    ? sql`AND (
                    title ILIKE ${"%" + q + "%"} 
                    OR description ILIKE ${"%" + q + "%"} 
                    OR locality ILIKE ${"%" + q + "%"}
                    OR city ILIKE ${"%" + q + "%"}
                  )`
                    : sql``
                }
                ${
                  latDelta > 0 && lngDelta > 0
                    ? sql`
                  AND COALESCE(approx_latitude, latitude) BETWEEN ${lat - latDelta} AND ${lat + latDelta}
                  AND COALESCE(approx_longitude, longitude) BETWEEN ${lng - lngDelta} AND ${lng + lngDelta}
                `
                    : sql``
                }
              ORDER BY
                ${
                  sort === "price_asc" || sort === "price-asc"
                    ? sql`price ASC`
                    : sort === "price_desc" || sort === "price-desc"
                      ? sql`price DESC`
                      : sort === "area_desc" || sort === "area-desc"
                        ? sql`area_sqft DESC`
                        : sort === "area_asc" || sort === "area-asc"
                          ? sql`area_sqft ASC`
                          : sql`created_at DESC`
                }
              LIMIT ${limit + 1}
              OFFSET ${offset}
            `;
            },
          );

          const hasMore = rows.length > limit;
          const resultRows = hasMore ? rows.slice(0, limit) : rows;

          const payload = {
            rows: resultRows,
            total: resultRows.length,
            hasMore,
          };

          // Cache public results for 60 seconds
          serverCache.set(cacheKey, payload, 60);

          return jsonResponse(
            {
              ok: true,
              source: "database",
              data: resultRows,
              count: resultRows.length,
              hasMore,
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
