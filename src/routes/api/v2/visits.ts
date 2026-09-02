import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";
import { sql, timedQuery } from "@/server/db";
import { verifyToken, extractBearerToken } from "@/server/auth";

export const Route = createFileRoute("/api/v2/visits")({
  server: {
    handlers: {
      // GET: Get scheduled visits for authenticated user
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

          const { data: rows, durationMs } = await timedQuery("fetchVisits", async () => {
            if (user.role === "admin") {
              return sql`
                SELECT v.*, p.title as property_title, p.city as property_city, p.locality as property_locality
                FROM property_visits v
                JOIN properties p ON v.property_id = p.id
                ORDER BY v.visit_date DESC, v.created_at DESC
                LIMIT 100
              `;
            }

            if (user.role === "owner") {
              // Visits on properties owned by this user
              return sql`
                SELECT v.*, p.title as property_title, p.city as property_city, p.locality as property_locality
                FROM property_visits v
                JOIN properties p ON v.property_id = p.id
                WHERE p.owner_id = ${user.id}
                ORDER BY v.visit_date DESC, v.created_at DESC
              `;
            }

            // Customer/Seeker visits
            return sql`
              SELECT v.*, p.title as property_title, p.city as property_city, p.locality as property_locality
              FROM property_visits v
              JOIN properties p ON v.property_id = p.id
              WHERE v.user_id = ${user.id}
              ORDER BY v.visit_date DESC, v.created_at DESC
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

      // POST: Schedule a new site visit
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const {
            propertyId,
            visitorName,
            visitorPhone,
            visitorEmail,
            visitDate,
            visitTime,
            visitType = "in_person",
            notes,
          } = body;

          if (!propertyId || !visitorName || !visitorPhone || !visitDate || !visitTime) {
            return jsonResponse(
              {
                ok: false,
                error:
                  "propertyId, visitorName, visitorPhone, visitDate, and visitTime are required",
              },
              400,
            );
          }

          const authHeader = request.headers.get("Authorization");
          const token = extractBearerToken(authHeader);
          const user = token ? await verifyToken(token) : null;

          // Verify property is active
          const props = await sql`
            SELECT id, title, owner_id FROM properties WHERE id = ${propertyId} AND is_approved = true LIMIT 1
          `;

          if (props.length === 0) {
            return jsonResponse({ ok: false, error: "Property not found or unavailable" }, 404);
          }

          const newVisit = await sql`
            INSERT INTO property_visits (
              property_id,
              user_id,
              visitor_name,
              visitor_phone,
              visitor_email,
              visit_type,
              visit_date,
              visit_time,
              status,
              notes,
              created_at,
              updated_at
            )
            VALUES (
              ${propertyId},
              ${user ? user.id : null},
              ${visitorName.trim()},
              ${visitorPhone.trim()},
              ${visitorEmail?.trim() || null},
              ${visitType},
              ${visitDate},
              ${visitTime},
              'scheduled',
              ${notes?.trim() || null},
              NOW(),
              NOW()
            )
            RETURNING *
          `;

          return jsonResponse(
            {
              ok: true,
              message: "Site visit scheduled successfully",
              data: newVisit[0],
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
