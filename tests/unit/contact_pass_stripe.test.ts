import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  verifyWebhookSignature,
  findCustomerPlan,
  isStripeConfigured,
} from "@/modules/billing/services/stripe.server";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const strip = (s: string) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

const STRIPE = read("src/modules/billing/services/stripe.server.ts");
const WEBHOOK = read("src/routes/api/webhooks/stripe.ts");
const CHECKOUT_FN = read("src/modules/billing/services/contactPassFunctions.ts");
const CONTACT = read("src/routes/api/public/properties.$id.contact.ts");
const MIGRATION = read(
  "supabase/migrations_pending_review/20260823150000_contact_pass_and_atomic_quota.sql",
);

describe("10+11. amount tampering — client cannot control price", () => {
  it("the checkout server fn accepts ONLY planId", () => {
    const s = strip(CHECKOUT_FN);
    const schema = s.slice(s.indexOf("z.object"), s.indexOf("z.object") + 120);
    expect(schema).toMatch(/planId/);
    expect(schema).not.toMatch(/amount|price|paise|currency/i);
  });
  it("price is computed server-side from the plan, never read from input", () => {
    const s = strip(STRIPE);
    expect(s).toMatch(/plan\.priceInr \* 100/);
    expect(s).not.toMatch(/args\.(amount|price)|body\.(amount|price)/);
  });
  it("an unknown plan id yields no session", () => {
    expect(findCustomerPlan("plan_freedom")).toBeDefined();
    expect(findCustomerPlan("free-pass")).toBeUndefined();
  });
});

describe("12+13. webhook signature verification (real HMAC)", () => {
  const whsec = "whsec_" + "t".repeat(32);
  const body = JSON.stringify({
    id: "evt_1",
    type: "checkout.session.completed",
    data: { object: { metadata: { user_id: "u1", plan_id: "plan_freedom" } } },
  });
  const sign = (payload: string, secret: string, t = "1700000000") => {
    const v1 = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
    return `t=${t},v1=${v1}`;
  };

  it("accepts a correctly signed event and extracts metadata", () => {
    process.env.STRIPE_WEBHOOK_SECRET = whsec;
    const r = verifyWebhookSignature(body, sign(body, whsec));
    expect(r.verified).toBe(true);
    expect(r.eventId).toBe("evt_1");
    expect(r.userId).toBe("u1");
    expect(r.planId).toBe("plan_freedom");
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });
  it("13. rejects a missing signature header", () => {
    process.env.STRIPE_WEBHOOK_SECRET = whsec;
    expect(verifyWebhookSignature(body, null).verified).toBe(false);
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });
  it("12. rejects a signature made with the wrong secret", () => {
    process.env.STRIPE_WEBHOOK_SECRET = whsec;
    const r = verifyWebhookSignature(body, sign(body, "whsec_" + "x".repeat(32)));
    expect(r.verified).toBe(false);
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });
  it("12. rejects a tampered body under a signature for the original", () => {
    process.env.STRIPE_WEBHOOK_SECRET = whsec;
    const sig = sign(body, whsec);
    const tampered = body.replace("plan_freedom", "plan_super_relax");
    expect(verifyWebhookSignature(tampered, sig).verified).toBe(false);
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });
  it("refuses when no signing secret is configured (no fake verification)", () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(verifyWebhookSignature(body, sign(body, whsec)).verified).toBe(false);
  });
});

