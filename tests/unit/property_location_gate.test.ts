import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  decideLocationReveal,
  isKnownLiveCity,
  areasMatch,
} from "@/modules/property/services/locationGate";

/**
 * Property exact-location gate.
 *
 * Coarse location (city/locality) is public and SEO-safe; the EXACT street
 * address + landmark are released only after a matching city+locality, and only
 * by the server endpoint. Two layers of assertion:
 *  - the pure decision (decideLocationReveal) covering every acceptance branch;
 *  - source-integrity that the sensitive fields have actually left the public
 *    surface (columns, structured data, search) and are only returned on "ok".
 */

const src = (rel: string) =>
  readFileSync(fileURLToPath(new URL(`../../src/${rel}`, import.meta.url)), "utf8");

const service = src("modules/property/services/propertyService.ts");
const structured = src("modules/property/components/PropertyStructuredData.tsx");
const route = src("routes/api/public/properties.$id.location.ts");
const card = src("modules/property/components/PropertyCard.tsx");

const HYD = { city: "Hyderabad", locality: "Madhapur" };
const HYD_NO_LOCALITY = { city: "Hyderabad", locality: null };

describe("decideLocationReveal — never assume, validate, match", () => {
  it("no city provided → city_required (never silently assume location)", () => {
    expect(decideLocationReveal({ city: "", locality: "", property: HYD }).status).toBe(
      "city_required",
    );
  });

  it("unknown/invalid city → invalid_location", () => {
    expect(
      decideLocationReveal({ city: "Gotham", locality: "Madhapur", property: HYD }).status,
    ).toBe("invalid_location");
  });

  it("valid city that does not match the property → mismatch (guides to the right city)", () => {
    const r = decideLocationReveal({ city: "Mumbai", locality: "Bandra", property: HYD });
    expect(r.status).toBe("mismatch");
    if (r.status === "mismatch") expect(r.expectedCity).toBe("Hyderabad");
  });

  it("broad city only, when the property has a locality → locality_required (criterion #7)", () => {
    const r = decideLocationReveal({ city: "Hyderabad", locality: "", property: HYD });
    expect(r.status).toBe("locality_required");
  });

  it("right city, wrong locality → mismatch", () => {
    expect(
      decideLocationReveal({ city: "Hyderabad", locality: "Kondapur", property: HYD }).status,
    ).toBe("mismatch");
  });

  it("valid matching city + locality → ok (reveal allowed)", () => {
    expect(
      decideLocationReveal({ city: "Hyderabad", locality: "Madhapur", property: HYD }).status,
    ).toBe("ok");
  });

  it("tolerant locality match (HSR vs HSR Layout) → ok", () => {
    expect(
      decideLocationReveal({
        city: "Bengaluru",
        locality: "HSR",
        property: { city: "Bengaluru", locality: "HSR Layout" },
      }).status,
    ).toBe("ok");
  });

  it("property with no locality → matching city alone is enough", () => {
    expect(
      decideLocationReveal({ city: "Hyderabad", locality: "", property: HYD_NO_LOCALITY }).status,
    ).toBe("ok");
  });

  it("city is validated against the LIVE market list, case/space-insensitively", () => {
    expect(isKnownLiveCity("hyderabad")).toBe(true);
    expect(isKnownLiveCity("  Bengaluru ")).toBe(true);
    expect(isKnownLiveCity("Atlantis")).toBe(false);
    expect(isKnownLiveCity("")).toBe(false);
    expect(areasMatch("Madhapur", "madhapur")).toBe(true);
    expect(areasMatch("", "Madhapur")).toBe(false);
  });
});

describe("exact location is off the public surface (server-side enforcement)", () => {
  it("address and landmark are NOT in the public column select", () => {
    // The public payload must not carry the sensitive fields at all.
    expect(service).not.toMatch(/BASE_PROPERTY_COLUMNS =\s*\n\s*"[^"]*\baddress\b/);
    expect(service).not.toMatch(/EXTENDED_PROPERTY_COLUMNS =\s*\n\s*"[^"]*\blandmark\b/);
    // coarse locality stays public.
    expect(service).toMatch(/EXTENDED_PROPERTY_COLUMNS =\s*\n\s*"[^"]*\blocality\b/);
  });

  it("public text-search does not filter on the exact address", () => {
    expect(service).toContain('const columns = ["title", "city", "description"]');
    expect(service).not.toContain('"title", "city", "address", "description"');
  });

  it("SEO structured data does NOT emit the exact streetAddress (coarse only)", () => {
    expect(structured).not.toContain("streetAddress:");
    expect(structured).toContain("addressLocality");
  });

  it("public cards show coarse locality/city, never the exact address", () => {
    expect(card).not.toMatch(/\$\{property\.address\},\s*\$\{property\.city\}/);
  });
});

describe("reveal endpoint releases the address only on a validated match", () => {
  it("reads the exact fields with the SERVICE-ROLE client, not the publishable one", () => {
    expect(route).toContain("supabaseAdmin");
    expect(route).toContain('.select("id, city, locality, address, landmark")');
  });

  it("returns guidance (no address) for every non-ok decision", () => {
    // The only place `address:` is returned is the ok branch, after the guard.
    expect(route).toContain('if (decision.status !== "ok") {');
    expect(route).toMatch(/decision\.status !== "ok"[\s\S]*return jsonResponse\(decision\)/);
    expect(route).toMatch(/status: "ok",\s*\n\s*address: property\.address/);
  });

  it("is rate-limited to deter address scraping", () => {
    expect(route).toContain("checkRateLimits");
    expect(route).toContain("PER_IP_LOCATION");
  });
});
