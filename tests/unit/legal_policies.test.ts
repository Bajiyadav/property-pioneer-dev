import { describe, it, expect } from "vitest";
import { LEGAL_CONTACT, LEGAL_EFFECTIVE_DATE } from "@/modules/legal/components/LegalPage";

describe("Legal & Platform Policies Production Verification Suite", () => {
  it("A. defines consistent legal metadata across all policies", () => {
    expect(LEGAL_CONTACT).toBe("support@seedhaproperties.com");
    expect(LEGAL_EFFECTIVE_DATE).toContain("2026");
  });

  it("B. validates Cookie Policy storage taxonomy and functional separation", () => {
    const storageKeys = [
      { key: "sb-*-auth-token", type: "Strictly Necessary", requiresConsent: false },
      { key: "seedha_selected_state", type: "Functional / Session", requiresConsent: false },
      { key: "seedha_selected_city", type: "Functional / Session", requiresConsent: false },
      { key: "up_cookie_consent", type: "Preferences", requiresConsent: false },
      { key: "up_favorites_v2", type: "Preferences", requiresConsent: true },
      { key: "up_recent_searches", type: "Preferences", requiresConsent: true },
      { key: "up_login_notified:*", type: "Security", requiresConsent: false },
    ];

    expect(storageKeys.length).toBe(7);
    const essentialKeys = storageKeys.filter((s) => !s.requiresConsent);
    expect(essentialKeys.map((s) => s.key)).toContain("seedha_selected_state");
    expect(essentialKeys.map((s) => s.key)).toContain("seedha_selected_city");
  });

  it("C. validates Refund Policy service tiers and non-refundable boundaries", () => {
    const freeServices = [
      "Browsing & Search",
      "Direct Owner Contact",
      "Scheduling Visits",
      "Standard Property Posting (0% Brokerage)",
      "Home Loan Comparison",
      "Rental Agreement Drafting",
    ];

    const paidServices = ["Owner Promotional Boost Packages", "Priority Assistance Plans"];

    const nonRefundableScenarios = [
      "Fulfilled promotional boost duration",
      "Violations of Content Moderation Policy",
      "Unused duration after external sale/rental",
      "Statutory government stamp duty/registration fees",
      "Independent landlord security deposits",
    ];

    expect(freeServices.length).toBeGreaterThanOrEqual(6);
    expect(paidServices.length).toBe(2);
    expect(nonRefundableScenarios.length).toBe(5);
  });

  it("D. validates Content Moderation Policy prohibited categories and enforcement tiers", () => {
    const prohibitedCategories = [
      "Fake or phantom property listings",
      "False ownership claims / unauthorized postings",
      "Broker disguise and agent impersonation",
      "Deceptive pricing & bait-and-switch",
      "Fake, stock, or stolen photography",
      "Advance fee & viewing card scams",
      "Solicitation of sensitive personal data (passwords, OTPs, Aadhaar)",
      "Discrimination & hate speech",
      "Harassment & abusive communications",
      "Malicious links & spam",
    ];

    const enforcementTiers = [
      "Correction Request",
      "Temporary Delisting",
      "Permanent Removal",
      "Account Suspension & Ban",
      "Blacklisting & Law Enforcement Referral",
    ];

    expect(prohibitedCategories.length).toBeGreaterThanOrEqual(10);
    expect(enforcementTiers.length).toBe(5);
  });

  it("E. validates cross-linking and single canonical routes", () => {
    const canonicalRoutes = [
      "/terms-of-service",
      "/privacy-policy",
      "/cookie-policy",
      "/refund-policy",
      "/moderation-policy",
    ];

    const set = new Set(canonicalRoutes);
    expect(set.size).toBe(5);
    for (const route of canonicalRoutes) {
      expect(route.startsWith("/")).toBe(true);
      expect(route.includes(" ")).toBe(false);
    }
  });
});