describe("14. webhook idempotency + 15. browser cannot activate", () => {
  it("14. duplicate event id is a no-op via the UNIQUE stripe_events insert", () => {
    const s = strip(WEBHOOK);
    expect(s).toMatch(/stripe_events/);
    expect(s).toMatch(/23505/); // unique_violation → already processed
    expect(s).toMatch(/duplicate:\s*true/);
    // Idempotency insert happens BEFORE the grant.
    expect(s.indexOf("stripe_events")).toBeLessThan(s.indexOf("customer_entitlements"));
  });
  it("14. the migration enforces uniqueness at the database, not just in code", () => {
    expect(MIGRATION).toMatch(/event_id text NOT NULL UNIQUE/);
  });
  it("15. entitlement is granted ONLY in the webhook, never from a return URL", () => {
    // The checkout success URL is a dashboard page; activation lives in the
    // webhook. No client/component grants an entitlement.
    const s = strip(WEBHOOK);
    expect(s).toMatch(/verifyWebhookSignature/);
    expect(s).toMatch(/checkout\.session\.completed/);
    // grant is gated behind a verified event
    expect(s.indexOf("verifyWebhookSignature")).toBeLessThan(s.indexOf("customer_entitlements"));
  });
});

describe("identity + entitlement are server-authoritative", () => {
  it("session metadata user_id is set server-side from the authenticated user", () => {
    const s = strip(STRIPE);
    expect(s).toMatch(/metadata\[user_id\]/);
    expect(s).toMatch(/args\.userId/);
  });
  it("checkout fn is auth-gated and takes identity from context, not the client", () => {
    const s = strip(CHECKOUT_FN);
    expect(s).toMatch(/requireSupabaseAuth/);
    expect(s).toMatch(/ctx\.userId/);
    expect(s).not.toMatch(/data\.userId|body\.user_id/);
  });
});

describe("4+5+16. contact endpoint bridge + race fix", () => {
  it("4. returns a structured PAYMENT_REQUIRED (402) when free quota is spent", () => {
    const s = strip(CONTACT);
    expect(s).toMatch(/payment_required|CONTACT_SUBSCRIPTION_REQUIRED/i);
    expect(s).toMatch(/402/);
  });
  it("5. consults the entitlement RPC before the free-quota fallback", () => {
    const s = strip(CONTACT);
    expect(s).toMatch(/authorize_and_consume_contact/);
    // The RPC call must precede the legacy fallback gate.
    expect(s.indexOf("authorize_and_consume_contact")).toBeLessThan(
      s.indexOf("if (!quotaHandledByRpc)"),
    );
  });
  it("does not double-count: the tail contact.requested insert is skipped when the RPC handled it", () => {
    const s = strip(CONTACT);
    expect(s).toMatch(/if \(!quotaHandledByRpc\)/);
  });
  it("16. the race is fixed atomically in the database, not in JS", () => {
    expect(MIGRATION).toMatch(/pg_advisory_xact_lock/);
    expect(MIGRATION).toMatch(/authorize_and_consume_contact/);
    // SECURITY DEFINER + pinned search_path.
    expect(MIGRATION).toMatch(/SECURITY DEFINER/);
    expect(MIGRATION).toMatch(/SET search_path = public/);
  });
  it("7. client cannot use another user's entitlement — RPC keys on auth.uid()", () => {
    expect(MIGRATION).toMatch(/v_user uuid := auth\.uid\(\)/);
    // The RPC takes only a property id; no user_id or entitlement_id parameter.
    expect(MIGRATION).toMatch(/authorize_and_consume_contact\(p_property_id uuid\)/);
  });
});

describe("secret + provider hygiene", () => {
  it("Stripe is configured only via test keys; a live key is refused", () => {
    const s = strip(STRIPE);
    expect(s).toMatch(/sk_live_/); // referenced only to REJECT it
    expect(s).toMatch(/startsWith\("sk_test_"\)/);
    expect(isStripeConfigured()).toBe(false); // no key in test env
  });
  it("no Stripe/Razorpay secret appears in client-reachable code", () => {
    expect(CHECKOUT_FN).not.toMatch(/STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|sk_test_|whsec_/);
  });
  it("single provider: no Razorpay added to the new payment path", () => {
    for (const src of [STRIPE, WEBHOOK, CHECKOUT_FN]) {
      // Comments legitimately reference razorpay.server.ts as the mirror; the
      // hygiene rule is no razorpay CODE, so check with comments stripped.
      expect(strip(src)).not.toMatch(/razorpay/i);
    }
  });
});
