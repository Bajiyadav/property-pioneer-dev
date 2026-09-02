import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";
import { sql, timedQuery } from "@/server/db";
import { verifyToken, extractBearerToken } from "@/server/auth";

export const Route = createFileRoute("/api/v2/rental-agreements")({
  server: {
    handlers: {
      // GET: Get rental agreements for authenticated user (Strict ownership isolation)
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

          const { data: rows, durationMs } = await timedQuery("fetchAgreements", async () => {
            if (user.role === "admin") {
              return sql`
                SELECT * FROM rental_agreements ORDER BY created_at DESC LIMIT 100
              `;
            }

            // Strict Tenant or Owner Isolation
            return sql`
              SELECT * FROM rental_agreements
              WHERE user_id = ${user.id}
              ORDER BY created_at DESC
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

      // POST: Create a draft rental agreement
      POST: async ({ request }) => {
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

          const body = await request.json();
          const {
            propertyId,
            agreementType = "residential_lease",
            tenantType = "individual",
            ownerDetails,
            tenants,
            propertyDetails,
            rentalTerms,
            clauses = [],
            customTerms,
            paymentAmount = 0,
          } = body;

          if (!ownerDetails || !tenants || !rentalTerms) {
            return jsonResponse(
              { ok: false, error: "ownerDetails, tenants, and rentalTerms are required" },
              400,
            );
          }

          const agreementNumber = `SD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

          const newAgreement = await sql`
            INSERT INTO rental_agreements (
              user_id,
              property_id,
              agreement_number,
              agreement_type,
              tenant_type,
              status,
              owner_details,
              tenants,
              property_details,
              rental_terms,
              clauses,
              custom_terms,
              payment_status,
              payment_amount,
              created_at,
              updated_at
            )
            VALUES (
              ${user.id},
              ${propertyId || null},
              ${agreementNumber},
              ${agreementType},
              ${tenantType},
              'draft',
              ${sql.json(ownerDetails)},
              ${sql.json(tenants)},
              ${sql.json(propertyDetails || {})},
              ${sql.json(rentalTerms)},
              ${sql.json(clauses)},
              ${customTerms ? sql.json(customTerms) : null},
              'pending',
              ${paymentAmount},
              NOW(),
              NOW()
            )
            RETURNING *
          `;

          return jsonResponse(
            {
              ok: true,
              message: "Rental agreement draft created successfully",
              data: newAgreement[0],
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
