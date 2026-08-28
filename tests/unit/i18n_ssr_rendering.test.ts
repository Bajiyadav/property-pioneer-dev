import { describe, it, expect } from "vitest";
import i18n from "@/lib/i18n/index";

describe("i18n Synchronous SSR and Client Resolution", () => {
  it("initializes synchronously without waiting for async timer callbacks", () => {
    expect(i18n.isInitialized).toBe(true);
  });

  it("resolves all hero keys to user-facing English text instead of raw translation keys", () => {
    const keys = [
      "hero.title",
      "hero.subtitle",
      "hero.quick_buy",
      "hero.quick_buy_desc",
      "hero.quick_rent",
      "hero.quick_rent_desc",
      "hero.quick_commercial",
      "hero.quick_commercial_desc",
    ];

    for (const key of keys) {
      const translated = i18n.t(key);
      expect(translated).not.toBe(key);
      expect(typeof translated).toBe("string");
      expect(translated.length).toBeGreaterThan(0);
    }
  });

  it("resolves hero.title to exact expected marketing copy", () => {
    expect(i18n.t("hero.title")).toBe("Find Your Next Home Directly from Verified Owners");
  });

  it("resolves hero.quick_buy and hero.quick_rent accurately", () => {
    expect(i18n.t("hero.quick_buy")).toBe("Buy");
    expect(i18n.t("hero.quick_buy_desc")).toBe("Properties");
    expect(i18n.t("hero.quick_rent")).toBe("Rent");
    expect(i18n.t("hero.quick_rent_desc")).toBe("Homes");
    expect(i18n.t("hero.quick_commercial")).toBe("Commercial");
    expect(i18n.t("hero.quick_commercial_desc")).toBe("Spaces");
  });
});
