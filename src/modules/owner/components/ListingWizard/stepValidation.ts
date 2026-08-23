import type { ListingFormData } from "./types";

/**
 * Per-step gating for the owner wizard.
 *
 * `Next` was only ever disabled while saving, so an owner could click through all
 * seven steps leaving required fields empty and only discover the problem at
 * submit — by which point the offending field is several screens behind them.
 *
 * SCOPE — this deliberately does NOT restate the checks handleNext already
 * makes. Steps 1-3 already gate on property type, built-up area, owner name and
 * phone, locality/address and price (and step 2 opens the sign-in modal, a side
 * effect that must not be duplicated). What was missing was:
 *
 *   - steps 4-7, which had no gate at all
 *   - cross-field rules no single field can catch (carpet vs built-up area,
 *     floor vs total floors, days chosen without slots)
 *
 * The authority on what may be WRITTEN remains buildListingPayload at submit.
 * This exists to fail early and locally, not to become a second contract.
 */

export interface StepIssue {
  field: string;
  message: string;
}

const num = (v: unknown): number => {
  const n = typeof v === "string" ? Number(v.replace(/[^\d.]/g, "")) : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const PIN_RE = /^[0-9]{6}$/;
/** Issues for one step. Empty array means the owner may continue. */
export function validateStep(step: number, d: Partial<ListingFormData>): StepIssue[] {
  const issues: StepIssue[] = [];

  switch (step) {
    case 1: {
      // Type / bedrooms / area are gated in handleNext. Only the cross-field
      // rules it cannot express live here.
      if (num(d.carpet_area_sqft) > 0 && num(d.carpet_area_sqft) > num(d.area_sqft)) {
        issues.push({
          field: "carpet_area_sqft",
          message: "Carpet area cannot be larger than built-up area.",
        });
      }
      if (num(d.total_floors) > 0 && num(d.exact_floor) > num(d.total_floors)) {
        issues.push({
          field: "exact_floor",
          message: "Floor number cannot be higher than the total floors.",
        });
      }
      return issues;
    }

    case 2: {
      // City / locality / address / owner contact are gated in handleNext.
      const pin = String(d.pincode ?? "").trim();
      if (pin !== "" && !PIN_RE.test(pin)) {
        issues.push({ field: "pincode", message: "An Indian PIN code is 6 digits." });
      }
      return issues;
    }

    case 3: {
      // Price is gated in handleNext. A sale has no deposit or maintenance.
      if (d.listing_type !== "sale") {
        if (num(d.deposit) < 0) {
          issues.push({ field: "deposit", message: "Deposit cannot be negative." });
        }
        if (num(d.maintenance) < 0) {
          issues.push({ field: "maintenance", message: "Maintenance cannot be negative." });
        }
      }
      return issues;
    }

    case 4:
      // Amenities are genuinely optional — a property with none is valid.
      return issues;

    case 5: {
      // Photos are the single biggest driver of enquiries, but blocking an owner
      // who has none would push them to upload something untrue. Warned, not gated.
      return issues;
    }

    case 6: {
      const days = Array.isArray(d.visit_days) ? d.visit_days : [];
      const slots = Array.isArray(d.visit_time_slots) ? d.visit_time_slots : [];
      if (days.length > 0 && slots.length === 0) {
        issues.push({
          field: "visit_time_slots",
          message: "Pick at least one time slot for the days you selected.",
        });
      }
      return issues;
    }

    case 7: {
      if (!d.owner_declaration) {
        issues.push({
          field: "owner_declaration",
          message: "Please confirm the owner declaration before submitting.",
        });
      }
      return issues;
    }

    default:
      return issues;
  }
}

/** True when the owner may advance from this step. */
export function canAdvance(step: number, d: Partial<ListingFormData>): boolean {
  return validateStep(step, d).length === 0;
}
