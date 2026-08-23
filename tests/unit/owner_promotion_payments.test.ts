import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  VISIBILITY_PLANS,
  DELIVERABLE_VISIBILITY_BENEFITS,
  findVisibilityPlan,
  visibilityPlanTotalPaise,
  formatVisibilityInr,
} from "@/config/visibilityPlans";
import {
  canTransition,
  assertOwnsProperty,
  type PromotionStatus,
} from "@/modules/owner/services/promotion.server";

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
/** Comments quote the very patterns these tests forbid, so strip them first. */
const stripComments = (s: string) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

const PLANS_SRC = read("src/config/visibilityPlans.ts");
const PROMOTE_SRC = read("src/modules/owner/components/PromoteListing.tsx");
const CHECKOUT_SRC = read("src/modules/owner/components/PromotionCheckout.tsx");
const SERVER_SRC = read("src/modules/owner/services/promotion.server.ts");
const FNS_SRC = read("src/modules/owner/services/promotionFunctions.ts");
const MIGRATION = read("supabase/migrations/20260823120000_property_promotion_orders.sql");

describe("visibility plans — the two offers", () => {
  it("1. offers a ₹299 plan", () => {
    const p = VISIBILITY_PLANS.find((x) => x.priceInr === 299);
    expect(p, "a ₹299 plan must exist").toBeDefined();
    expect(p!.name).toBe("More Visibility");
  });

  it("2. offers a ₹499 plan", () => {
    const p = VISIBILITY_PLANS.find((x) => x.priceInr === 499);
    expect(p, "a ₹499 plan must exist").toBeDefined();
    expect(p!.name).toBe("Maximum Visibility");
  });

  it("3. exposes exactly two plans so selection is unambiguous", () => {
    expect(VISIBILITY_PLANS).toHaveLength(2);
    expect(new Set(VISIBILITY_PLANS.map((p) => p.id)).size).toBe(2);
  });

  it("4. total equals the plan price — no invented tax", () => {
    for (const p of VISIBILITY_PLANS) {
      expect(visibilityPlanTotalPaise(p)).toBe(p.priceInr * 100);
    }
    expect(visibilityPlanTotalPaise({ priceInr: 299 })).toBe(29_900);
    expect(visibilityPlanTotalPaise({ priceInr: 499 })).toBe(49_900);
    // GST is applied to OWNER_PLANS/CUSTOMER_PLANS but deliberately not here.
    expect(stripComments(PLANS_SRC)).not.toMatch(/GST|gstPaise|BASIS_POINTS/);
  });

  it("formats rupees in Indian style", () => {
    expect(formatVisibilityInr(299)).toBe("₹299");
    expect(formatVisibilityInr(499)).toBe("₹499");
  });

  it("plans differ by duration, which is the only real difference", () => {
    const [a, b] = VISIBILITY_PLANS;
    expect(a.durationDays).not.toBe(b.durationDays);
  });

  it("at most one plan is recommended, and never with urgency", () => {
    expect(VISIBILITY_PLANS.filter((p) => p.recommended)).toHaveLength(1);
  });
});

describe("honesty guards — nothing unsupported may be sold", () => {
  const deliverable = new Set<string>(Object.values(DELIVERABLE_VISIBILITY_BENEFITS));

  it("every advertised benefit is on the deliverable list", () => {
    for (const plan of VISIBILITY_PLANS) {
      for (const b of plan.benefits) {
        expect(deliverable.has(b), `"${b}" is not a deliverable benefit`).toBe(true);
      }
    }
  });

  it("no plan promises guaranteed tenants, buyers or enquiries", () => {
    const forbidden = /guarantee|guaranteed|assured|100%\s*(sure|success)/i;
    for (const plan of VISIBILITY_PLANS) {
      expect(forbidden.test(plan.name + plan.tagline + plan.benefits.join(" "))).toBe(false);
    }
  });

  it("the offer UI uses no fake urgency or scarcity", () => {
    const urgency =
      /only\s+\d+\s+(slots?|left)|hurry|expires? in|last chance|limited time|lose your listing/i;
    expect(urgency.test(stripComments(PROMOTE_SRC))).toBe(false);
    expect(urgency.test(stripComments(CHECKOUT_SRC))).toBe(false);
  });

  it("5. the free listing path stays available on both screens", () => {
    expect(PROMOTE_SRC).toMatch(/Continue with Free Listing/);
    expect(CHECKOUT_SRC).toMatch(/Continue with Free Listing/);
  });

  it("promotion is never described as a brokerage or listing fee", () => {
    const combined = stripComments(PROMOTE_SRC) + stripComments(CHECKOUT_SRC);
    expect(combined).toMatch(
      /0% brokerage|no platform brokerage|free after moderation|publishes free/i,
    );
  });
});

