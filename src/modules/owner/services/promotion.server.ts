import {
  findVisibilityPlan,
  visibilityPlanTotalPaise,
  type VisibilityPlan,
} from "@/config/visibilityPlans";

/**
 * Owner promotion orders. SERVER ONLY — never import from a component.
 *
 * The three things a payment integration must never take from the browser are
 * the amount, the payer, and the outcome. All three are decided here:
 *
 *   amount   — computed from plan_id via visibilityPlanTotalPaise. The client
 *              sends an id and nothing else. If it sent an amount, anyone could
 *              pay ₹1 for the ₹499 plan by editing a request.
 *   payer    — taken from the authenticated session, never from the payload.
 *   outcome  — only ever concluded from a gateway-verified signature. There is
 *              no code path here that can mark an order paid without one.
 *
 * NO GATEWAY IS CONNECTED. `verifyPromotionPayment` and `handlePromotionWebhook`
 * exist as the integration boundary and deliberately refuse rather than
 * simulate. A stub that returned `paid` would be indistinguishable from a
 * working integration until the first real customer, which is precisely when it
 * would be discovered.
 */

export type PromotionStatus =
  "pending" | "created" | "processing" | "paid" | "failed" | "cancelled" | "refunded";

/**
 * Legal status moves. Encoded as data so the rule is testable and so a future
 * webhook cannot walk an order backwards from `refunded` to `paid`.
 */
const ALLOWED_TRANSITIONS: Record<PromotionStatus, readonly PromotionStatus[]> = {
  pending: ["created", "cancelled", "failed"],
  created: ["processing", "cancelled", "failed"],
  processing: ["paid", "failed"],
  paid: ["refunded"],
  failed: [],
  cancelled: [],
  refunded: [],
} as const;

export function canTransition(from: PromotionStatus, to: PromotionStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface PromotionOrderResult {
  /** "ok" only when an order was actually persisted AND a gateway exists. */
  status: "ok" | "gateway_unconfigured" | "storage_unavailable" | "forbidden" | "invalid_plan";
  orderId?: string;
  planId?: string;
  amountPaise?: number;
  currency?: "INR";
  details?: string;
}

interface PromotionOrderInsert {
  user_id: string;
  property_id: string;
  plan_id: string;
  amount_paise: number;
  currency: string;
  status: PromotionStatus;
}

interface OpenOrderRow {
  id: string;
  plan_id: string;
  amount_paise: number;
  status: PromotionStatus;
}

/** Statuses that mean "this order is still in play". */
export const OPEN_STATUSES: readonly PromotionStatus[] = ["pending", "created", "processing"];

interface PromotionOrderStore {
  from: (table: "promotion_orders") => {
    insert: (row: PromotionOrderInsert) => {
      select: (cols: string) => {
        maybeSingle: () => Promise<{ data: { id: string } | null; error: unknown }>;
      };
    };
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        in: (
          col: string,
          vals: readonly string[],
        ) => { maybeSingle: () => Promise<{ data: OpenOrderRow | null; error: unknown }> };
      };
    };
    update: (patch: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: unknown }>;
    };
  };
}

interface SupabaseLike {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => { maybeSingle: () => Promise<{ data: unknown; error: unknown }> };
    };
  };
}

/**
 * Confirms the caller owns the property they are trying to promote.
 *
 * This is the IDOR guard: without it, any authenticated user could pass another
 * owner's property_id and buy promotion against a listing that is not theirs.
 * A listing whose owner_id is NULL is treated as NOT owned by anyone — it
 * cannot be promoted, because ownership cannot be demonstrated.
 */
export async function assertOwnsProperty(
  supabase: SupabaseLike,
  userId: string,
  propertyId: string,
): Promise<{ ok: true; title: string | null } | { ok: false; reason: string }> {
  const { data, error } = await supabase
    .from("properties")
    .select("id, owner_id, title")
    .eq("id", propertyId)
    .maybeSingle();

  if (error) return { ok: false, reason: "Could not verify property ownership." };
  if (!data) return { ok: false, reason: "Property not found." };

  const row = data as { owner_id: string | null; title: string | null };
  if (!row.owner_id) {
    return { ok: false, reason: "This listing has no recorded owner and cannot be promoted." };
  }
  if (row.owner_id !== userId) {
    return { ok: false, reason: "You can only promote a property you own." };
  }
  return { ok: true, title: row.title };
}

/** True when this deployment could actually take a payment. */
export async function isPromotionGatewayConfigured(): Promise<boolean> {
  const { isGatewayConfigured } = await import("@/modules/billing/services/razorpay.server");
  return isGatewayConfigured();
}

