import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  verifyWebhookSignature,
  isWebhookConfigured,
} from "@/modules/billing/services/razorpay.server";

/**
 * Razorpay webhook signature verification. The secret is HMAC-SHA256 over the
 * EXACT raw body; these prove a forged or body-tampered webhook is rejected and
 * that an unconfigured deployment can never accept one.
 */
const SECRET = "whsec_test_only_not_a_real_secret_value_1234567890";

function sign(body: string, secret = SECRET): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("razorpay webhook signature", () => {
  const saved = process.env.RAZORPAY_WEBHOOK_SECRET;
  beforeEach(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = SECRET;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET;
    else process.env.RAZORPAY_WEBHOOK_SECRET = saved;
  });

  it("accepts a correctly signed body", () => {
    const body = JSON.stringify({ event: "payment.captured", id: "evt_1" });
    expect(verifyWebhookSignature(body, sign(body))).toBe(true);
    expect(isWebhookConfigured()).toBe(true);
  });

  it("rejects a tampered body under the same signature", () => {
    const body = JSON.stringify({ event: "payment.captured", amount: 29900 });
    const sig = sign(body);
    const tampered = JSON.stringify({ event: "payment.captured", amount: 1 });
    expect(verifyWebhookSignature(tampered, sig)).toBe(false);
  });

  it("rejects a signature made with the wrong secret", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    expect(verifyWebhookSignature(body, sign(body, "attacker_secret"))).toBe(false);
  });

  it("rejects a missing or empty signature", () => {
    const body = "{}";
    expect(verifyWebhookSignature(body, null)).toBe(false);
    expect(verifyWebhookSignature(body, "")).toBe(false);
  });

  it("refuses to verify when no webhook secret is configured", () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    const body = "{}";
    expect(verifyWebhookSignature(body, sign(body))).toBe(false);
    expect(isWebhookConfigured()).toBe(false);
  });
});