describe("payment safety — the client decides nothing", () => {
  it("6. no component can mark a payment paid", () => {
    for (const src of [PROMOTE_SRC, CHECKOUT_SRC]) {
      const s = stripComments(src);
      expect(s).not.toMatch(/status\s*[:=]\s*["'`]paid["'`]/);
      expect(s).not.toMatch(/is_paid\s*[:=]\s*true/);
      expect(s).not.toMatch(/setPaid|markPaid|paymentSuccess\s*\(/);
    }
  });

  it("6b. the verification boundary refuses instead of simulating success", () => {
    const s = stripComments(SERVER_SRC);
    expect(s).toMatch(/verifyPromotionPayment/);
    expect(s).toMatch(/verified:\s*false/);
    expect(s).not.toMatch(/verified:\s*true/);
    expect(s).toMatch(/handlePromotionWebhook/);
    expect(s).not.toMatch(/handled:\s*true/);
  });

  it("8. every client-callable mutation is auth-gated", () => {
    const s = stripComments(FNS_SRC);
    expect(s).toMatch(/requireSupabaseAuth/);
    const checkoutFn = s.slice(s.indexOf("createPromotionCheckout"));
    expect(checkoutFn).toMatch(/middleware\(\[requireSupabaseAuth\]\)/);
  });

  it("11. the client cannot send an amount — only ids are accepted", () => {
    const s = stripComments(FNS_SRC);
    const schema = s.slice(s.indexOf("checkoutSchema"), s.indexOf("getPromotionAvailability"));
    expect(schema).toMatch(/propertyId/);
    expect(schema).toMatch(/planId/);
    expect(schema).not.toMatch(/amount|price|paise|currency|status/i);
    // The amount is derived server-side from the plan.
    expect(stripComments(SERVER_SRC)).toMatch(/visibilityPlanTotalPaise\(plan\)/);
  });

  it("10. an unknown plan id resolves to nothing", () => {
    expect(findVisibilityPlan("visibility-more-299")).toBeDefined();
    expect(findVisibilityPlan("free-money")).toBeUndefined();
    expect(findVisibilityPlan("")).toBeUndefined();
  });

  it("no payment secret appears in any client-reachable file", () => {
    for (const src of [PLANS_SRC, PROMOTE_SRC, CHECKOUT_SRC, FNS_SRC]) {
      expect(src).not.toMatch(/RAZORPAY_KEY_SECRET|key_secret|VITE_RAZORPAY/i);
    }
  });
});

describe("7 + 9. ownership authorization (IDOR guard)", () => {
  const fakeDb = (row: unknown, error: unknown = null) => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: row, error }) }),
      }),
    }),
  });

  it("accepts the true owner", async () => {
    const db = fakeDb({ owner_id: "user-1", title: "My flat" });
    const r = await assertOwnsProperty(db as never, "user-1", "prop-1");
    expect(r.ok).toBe(true);
  });

  it("7. rejects a different user buying promotion for someone else's property", async () => {
    const db = fakeDb({ owner_id: "owner-A", title: "Their flat" });
    const r = await assertOwnsProperty(db as never, "attacker-B", "prop-1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/only promote a property you own/i);
  });

  it("rejects a listing with no recorded owner", async () => {
    const db = fakeDb({ owner_id: null, title: "Orphan" });
    const r = await assertOwnsProperty(db as never, "user-1", "prop-1");
    expect(r.ok).toBe(false);
  });

  it("9. rejects an unknown property id", async () => {
    const r = await assertOwnsProperty(fakeDb(null) as never, "user-1", "missing");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/not found/i);
  });

  it("9b. the route validator requires a uuid property id", () => {
    const s = stripComments(FNS_SRC);
    expect(s).toMatch(/propertyId:\s*z\.string\(\)\.uuid\(\)/);
  });
});

describe("12. payment status transitions", () => {
  it("permits the forward path", () => {
    expect(canTransition("pending", "created")).toBe(true);
    expect(canTransition("created", "processing")).toBe(true);
    expect(canTransition("processing", "paid")).toBe(true);
    expect(canTransition("paid", "refunded")).toBe(true);
  });

  it("forbids skipping straight to paid", () => {
    expect(canTransition("pending", "paid")).toBe(false);
    expect(canTransition("created", "paid")).toBe(false);
  });

  it("forbids walking back out of a terminal state", () => {
    const terminal: PromotionStatus[] = ["failed", "cancelled", "refunded"];
    for (const from of terminal) {
      for (const to of ["pending", "created", "processing", "paid"] as PromotionStatus[]) {
        expect(canTransition(from, to), `${from} -> ${to} must be refused`).toBe(false);
      }
    }
  });

  it("models more than a paid boolean", () => {
    const states: PromotionStatus[] = [
      "pending",
      "created",
      "processing",
      "paid",
      "failed",
      "cancelled",
      "refunded",
    ];
    for (const s of states) expect(typeof canTransition(s, "paid")).toBe("boolean");
  });
});

