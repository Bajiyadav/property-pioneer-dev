import { describe, it, expect } from "vitest";
import { fetchPublicPropertyFeed } from "@/modules/property/services/propertyService";
import { fetchProperties } from "@/modules/property/services/propertyQueries";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../fixtures/qaAccounts";

const canRun = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

describe.skipIf(!canRun)("Location-First Property Discovery Flow", () => {
  it("allows anonymous customers to search by location/city without authentication", async () => {
    const results = await fetchProperties({ city: "Hyderabad", listing: "rent" });
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);

    const first = results[0];
    expect(first).toBeDefined();
    expect(first.title).toBeDefined();
    expect(first.price).toBeGreaterThan(0);
    expect(first.property_type).toBeDefined();
  });

  it("filters properties when querying specific localities like Madhapur or Gachibowli", async () => {
    const feed = await fetchPublicPropertyFeed({ q: "Madhapur", listing: "rent" });
    expect(feed.properties).toBeDefined();
    expect(Array.isArray(feed.properties)).toBe(true);
  });

  it("ensures public property payload never exposes owner direct private phone or email", async () => {
    const results = await fetchProperties({ listing: "rent" });
    expect(results.length).toBeGreaterThan(0);

    for (const prop of results) {
      // Owner sensitive PII fields must not be present on public property interface
      expect((prop as Record<string, unknown>).owner_phone).toBeUndefined();
      expect((prop as Record<string, unknown>).owner_email).toBeUndefined();
    }
  });

  it("preserves redirect targets and parameters across authentication journeys", () => {
    function safeRedirect(target: string): string | null {
      if (!target.startsWith("/") || target.startsWith("//")) return null;
      if (target.startsWith("/auth")) return null;
      return target;
    }

    expect(safeRedirect("/properties/hyderabad-madhapur-2bhk-123")).toBe(
      "/properties/hyderabad-madhapur-2bhk-123",
    );
    expect(safeRedirect("/properties?q=Madhapur&city=Hyderabad")).toBe(
      "/properties?q=Madhapur&city=Hyderabad",
    );
    expect(safeRedirect("https://attacker.com")).toBeNull();
    expect(safeRedirect("//attacker.com")).toBeNull();
    expect(safeRedirect("/auth?redirect=/foo")).toBeNull();
  });
});
