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

export const checkCustomerAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    /*
     * Reads `customer_entitlements`, added by migration 20260818090000.
     *
     * The table is not typed in `types.ts` yet and is not present on the live
     * database until that migration is applied, so this goes through an untyped
     * client surface and treats a missing table as "no access" rather than
     * throwing. Two reasons that matters:
     *
     *  - An exception here would break the page for every signed-in customer,
     *    not just gate a feature.
     *  - Failing OPEN would be worse than failing closed. If the lookup cannot
     *    be performed, the honest answer is that we cannot confirm the customer
     *    paid, so access is denied. A bug must never hand out a paid plan.
     *
     * `reason` is returned so the caller can distinguish "you have not
     * subscribed" from "we could not check", and so a missing migration is
     * visible in logs instead of looking like an empty customer base.
     */
    type EntitlementRow = { active_until: string | null };

    const db = supabaseAdmin as unknown as {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (
            column: string,
            value: string,
          ) => {
            maybeSingle: () => Promise<{
              data: EntitlementRow | null;
              error: { code?: string; message?: string } | null;
            }>;
          };
        };
      };
    };

    const { data: entitlement, error } = await db
      .from("customer_entitlements")
      .select("active_until")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) {
      // 42P01 undefined_table / PGRST205 unknown relation — migration pending.
      const missingTable = error.code === "42P01" || error.code === "PGRST205";
      if (missingTable) {
        console.error(
          "[billing] customer_entitlements is missing — apply migration 20260818090000",
        );
        return { hasAccess: false, reason: "entitlement_storage_missing" as const };
      }
      console.error("[billing] entitlement lookup failed", error);
      return { hasAccess: false, reason: "lookup_failed" as const };
    }

    if (!entitlement) return { hasAccess: false, reason: "no_entitlement" as const };

    // A null `active_until` means lifetime access.
    if (entitlement.active_until === null) {
      return { hasAccess: true, reason: "lifetime" as const };
    }

    const isActive = new Date(entitlement.active_until) > new Date();
    return {
      hasAccess: isActive,
      reason: isActive ? ("active" as const) : ("expired" as const),
    };
  });
