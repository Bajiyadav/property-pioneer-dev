import { describe, expect, it } from "vitest";
import {
  canTransition,
  decideVerifiedPayment,
  decideWebhookTransition,
  promotionWindow,
  type PaymentStatus,
} from "@/modules/billing/services/paymentTransitions";

describe("payment state machine", () => {
  it("forbids the dangerous transitions the brief calls out", () => {
    expect(canTransition("paid", "failed")).toBe(false); // a late failure can't unpay
    expect(canTransition("refunded", "paid")).toBe(false); // a refund can't be re-paid
    expect(canTransition("failed", "paid")).toBe(false);
    expect(canTransition("cancelled", "paid")).toBe(false);
  });

  it("allows the real forward moves", () => {
    expect(canTransition("pending", "created")).toBe(true);
    expect(canTransition("created", "processing")).toBe(true);
    expect(canTransition("processing", "paid")).toBe(true);
    expect(canTransition("paid", "refunded")).toBe(true);
  });

  it("treats an identical status as an allowed no-op (idempotent)", () => {
    (["pending", "paid", "refunded", "failed"] as PaymentStatus[]).forEach((s) =>
      expect(canTransition(s, s)).toBe(true),
    );
  });
});

describe("verified browser callback", () => {
  it("pays an order that is still open", () => {
    const d = decideVerifiedPayment("created");
    expect(d.next).toBe("paid");
    expect(d.idempotentNoop).toBe(false);
  });

  it("is a no-op on an already-paid order (double submit grants nothing twice)", () => {
    const d = decideVerifiedPayment("paid");
    expect(d.next).toBeNull();
    expect(d.idempotentNoop).toBe(true);
  });

  it("refuses to pay a refunded or failed order", () => {
    expect(decideVerifiedPayment("refunded").next).toBeNull();
    expect(decideVerifiedPayment("failed").next).toBeNull();
  });
});

describe("verified webhook reconciliation", () => {
  it("captures pay the order", () => {
    expect(decideWebhookTransition("created", "payment.captured").next).toBe("paid");
    expect(decideWebhookTransition("processing", "order.paid").next).toBe("paid");
  });

  it("a duplicate capture on a paid order is a harmless no-op", () => {
    const d = decideWebhookTransition("paid", "payment.captured");
    expect(d.next).toBeNull();
    expect(d.idempotentNoop).toBe(true);
  });

  it("a late failure after paid is ignored, not applied", () => {
    const d = decideWebhookTransition("paid", "payment.failed");
    expect(d.next).toBeNull();
    expect(d.idempotentNoop).toBe(false);
  });

  it("failure moves an open order to failed", () => {
    expect(decideWebhookTransition("created", "payment.failed").next).toBe("failed");
  });

  it("refund events move a paid order to refunded, and nothing else", () => {
    expect(decideWebhookTransition("paid", "refund.processed").next).toBe("refunded");
    expect(decideWebhookTransition("created", "refund.processed").next).toBeNull();
  });

  it("authorized / unknown events never move the order on their own", () => {
    expect(decideWebhookTransition("created", "payment.authorized").next).toBeNull();
    expect(decideWebhookTransition("created", "some.other.event").next).toBeNull();
  });
});

describe("promotion window", () => {
  it("spans exactly validityDays from now", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const w = promotionWindow(30, now);
    expect(w.startsAt).toBe("2026-01-01T00:00:00.000Z");
    expect(w.endsAt).toBe("2026-01-31T00:00:00.000Z");
  });
});
