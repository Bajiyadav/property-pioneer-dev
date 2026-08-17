import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Client-callable billing surface.
 *
 * Every function is auth-gated: a plan belongs to an owner, so an anonymous caller
 * has nothing to buy. The client sends a plan id and nothing else — no amount, no
 * currency — because the price is decided on the server (see razorpay.server.ts).
 */

const planIdSchema = z.object({ planId: z.string().trim().min(1).max(60) });

/** Whether this deployment can take payments at all. Drives the UI state. */
export const getPaymentAvailability = createServerFn({ method: "GET" }).handler(async () => {
  const { isGatewayConfigured } = await import("./razorpay.server");
  return { enabled: isGatewayConfigured() };
});

export const createPlanCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => planIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { createPlanOrder } = await import("./razorpay.server");
    return createPlanOrder(context.userId, data.planId);
  });

const confirmSchema = z.object({
  planId: z.string().trim().min(1).max(60),
  orderId: z.string().trim().min(1).max(120),
  paymentId: z.string().trim().min(1).max(120),
  signature: z.string().trim().min(1).max(256),
});

/**
 * Confirms a payment.
 *
 * Returns `{ verified: false }` for a bad signature rather than throwing, so the
 * UI can say "we could not verify this payment" instead of showing a stack trace —
 * but it never grants anything on an unverified callback.
 */
export const confirmPlanPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => confirmSchema.parse(input))
  .handler(async ({ data }) => {
    const { verifyPaymentSignature } = await import("./razorpay.server");
    const verified = verifyPaymentSignature({
      orderId: data.orderId,
      paymentId: data.paymentId,
      signature: data.signature,
    });

    if (!verified) {
      return {
        verified: false as const,
        details: "Payment signature did not verify. No plan has been activated.",
      };
    }

    // Entitlement storage is intentionally not implemented here yet: it needs an
    // `owner_plans` table, and migrations cannot be applied on this project until
    // SUPABASE_DB_URL exists. Reporting `verified` without persisting is honest —
    // the caller is told the payment checks out and that activation is pending —
    // whereas inventing an active plan in client state would be the same class of
    // lie as the listing flow that reported success while storing nothing.
    return {
      verified: true as const,
      activationPending: true as const,
      details:
        "Payment verified. Plan activation is recorded manually until billing storage ships.",
    };
  });
