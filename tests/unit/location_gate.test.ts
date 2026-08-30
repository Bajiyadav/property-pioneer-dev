import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LIVE_CITIES, STATES } from "@/config/platform";
import { hasCompleteLocation } from "@/modules/property/store/locationStore";

/**
 * Location-first homepage: state and city are compulsory before anything renders.
 *
 * The gate is the only way into the homepage, which makes two things
 * load-bearing:
 *   - It must not depend on the Geoapify API. A missing key or an outage there
 *     would otherwise lock every visitor out of the site entirely.
 *   - Every state it offers must have at least one live city, or a visitor can
 *     select a state and then find no city to pick and no way forward.
 */

const src = (rel: string) => readFileSync(join(process.cwd(), "src", rel), "utf8");
const gate = src("modules/property/components/LocationGate.tsx");
const home = src("routes/index.tsx");

describe("the gate cannot be bypassed", () => {
  it("renders children only once both a state and a city are set", () => {
    expect(gate).toMatch(/if\s*\(selectedState\s*&&\s*selectedCity\)/);
  });

  it("keeps Continue disabled until both are chosen", () => {
    expect(gate).toMatch(/canContinue\s*=\s*Boolean\(draftState\s*&&\s*draftCity\)/);
    expect(gate).toContain("disabled={!canContinue}");
  });

  it("clears the city when the state changes", () => {
    // Otherwise a city from the previous state survives and the pair is wrong.
    expect(gate).toContain('setDraftCity("")');
  });
});

describe("the gate does not depend on a third-party geocoder", () => {
  it("uses the static state and city config", () => {
    expect(gate).toContain("LIVE_CITIES");
    expect(gate).toContain("STATES");
  });

  it("does not import the Geoapify autocomplete", () => {
    expect(gate).not.toContain("GeoapifyAutocomplete");
  });
});

describe("the homepage is wrapped by the gate", () => {
  it("imports and renders it", () => {
    expect(home).toContain("LocationGate");
    expect(home).toMatch(/<LocationGate/);
    expect(home).toMatch(/<\/LocationGate>/);
  });

  it("feeds the gate the same handlers the hero already uses", () => {
    // A second parallel location store is exactly what this avoids.
    expect(home).toMatch(/handleStateChange\(state\)/);
    expect(home).toMatch(/handleCityChange\(city\)/);
  });
});

describe("every offered state can actually be completed", () => {
  it("names at least one live city, or says so explicitly", () => {
    const statesWithNoLiveCity = STATES.filter((s) => !LIVE_CITIES.some((c) => c.state === s));
    // Selecting one of these must not look like a dead end.
    if (statesWithNoLiveCity.length > 0) {
      expect(gate).toContain("We are not live in");
    }
  });

  it("offers cities filtered to the chosen state", () => {
    expect(gate).toMatch(/LIVE_CITIES\.filter\(\(c\)\s*=>\s*c\.state\s*===\s*draftState\)/);
  });
});

describe("hasCompleteLocation", () => {
  it("requires both a city and a state", () => {
    expect(hasCompleteLocation({ lat: 0, lon: 0, city: "Hyderabad", state: "Telangana" })).toBe(
      true,
    );
    expect(hasCompleteLocation({ lat: 0, lon: 0, city: "Hyderabad" })).toBe(false);
    expect(hasCompleteLocation({ lat: 0, lon: 0, city: "", state: "Telangana" })).toBe(false);
    expect(hasCompleteLocation(undefined)).toBe(false);
  });

  it("rejects the free-text fallback, which carries neither", () => {
    // Geoapify's "use what I typed" option sets only a locality.
    expect(
      hasCompleteLocation({ lat: 0, lon: 0, city: "", locality: "somewhere", placeId: "manual" }),
    ).toBe(false);
  });

  it("rejects whitespace-only values", () => {
    expect(hasCompleteLocation({ lat: 0, lon: 0, city: "  ", state: "  " })).toBe(false);
  });
});