export function resolvePlan(planId: string): VisibilityPlan | undefined {
  return findVisibilityPlan(planId);
}

/**
 * Records an intent to promote, after ownership and plan are verified.
 *
 * The order is written with status `pending` — never `paid`. It is written with
 * the service role because `promotion_orders` revokes client writes entirely;
 * an owner who could INSERT here could set their own amount and status.
 */
export async function createPromotionOrder(args: {
  supabase: SupabaseLike;
  userId: string;
  propertyId: string;
  planId: string;
}): Promise<PromotionOrderResult> {
  const plan = resolvePlan(args.planId);
  if (!plan) {
    return { status: "invalid_plan", details: `Unknown promotion plan: ${args.planId}` };
  }

  const owns = await assertOwnsProperty(args.supabase, args.userId, args.propertyId);
  if (!owns.ok) return { status: "forbidden", details: owns.reason };

  const amountPaise = visibilityPlanTotalPaise(plan);

  let admin;
  try {
    ({ supabaseAdmin: admin } = await import("@/integrations/supabase/client.server"));
  } catch {
    return {
      status: "storage_unavailable",
      details: "Order storage is not configured on this server.",
      planId: plan.id,
      amountPaise,
    };
  }

  // `promotion_orders` ships in migration 20260823120000, which is NOT applied
  // yet, so it is absent from the generated Database types. This narrow cast is
  // scoped to exactly this insert rather than loosening the client everywhere;
  // it disappears the moment the migration lands and types are regenerated.
  const orders = (admin as unknown as PromotionOrderStore).from("promotion_orders");

  // IDEMPOTENCY. Tapping "Continue to Payment" twice must not create two open
  // orders for one listing, and gateway_order_id cannot enforce that — it is
  // NULL until a provider issues one, and NULLs do not collide in a unique
  // index. So an existing open order is reused: same plan returns the same
  // order, a switched plan re-prices that order in place.
  const { data: openOrder } = await orders
    .select("id, plan_id, amount_paise, status")
    .eq("property_id", args.propertyId)
    .in("status", OPEN_STATUSES)
    .maybeSingle();

  if (openOrder) {
    if (openOrder.plan_id !== plan.id) {
      // Amount is recomputed from the plan here too — never carried from input.
      await orders
        .update({
          plan_id: plan.id,
          amount_paise: amountPaise,
          updated_at: new Date().toISOString(),
        })
        .eq("id", openOrder.id);
    }
    const ready = await isPromotionGatewayConfigured();
    return {
      status: ready ? "ok" : "gateway_unconfigured",
      orderId: openOrder.id,
      planId: plan.id,
      amountPaise,
      currency: "INR",
      details: ready
        ? undefined
        : "Your promotion request is saved. Online payment is not open yet.",
    };
  }

  const { data, error } = await orders
    .insert({
      user_id: args.userId,
      property_id: args.propertyId,
      plan_id: plan.id,
      amount_paise: amountPaise,
      currency: "INR",
      status: "pending" satisfies PromotionStatus,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    // The table ships in 20260823120000 and may not be applied yet. Say so
    // plainly rather than pretending an order exists.
    return {
      status: "storage_unavailable",
      details: "Promotion orders cannot be recorded yet on this environment.",
      planId: plan.id,
      amountPaise,
    };
  }

  const gatewayReady = await isPromotionGatewayConfigured();
  return {
    status: gatewayReady ? "ok" : "gateway_unconfigured",
    orderId: (data as { id: string } | null)?.id,
    planId: plan.id,
    amountPaise,
    currency: "INR",
    details: gatewayReady
      ? undefined
      : "Your promotion request is saved. Online payment is not open yet.",
  };
}

/**
 * INTEGRATION BOUNDARY — not implemented.
 *
 * When a provider is connected this verifies the gateway signature server-side
 * and only then moves the order to `paid`. It refuses today rather than
 * returning a placeholder success.
 */
export async function verifyPromotionPayment(): Promise<{ verified: false; details: string }> {
  return {
    verified: false,
    details: "No payment provider is connected. Nothing can be verified or activated.",
  };
}

/**
 * INTEGRATION BOUNDARY — not implemented.
 *
 * The future webhook lands here. Activation (setting is_featured and the
 * promotion window) must happen on this path, driven by a verified gateway
 * event — never from a browser callback.
 */
export async function handlePromotionWebhook(): Promise<{ handled: false; details: string }> {
  return {
    handled: false,
    details: "No payment provider is connected. No webhook can be processed.",
  };
}
