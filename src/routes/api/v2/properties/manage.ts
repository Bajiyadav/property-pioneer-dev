import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";
import { verifyToken, extractBearerToken } from "@/server/auth";
import { sql } from "@/server/db";
import { serverCache } from "@/server/cache";

export const Route = createFileRoute("/api/v2/properties/manage")({
  server: {
    handlers: {
      // POST: Create a new property listing
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          const token = extractBearerToken(authHeader);

          if (!token) {
            return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
          }

          const user = await verifyToken(token);
          if (!user) {
            return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
          }

          const body = await request.json();
          const {
            title,
            description,
            price,
            city,
            address,
            bedrooms = 1,
            bathrooms = 1,
            areaSqft = 0,
            propertyType = "apartment",
            listingType = "rent",
            images = [],
            locality,
            pincode,
            latitude,
            longitude,
          } = body;

          if (!title || !price || !city) {
            return jsonResponse({ ok: false, error: "title, price, and city are required" }, 400);
          }

          const newProp = await sql`
            INSERT INTO properties (
              title,
              description,
              price,
              city,
              address,
              bedrooms,
              bathrooms,
              area_sqft,
              property_type,
              listing_type,
              status,
              images,
              owner_id,
              owner_name,
              owner_email,
              locality,
              pincode,
              latitude,
              longitude,
              is_approved,
              created_at,
              updated_at
            )
            VALUES (
              ${title.trim()},
              ${description?.trim() || ""},
              ${price},
              ${city.trim()},
              ${address?.trim() || ""},
              ${bedrooms},
              ${bathrooms},
              ${areaSqft},
              ${propertyType},
              ${listingType},
              'available',
              ${images},
              ${user.id},
              ${user.fullName},
              ${user.email},
              ${locality?.trim() || null},
              ${pincode?.trim() || null},
              ${latitude || null},
              ${longitude || null},
              true,
              NOW(),
              NOW()
            )
            RETURNING *
          `;

          // Invalidate cache for properties feed
          serverCache.invalidatePrefix("props:");

          return jsonResponse({ ok: true, data: newProp[0] }, 201);
        } catch (error: any) {
          return jsonResponse({ ok: false, error: error?.message }, 500);
        }
      },

      // PATCH: Update an existing property listing (Owner or Admin authorization only)
      PATCH: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          const token = extractBearerToken(authHeader);

          if (!token) {
            return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
          }

          const user = await verifyToken(token);
          if (!user) {
            return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
          }

          const body = await request.json();
          const { id, title, description, price, city, images, status } = body;

          if (!id) {
            return jsonResponse({ ok: false, error: "id is required" }, 400);
          }

          // Verify ownership or admin role
          const existing = await sql`
            SELECT id, owner_id FROM properties WHERE id = ${id} LIMIT 1
          `;

          if (existing.length === 0) {
            return jsonResponse({ ok: false, error: "Property not found" }, 404);
          }

          if (existing[0].owner_id !== user.id && user.role !== "admin") {
            return jsonResponse(
              { ok: false, error: "Forbidden: You do not own this listing" },
              403,
            );
          }

          const updated = await sql`
            UPDATE properties
            SET
              title = COALESCE(${title || null}, title),
              description = COALESCE(${description || null}, description),
              price = COALESCE(${price || null}, price),
              city = COALESCE(${city || null}, city),
              images = COALESCE(${images || null}, images),
              status = COALESCE(${status || null}, status),
              updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
          `;

          serverCache.invalidatePrefix("props:");

          return jsonResponse({ ok: true, data: updated[0] }, 200);
        } catch (error: any) {
          return jsonResponse({ ok: false, error: error?.message }, 500);
        }
      },
    },
  },
});
