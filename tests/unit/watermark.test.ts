import { describe, it, expect } from "vitest";
import { BRAND } from "@/config/platform";
import { DEFAULT_PROPERTY_COVER } from "@/shared/components/PropertyImage";

describe("Property Watermark Branding", () => {
  it("uses the official Urban Properties brand name", () => {
    expect(BRAND.name).toBe("Urban Properties");
  });

  it("provides a resilient default cover for property photography", () => {
    expect(DEFAULT_PROPERTY_COVER).toBeTruthy();
    expect(DEFAULT_PROPERTY_COVER).toContain("images.unsplash.com");
  });
});
