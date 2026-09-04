import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";

/**
 * Payment History Endpoint — Authoritative list of promotion orders.
 *
 * Scoped strictly to the authenticated caller (or all orders for an admin).
 * Never exposes gateway secrets, internal webhook IDs, or raw signatures.
 */
export const Route = createFileRoute("/api/v2/payments/history")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { extractBearerToken, verifyToken } = await import("@/server/auth");
          const token = extractBearerToken(request.headers.get("Authorization"));
          const user = token ? await verifyToken(token) : null;
          if (!user) return jsonResponse({ ok: false, error: "Unauthorized" }, 401);

          let orders: Array<{
            id: string;
            propertyId: string;
            planId: string;
            amountPaise: number;
            currency: string;
            status: string;
            gateway: string | null;
            gatewayOrderId: string | null;
            promotionStartsAt: string | null;
            promotionEndsAt: string | null;
            createdAt: string;
          }> = [];

          // Try direct PostgreSQL first for high performance & resilience
          try {
            const { sql } = await import("@/server/db");
            const rows =
              user.role === "admin"
                ? await sql`
                    SELECT id, property_id, plan_id, amount_paise, currency, status,
                           gateway, gateway_order_id, promotion_starts_at, promotion_ends_at, created_at
                    FROM promotion_orders
                    ORDER BY created_at DESC
                    LIMIT 100
                  `
                : await sql`
                    SELECT id, property_id, plan_id, amount_paise, currency, status,
                           gateway, gateway_order_id, promotion_starts_at, promotion_ends_at, created_at
                    FROM promotion_orders
                    WHERE user_id = ${user.id}::uuid
                    ORDER BY created_at DESC
                    LIMIT 100
                  `;

            orders = rows.map((r: any) => ({
              id: r.id,
              propertyId: r.property_id,
              planId: r.plan_id,
              amountPaise: r.amount_paise,
              currency: r.currency,
              status: r.status,
              gateway: r.gateway,
              gatewayOrderId: r.gateway_order_id,
              promotionStartsAt: r.promotion_starts_at,
              promotionEndsAt: r.promotion_ends_at,
              createdAt: r.created_at,
            }));
          } catch {
            // Fallback to Supabase admin client
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const db = supabaseAdmin as unknown as { from: (t: string) => any };
            let query = db
              .from("promotion_orders")
              .select(
                "id, property_id, plan_id, amount_paise, currency, status, gateway, gateway_order_id, promotion_starts_at, promotion_ends_at, created_at",
              )
              .order("created_at", { ascending: false })
              .limit(100);

            if (user.role !== "admin") {
              query = query.eq("user_id", user.id);
            }

            const { data } = await query;
            if (data) {
              orders = data.map((r: any) => ({
                id: r.id,
                propertyId: r.property_id,
                planId: r.plan_id,
                amountPaise: r.amount_paise,
                currency: r.currency,
                status: r.status,
                gateway: r.gateway,
                gatewayOrderId: r.gateway_order_id,
                promotionStartsAt: r.promotion_starts_at,
                promotionEndsAt: r.promotion_ends_at,
                createdAt: r.created_at,
              }));
            }
          }

          return jsonResponse({ ok: true, orders }, 200);
        } catch {
          return jsonResponse({ ok: false, error: "Failed to fetch payment history." }, 500);
        }
      },
    },
  },
});
