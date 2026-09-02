import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";
import { sql, timedQuery } from "@/server/db";
import { verifyToken, extractBearerToken } from "@/server/auth";

export const Route = createFileRoute("/api/v2/enquiries")({
  server: {
    handlers: {
      // GET: Get enquiries for the authenticated user (Seeker sent, or Owner received)
      GET: async ({ request }) => {
        try {
          const authHeader = request.headers.get("Authorization");
          const token = extractBearerToken(authHeader);

          if (!token) {
            return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
          }

          const user = await verifyToken(token);
          if (!user) {
            return jsonResponse({ ok: false, error: "Invalid or expired token" }, 401);
          }

          const { data: rows, durationMs } = await timedQuery("fetchEnquiries", async () => {
            if (user.role === "admin") {
              return sql`
                SELECT e.*, p.title as property_title, p.city as property_city
                FROM enquiries e
                JOIN properties p ON e.property_id = p.id
                ORDER BY e.created_at DESC
                LIMIT 100
              `;
            }

            if (user.role === "owner") {
              // Return enquiries submitted for properties owned by this user
              return sql`
                SELECT e.*, p.title as property_title, p.city as property_city
                FROM enquiries e
                JOIN properties p ON e.property_id = p.id
                WHERE p.owner_id = ${user.id}
                ORDER BY e.created_at DESC
              `;
            }

            // Standard seeker: return enquiries sent by this user
            return sql`
              SELECT e.*, p.title as property_title, p.city as property_city
              FROM enquiries e
              JOIN properties p ON e.property_id = p.id
              WHERE e.user_id = ${user.id}
              ORDER BY e.created_at DESC
            `;
          });

          return jsonResponse(
            { ok: true, data: rows, count: rows.length, latencyMs: durationMs },
            200,
          );
        } catch (error: any) {
          return jsonResponse({ ok: false, error: error?.message }, 500);
        }
      },

      // POST: Submit a new enquiry on a property
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { propertyId, name, phone, message } = body;

          if (!propertyId || !name || !phone) {
            return jsonResponse(
              { ok: false, error: "propertyId, name, and phone are required" },
              400,
            );
          }

          const authHeader = request.headers.get("Authorization");
          const token = extractBearerToken(authHeader);
          const user = token ? await verifyToken(token) : null;

          // Verify property exists and is approved
          const properties = await sql`
            SELECT id, title, owner_id FROM properties WHERE id = ${propertyId} AND is_approved = true LIMIT 1
          `;

          if (properties.length === 0) {
            return jsonResponse({ ok: false, error: "Property not found or unavailable" }, 404);
          }

          const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";
          const userAgent = request.headers.get("user-agent") || "unknown";

          const newEnquiry = await sql`
            INSERT INTO enquiries (property_id, user_id, name, phone, message, ip_address, user_agent, created_at)
            VALUES (
              ${propertyId},
              ${user ? user.id : null},
              ${name.trim()},
              ${phone.trim()},
              ${message?.trim() || ""},
              ${ipAddress},
              ${userAgent},
              NOW()
            )
            RETURNING id, property_id, name, phone, message, created_at
          `;

          return jsonResponse(
            {
              ok: true,
              message: "Enquiry submitted successfully",
              data: newEnquiry[0],
            },
            201,
          );
        } catch (error: any) {
          return jsonResponse({ ok: false, error: error?.message }, 500);
        }
      },
    },
  },
});
