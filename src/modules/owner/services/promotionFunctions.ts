import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Client-callable surface for owner promotion.
 *
 * The client sends a property id and a plan id. It does NOT send an amount, a
 * currency, a status, or a user id — every one of those is decided server-side
 * in promotion.server.ts. Anonymous callers are rejected by the middleware:
 * promotion is bought by an owner for their own listing, so there is nothing
 * here for a signed-out visitor.
 */

const checkoutSchema = z.object({
  propertyId: z.string().uuid(),
  planId: z.string().trim().min(1).max(60),
});

/** Whether this deployment can take payments at all. Drives the UI state. */
export const getPromotionAvailability = createServerFn({ method: "GET" }).handler(async () => {
  const { isPromotionGatewayConfigured } = await import("./promotion.server");
  return { enabled: await isPromotionGatewayConfigured() };
});

/**
 * Records a promotion intent for a property the caller owns.
 *
 * Never returns a paid order. The best case today is a persisted `pending`
 * order plus `gateway_unconfigured`, which the UI renders as "payment opening
 * shortly" — an honest state, not a failure and not a fake success.
 */
export const createPromotionCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { createPromotionOrder } = await import("./promotion.server");
    const authCtx = context as { userId: string; supabase: unknown };
    return createPromotionOrder({
      // Ownership is checked with the caller's own RLS-scoped client.
      supabase: authCtx.supabase as never,
      userId: authCtx.userId,
      propertyId: data.propertyId,
      planId: data.planId,
    });
  });

/**
 * Confirmation endpoint. Exists so the route is stable when a provider is
 * connected; refuses today because there is nothing to verify against.
 */
export const confirmPromotionPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { verifyPromotionPayment } = await import("./promotion.server");
    return verifyPromotionPayment();
  });
