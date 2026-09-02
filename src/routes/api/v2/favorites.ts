import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";
import { verifyToken, extractBearerToken } from "@/server/auth";
import { sql } from "@/server/db";

export const Route = createFileRoute("/api/v2/favorites")({
  server: {
    handlers: {
      // GET: Get all favorite property IDs for authenticated user
      GET: async ({ request }) => {
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

          const rows = await sql`
            SELECT f.id, f.property_id, f.created_at, p.title, p.price, p.city, p.locality, p.images
            FROM favorites f
            JOIN properties p ON f.property_id = p.id
            WHERE f.user_id = ${user.id}
            ORDER BY f.created_at DESC
          `;

          return jsonResponse({ ok: true, data: rows, count: rows.length }, 200);
        } catch (error: any) {
          return jsonResponse({ ok: false, error: error?.message }, 500);
        }
      },

      // POST: Toggle favorite status for a property
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
          const { propertyId } = body;

          if (!propertyId) {
            return jsonResponse({ ok: false, error: "propertyId is required" }, 400);
          }

          // Check if already favorited
          const existing = await sql`
            SELECT id FROM favorites WHERE user_id = ${user.id} AND property_id = ${propertyId} LIMIT 1
          `;

          if (existing.length > 0) {
            // Remove
            await sql`
              DELETE FROM favorites WHERE id = ${existing[0].id}
            `;
            return jsonResponse(
              { ok: true, favorited: false, message: "Removed from favorites" },
              200,
            );
          } else {
            // Add
            await sql`
              INSERT INTO favorites (user_id, property_id, created_at)
              VALUES (${user.id}, ${propertyId}, NOW())
            `;
            return jsonResponse({ ok: true, favorited: true, message: "Added to favorites" }, 201);
          }
        } catch (error: any) {
          return jsonResponse({ ok: false, error: error?.message }, 500);
        }
      },
    },
  },
});
