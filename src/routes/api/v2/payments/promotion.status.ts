import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";

/**
 * Returns the current status of one of the caller's own promotion orders, for
 * the "payment is being verified" reconciliation poll. Authentication is
 * required and the row is scoped to the caller — an admin may read any, a normal
 * user only their own. No secrets or gateway signatures are ever returned.
 */
export const Route = createFileRoute("/api/v2/payments/promotion/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { extractBearerToken, verifyToken } = await import("@/server/auth");
          const token = extractBearerToken(request.headers.get("Authorization"));
          const user = token ? await verifyToken(token) : null;
          if (!user) return jsonResponse({ ok: false, error: "Unauthorized" }, 401);

          const url = new URL(request.url);
          const orderId = url.searchParams.get("orderId") ?? "";
          if (!orderId) return jsonResponse({ ok: false, error: "orderId is required" }, 400);

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const db = supabaseAdmin as unknown as { from: (t: string) => any };
          const { data } = await db
            .from("promotion_orders")
            .select(
              "id, user_id, property_id, plan_id, amount_paise, currency, status, promotion_ends_at, created_at",
            )
            .eq("id", orderId)
            .maybeSingle();

          if (!data) return jsonResponse({ ok: false, error: "Not found" }, 404);
          // IDOR guard: only the owner or an admin may read the order.
          if (data.user_id !== user.id && user.role !== "admin") {
            return jsonResponse({ ok: false, error: "Forbidden" }, 403);
          }

          return jsonResponse(
            {
              ok: true,
              order: {
                id: data.id,
                propertyId: data.property_id,
                planId: data.plan_id,
                amountPaise: data.amount_paise,
                currency: data.currency,
                status: data.status,
                promotionEndsAt: data.promotion_ends_at,
                createdAt: data.created_at,
              },
            },
            200,
          );
        } catch {
          return jsonResponse({ ok: false, error: "Status lookup failed." }, 500);
        }
      },
    },
  },
});
