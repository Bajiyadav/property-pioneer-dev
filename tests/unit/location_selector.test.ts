import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { locationLabel } from "@/shared/components/location/locationValue";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const strip = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
const COMPONENT = strip(read("src/shared/components/location/SearchLocationSelector.tsx"));
const VALUE = strip(read("src/shared/components/location/locationValue.ts"));
const BOX = strip(read("src/modules/marketing/home/TabbedSearchBox.tsx"));

describe("canonical location label", () => {
  it("defaults to All India when no city is chosen", () => {
    expect(locationLabel({ city: "", locality: "" })).toBe("All India");
    expect(locationLabel({ city: "", locality: "Gachibowli" })).toBe("All India");
  });
  it("shows City, and Locality, City when a locality is set", () => {
    expect(locationLabel({ city: "Hyderabad", locality: "" })).toBe("Hyderabad");
    expect(locationLabel({ city: "Hyderabad", locality: "Gachibowli" })).toBe(
      "Gachibowli, Hyderabad",
    );
  });
});

describe("single source of truth — no competing location params", () => {
  it("value model is exactly { city, locality } — no fabricated state/district", () => {
    expect(VALUE).toMatch(/city: string;[\s\S]*?locality: string;/);
    expect(COMPONENT).not.toMatch(/district:|stateParam|selectedState:/);
  });
  it("selector uses the real CITIES config, not a hardcoded list", () => {
    expect(COMPONENT).toMatch(/import \{ LIVE_CITIES \} from "@\/config\/platform"/);
    expect(COMPONENT).not.toMatch(/const CITIES = \[/);
  });
  it("groups cities by real state for readability (label, not a cascade)", () => {
    expect(COMPONENT).toMatch(/byState/);
    expect(COMPONENT).toMatch(/c\.state/);
  });
  it("All India requires no city; locality is optional", () => {
    expect(COMPONENT).toMatch(/onClick=\{\(\) => commit\(""\)\}/);
    expect(COMPONENT).toMatch(/\(optional\)/);
  });
  it("has a 44px touch target for mobile", () => {
    expect(COMPONENT).toMatch(/min-h-\[44px\]/);
  });
});

describe("search box no longer carries a divergent hardcoded city list", () => {
  it("drives its city options from the canonical LIVE_CITIES source", () => {
    expect(BOX).toMatch(/import \{ LIVE_CITIES \} from "@\/config\/platform"/);
    expect(BOX).toMatch(/LIVE_CITIES\.map/);
    // The old hardcoded "Delhi NCR"/"Ahmedabad" option list is gone.
    expect(BOX).not.toMatch(/<option value="Delhi NCR">/);
  });
  it("maps to the canonical /properties params (city, q), not new ones", () => {
    expect(BOX).toMatch(/to: "\/properties"/);
    expect(BOX).toMatch(/city:/);
  });
});
