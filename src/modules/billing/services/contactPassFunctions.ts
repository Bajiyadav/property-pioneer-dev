import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Client-callable checkout for the contact pass. The client sends ONLY a plan
 * id; the amount and the payer are decided server-side. Auth-gated: an anonymous
 * visitor has no pass to buy.
 */
const schema = z.object({ planId: z.string().trim().min(1).max(60) });

export const createContactPassCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { createCheckoutSession } = await import("./stripe.server");
    const { APP_URL } = await import("@/config/app");
    const ctx = context as { userId: string };
    return createCheckoutSession({
      userId: ctx.userId,
      planId: data.planId,
      successUrl: `${APP_URL}/dashboard/customer?checkout=complete`,
      cancelUrl: `${APP_URL}/dashboard/customer?checkout=cancelled`,
    });
  });

export const getStripeAvailability = createServerFn({ method: "GET" }).handler(async () => {
  const { isStripeConfigured } = await import("./stripe.server");
  return { enabled: isStripeConfigured() };
});
