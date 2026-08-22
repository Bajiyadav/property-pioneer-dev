import { describe, it, expect } from "vitest";
import {
  resolveInitialStep,
  hasPrefilledLocation,
  FIRST_STEP,
  DETAILS_STEP,
} from "@/modules/owner/components/ListingWizard/resolveInitialStep";

/**
 * Guards the rule that a saved draft must never skip Step 1.
 *
 * A draft lives in localStorage under `sp_listing_draft` and survives both the
 * session and the listing. If it could influence the opening step, then once an
 * owner had entered a city on any listing, every subsequent listing would open
 * on Step 2 and silently inherit the previous property's location — an address
 * the owner never chose for it, on a listing that then goes to moderation.
 *
 * The previous test for this re-declared the logic inline instead of importing
 * it, so it asserted a copy and would have passed no matter what the component
 * did. These import the shipped function.
 */
describe("wizard opening step", () => {
  it("starts at Step 1 with no navigation intent", () => {
    expect(resolveInitialStep(undefined)).toBe(FIRST_STEP);
    expect(resolveInitialStep({})).toBe(FIRST_STEP);
  });

  it("skips to Step 2 only on explicit intent from the URL", () => {
    expect(resolveInitialStep({ city: "Hyderabad", locality: "Madhapur" })).toBe(DETAILS_STEP);
    expect(resolveInitialStep({ prefilled: true })).toBe(DETAILS_STEP);
    expect(resolveInitialStep({ step: DETAILS_STEP })).toBe(DETAILS_STEP);
  });

  it("needs BOTH city and locality — a half-chosen location is not intent", () => {
    expect(resolveInitialStep({ city: "Hyderabad" })).toBe(FIRST_STEP);
    expect(resolveInitialStep({ locality: "Madhapur" })).toBe(FIRST_STEP);
    expect(hasPrefilledLocation({ city: "Hyderabad" })).toBe(false);
  });

  it("honours an explicit step even when it points back at Step 1", () => {
    // `?? ` not `||`: step 1 is falsy under `||` and would be overridden.
    expect(resolveInitialStep({ step: FIRST_STEP, city: "Hyderabad", locality: "Madhapur" })).toBe(
      FIRST_STEP,
    );
  });

  it("cannot be influenced by a stored draft", () => {
    // The regression this exists for. A draft is not URL intent, so even a
    // complete one must leave the wizard on Step 1 — the function is only ever
    // handed search params, and reads no storage of its own.
    const staleDraft = {
      city: "Hyderabad",
      locality: "Gachibowli",
      property_type: "Apartment",
      listing_type: "rent",
      bedrooms: 2,
    };
    // A new listing mounts with no search params, whatever the draft holds.
    expect(resolveInitialStep(undefined)).toBe(FIRST_STEP);
    expect(resolveInitialStep({})).toBe(FIRST_STEP);
    // And the resolver has no way to reach that draft.
    expect(Object.keys(staleDraft)).toContain("city");
    expect(resolveInitialStep.length, "takes exactly one argument: the URL params").toBe(1);
  });
});
