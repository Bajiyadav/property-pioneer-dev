/**
 * The consent gate.
 *
 * The property these tests defend: nothing is collected unless the visitor has
 * actively opted in. Silence, a dismissed banner, or unreadable storage all
 * count as "no" — which is the part that is easy to regress and expensive to
 * get wrong.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  readConsent,
  writeConsent,
  clearConsent,
  hasAnalyticsConsent,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
} from "@/modules/legal/services/consent";
import {
  trackPropertyView,
  trackSearch,
  deviceBucket,
  __resetTrackingProbe,
} from "@/modules/analytics/services/tracking";

/** Minimal localStorage + window so the browser modules can run under node. */
function installBrowser() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  vi.stubGlobal("localStorage", localStorage);
  vi.stubGlobal("window", {
    localStorage,
    innerWidth: 1280,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  });
  return store;
}

describe("Consent record", () => {
  beforeEach(() => {
    installBrowser();
    __resetTrackingProbe();
  });

  it("treats no decision as no consent", () => {
    expect(readConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("records an explicit accept and reject", () => {
    expect(writeConsent("accepted").choice).toBe("accepted");
    expect(hasAnalyticsConsent()).toBe(true);

    expect(writeConsent("rejected").choice).toBe("rejected");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("re-asks when the policy version moves on", () => {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ choice: "accepted", decidedAt: "", version: CONSENT_VERSION + 1 }),
    );
    // A stale acceptance must not carry over a material policy change.
    expect(readConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("treats corrupt storage as no consent rather than yes", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "{not json");
    expect(readConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("clears back to undecided", () => {
    writeConsent("accepted");
    clearConsent();
    expect(hasAnalyticsConsent()).toBe(false);
  });
});

describe("Tracking respects the gate", () => {
  beforeEach(() => {
    installBrowser();
    __resetTrackingProbe();
  });

  it("collects nothing before a decision", async () => {
    await expect(trackPropertyView({ propertyId: "hyd-000" })).resolves.toBe("no-consent");
    await expect(trackSearch({ city: "Hyderabad" })).resolves.toBe("no-consent");
  });

  it("collects nothing after a rejection", async () => {
    writeConsent("rejected");
    await expect(trackPropertyView({ propertyId: "hyd-000" })).resolves.toBe("no-consent");
    await expect(trackSearch({ city: "Hyderabad" })).resolves.toBe("no-consent");
  });

  it("attempts collection only once consent is given", async () => {
    writeConsent("accepted");
    // The tracking tables may not exist in this environment; what matters is
    // that the call is no longer short-circuited by the gate.
    const result = await trackPropertyView({ propertyId: "hyd-000" });
    expect(result).not.toBe("no-consent");
    expect(["recorded", "unavailable", "failed"]).toContain(result);
  }, 20000);
});

describe("Device bucketing", () => {
  it("buckets coarsely and never fingerprints", () => {
    expect(deviceBucket(320)).toBe("mobile");
    expect(deviceBucket(639)).toBe("mobile");
    expect(deviceBucket(768)).toBe("tablet");
    expect(deviceBucket(1024)).toBe("desktop");
    expect(deviceBucket(2560)).toBe("desktop");
  });
});