describe("migration safety", () => {
  const sql = MIGRATION.replace(/--.*$/gm, "");

  it("is additive only", () => {
    expect(sql).not.toMatch(
      /\b(DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE|DELETE\s+FROM|UPDATE\s+public\.)/i,
    );
  });

  it("does not alter the properties table", () => {
    expect(sql).not.toMatch(/ALTER\s+TABLE\s+public\.properties/i);
  });

  it("revokes client writes and enables RLS", () => {
    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/i);
    expect(sql).toMatch(
      /REVOKE INSERT, UPDATE, DELETE ON public\.promotion_orders FROM anon, authenticated/i,
    );
  });

  it("keeps gateway identifiers nullable", () => {
    const cols = ["gateway", "gateway_order_id", "gateway_payment_id", "gateway_signature"];
    for (const c of cols) {
      expect(sql).toMatch(new RegExp(`${c}\\s+text(?!\\s+NOT NULL)`, "i"));
    }
  });

  it("constrains status to the modelled states", () => {
    for (const s of [
      "pending",
      "created",
      "processing",
      "paid",
      "failed",
      "cancelled",
      "refunded",
    ]) {
      expect(sql).toContain(`'${s}'`);
    }
  });
});

describe("audit fixes — duplicate orders and misleading states", () => {
  it("11. the migration constrains a property to one open order", () => {
    const sql = MIGRATION.replace(/--.*$/gm, "");
    expect(sql).toMatch(/CREATE UNIQUE INDEX[^;]*promotion_orders_one_open_per_property/i);
    expect(sql).toMatch(/WHERE status IN \('pending', 'created', 'processing'\)/i);
  });

  it("11b. the server reuses an open order instead of inserting a duplicate", () => {
    const s = stripComments(SERVER_SRC);
    // It must look for an existing open order before inserting.
    const selectIdx = s.indexOf('.select("id, plan_id, amount_paise, status")');
    const insertIdx = s.indexOf(".insert({");
    expect(selectIdx, "an open-order lookup must exist").toBeGreaterThan(-1);
    expect(selectIdx, "the lookup must precede the insert").toBeLessThan(insertIdx);
    expect(s).toMatch(/OPEN_STATUSES/);
  });

  it("11c. a re-priced order recomputes the amount from the plan, never from input", () => {
    const s = stripComments(SERVER_SRC);
    const updateBlock = s.slice(s.indexOf(".update({"), s.indexOf(".update({") + 200);
    expect(updateBlock).toMatch(/amount_paise:\s*amountPaise/);
    expect(updateBlock).not.toMatch(/args\.(amount|price)/);
  });

  it("a refusal is announced as an alert, not a success", () => {
    const s = stripComments(CHECKOUT_SRC);
    expect(s).toMatch(/role=\{failed \? "alert" : "status"\}/);
    expect(s).toMatch(/result\.status === "forbidden"/);
    expect(s).toMatch(/result\.status === "invalid_plan"/);
    // The success icon must be conditional now, not unconditional.
    expect(s).not.toMatch(/<ShieldCheck className="mt-0\.5 h-4 w-4 flex-none text-primary"/);
  });

  it("open statuses exclude terminal ones", async () => {
    const { OPEN_STATUSES } = await import("@/modules/owner/services/promotion.server");
    expect([...OPEN_STATUSES]).toEqual(["pending", "created", "processing"]);
    for (const terminal of ["paid", "failed", "cancelled", "refunded"]) {
      expect(OPEN_STATUSES).not.toContain(terminal);
    }
  });
});

describe("known gaps — asserted so they cannot be silently 'finished'", () => {
  it("activation is NOT implemented: nothing sets the promotion window", () => {
    const appSrc = [SERVER_SRC, CHECKOUT_SRC, PROMOTE_SRC, FNS_SRC].join("\n");
    // If this ever fails, activation landed and this test should become a real
    // activation test rather than a gap marker.
    expect(appSrc).not.toMatch(/promotion_starts_at|promotion_ends_at/);
  });

  it("no code path can set status to paid", () => {
    const s = stripComments(SERVER_SRC);
    expect(s).not.toMatch(/status:\s*["'`]paid["'`]/);
  });
});
