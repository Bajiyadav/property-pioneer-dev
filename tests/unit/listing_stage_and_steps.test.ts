import { describe, it, expect } from "vitest";
import { deriveStage } from "@/modules/owner/components/listingStage";
import { validateStep, canAdvance } from "@/modules/owner/components/ListingWizard/stepValidation";

/**
 * Step 8 (submission status) and the supplementary per-step gate.
 *
 * The wizard already gated steps 1-3 inside handleNext; steps 4-7 had no gate at
 * all, and no gate could express a rule spanning two fields. These cover the
 * added behaviour, not the pre-existing checks.
 */

describe("listing stage is derived from the database, not from the submit call", () => {
  it("treats is_approved as the authority", () => {
    // Even a row still labelled 'submitted' is public once approved.
    expect(deriveStage({ status: "submitted", is_approved: true })).toBe("approved");
  });

  it("never reports published for an unapproved row", () => {
    // The failure that matters: telling an owner they are live when RLS hides them.
    for (const status of ["available", "submitted", "under_review", null, ""]) {
      expect(deriveStage({ status, is_approved: false })).not.toBe("approved");
    }
  });

  it("defaults to under review rather than inventing a state", () => {
    expect(deriveStage({ status: null, is_approved: null })).toBe("under_review");
    expect(deriveStage({ status: "available", is_approved: false })).toBe("under_review");
  });

  it("surfaces a moderator note as changes required even without a rejected status", () => {
    expect(
      deriveStage({ status: "available", is_approved: false, admin_notes: "Add photos" }),
    ).toBe("changes_required");
    // Whitespace is not a note.
    expect(deriveStage({ status: "available", is_approved: false, admin_notes: "   " })).toBe(
      "under_review",
    );
  });

  it("keeps explicit rejected and draft states", () => {
    expect(deriveStage({ status: "rejected", is_approved: false })).toBe("rejected");
    expect(deriveStage({ status: "draft", is_approved: false })).toBe("draft");
  });
});

describe("supplementary per-step gate", () => {
  it("catches cross-field mistakes a single field cannot", () => {
    expect(validateStep(1, { area_sqft: 900, carpet_area_sqft: 1200 })[0].field).toBe(
      "carpet_area_sqft",
    );
    expect(validateStep(1, { total_floors: 5, exact_floor: 9 })[0].field).toBe("exact_floor");
  });

  it("allows a valid carpet/built-up combination", () => {
    expect(canAdvance(1, { area_sqft: 1200, carpet_area_sqft: 950 })).toBe(true);
  });

  it("does not block optional steps", () => {
    // Amenities and photos are genuinely optional; gating them would push an
    // owner to enter something untrue.
    expect(canAdvance(4, {})).toBe(true);
    expect(canAdvance(5, {})).toBe(true);
  });

  it("requires a time slot only once days are chosen", () => {
    expect(canAdvance(6, {})).toBe(true);
    expect(canAdvance(6, { visit_days: ["Mon"], visit_time_slots: [] })).toBe(false);
    expect(canAdvance(6, { visit_days: ["Mon"], visit_time_slots: ["Morning"] })).toBe(true);
  });

  it("blocks submission until the owner declaration is accepted", () => {
    expect(canAdvance(7, { owner_declaration: false })).toBe(false);
    expect(canAdvance(7, { owner_declaration: true })).toBe(true);
  });

  it("validates PIN format only when one is supplied", () => {
    expect(canAdvance(2, { pincode: "" })).toBe(true);
    expect(canAdvance(2, { pincode: "5000" })).toBe(false);
    expect(canAdvance(2, { pincode: "500033" })).toBe(true);
  });

  it("does not restate the checks handleNext already makes", () => {
    // Step 1 with no property type is caught by handleNext, not here — this
    // module must not become a competing second contract.
    expect(canAdvance(1, {})).toBe(true);
    expect(canAdvance(3, {})).toBe(true);
  });
});
