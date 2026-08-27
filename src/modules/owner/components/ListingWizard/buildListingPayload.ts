import type { ListingFormData } from "./types";

/**
 * Maps wizard state onto the payload `createListing` accepts.
 *
 * Kept as a pure function, separate from the submit handler, because the server
 * contract has minimum lengths and numeric floors that the wizard's own defaults
 * do not automatically satisfy. A mismatch surfaces as a validation rejection at
 * step 6 of 6 — the worst possible place to discover it — so the mapping is
 * derived here and unit-tested against the same constraints the server enforces.
 */

export interface ListingPayload {
  title: string;
  description: string;
  price: number;
  city: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  property_type: string;
  listing_type: "rent" | "sale";
  owner_phone: string;
  owner_name?: string | null;
  images: string[];
  status?: "draft" | "available";
  locality?: string | null;
  landmark?: string | null;
  balconies?: number | null;
  exact_floor?: number | null;
  total_floors?: number | null;
  property_age?: string | null;
  facing?: string | null;
  parking_covered?: number | null;
  parking_open?: number | null;
  pincode?: string | null;
  available_from?: string | null;
  rent_negotiable?: boolean | null;
}

export interface PayloadProblem {
  field: string;
  message: string;
}

export type BuildResult =
  { ok: true; payload: ListingPayload } | { ok: false; problems: PayloadProblem[] };

/** Server floor: title must be at least 8 characters. */
function deriveTitle(d: ListingFormData): string {
  const supplied = (d.title ?? "").trim();
  if (supplied.length >= 8) return supplied.slice(0, 140);
  const size = d.bhk_type?.trim() || `${d.bedrooms} BHK`;
  const where = d.locality?.trim() || d.city?.trim() || "Hyderabad";
  return `${size} ${d.property_type || "Apartment"} in ${where}`.slice(0, 140);
}

/** Server floor: description must be at least 20 characters. */
function deriveDescription(d: ListingFormData): string {
  const supplied = (d.description ?? "").trim();
  if (supplied.length >= 20) return supplied.slice(0, 4000);
  const size = d.bhk_type?.trim() || `${d.bedrooms} BHK`;
  const where = [d.locality?.trim(), d.city?.trim()].filter(Boolean).join(", ");
  const text = `${size} ${d.property_type || "property"}${where ? ` in ${where}` : ""}. ${
    d.furnishing_status || "Unfurnished"
  }, ${d.area_sqft || 0} ${d.area_unit || "Sq.ft"}.`;
  // Padded rather than truncated: a generated description below the server's
  // floor would fail validation for a reason the owner cannot see or fix.
  return (text.length >= 20 ? text : `${text} Contact the owner for more details.`).slice(0, 4000);
}

/** Only real http(s) URLs — the schema requires them, and caps the count at 12. */
function usableImages(images: string[] | undefined): string[] {
  return (images ?? [])
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s))
    .slice(0, 12);
}

/**
 * A draft is held to a lower bar than a submission on purpose: someone saving
 * halfway through has not finished, and refusing to save their work because the
 * price is still blank would lose it. Only the fields the server cannot default
 * are required for a draft.
 */
export function buildListingPayload(
  d: ListingFormData,
  mode: "draft" | "submit" = "submit",
): BuildResult {
  const problems: PayloadProblem[] = [];

  const phone = (d.owner_phone ?? "").replace(/\D/g, "").replace(/^91/, "");
  if (!/^[6-9]\d{9}$/.test(phone)) {
    problems.push({
      field: "owner_phone",
      message: "Enter a valid 10-digit mobile number — enquiries are delivered to it.",
    });
  }

  const city = (d.city ?? "").trim();
  if (city.length < 2) problems.push({ field: "city", message: "City is required." });

  const address = ((d.address ?? "").trim() || (d.locality ?? "").trim()).slice(0, 200);
  if (address.length < 3) {
    problems.push({ field: "address", message: "Enter a locality or address." });
  }

  const price = Number(d.price);
  const area = Math.trunc(Number(d.area_sqft));

  if (mode === "submit") {
    if (!Number.isFinite(price) || price <= 0) {
      problems.push({ field: "price", message: "Enter the expected rent or price." });
    }
    if (!Number.isFinite(area) || area < 50) {
      problems.push({ field: "area_sqft", message: "Built-up area must be at least 50 sq.ft." });
    }
  }

  if (problems.length > 0) return { ok: false, problems };

  return {
    ok: true,
    payload: {
      title: deriveTitle(d),
      description: deriveDescription(d),
      // Drafts may legitimately have no price yet; the column is NOT NULL, so a
      // placeholder of 1 keeps the row valid without implying a real figure.
      price: Number.isFinite(price) && price > 0 ? price : 1,
      city,
      address,
      bedrooms: Math.max(0, Math.trunc(Number(d.bedrooms) || 0)),
      // Floor of 1: a home with no bathroom is a data-entry slip, not a listing.
      bathrooms: Math.max(1, Math.trunc(Number(d.bathrooms) || 1)),
      area_sqft: Number.isFinite(area) && area >= 50 ? area : 50,
      property_type: (d.property_type ?? "Apartment").trim(),
      listing_type: d.listing_type === "sale" ? "sale" : "rent",
      owner_phone: phone,
      owner_name: d.owner_name?.trim() || null,
      images: usableImages(d.images),
      status: mode === "draft" ? "draft" : "available",
      locality: d.locality?.trim() || null,
      landmark: d.landmark?.trim() || null,
      balconies:
        d.balconies !== undefined && d.balconies !== null && !isNaN(Number(d.balconies))
          ? Math.max(0, Math.trunc(Number(d.balconies)))
          : null,
      exact_floor:
        d.exact_floor !== undefined && d.exact_floor !== null && !isNaN(Number(d.exact_floor))
          ? Math.trunc(Number(d.exact_floor))
          : null,
      total_floors:
        d.total_floors !== undefined && d.total_floors !== null && !isNaN(Number(d.total_floors))
          ? Math.max(0, Math.trunc(Number(d.total_floors)))
          : null,
      property_age: d.property_age?.trim() || null,
      facing: d.facing?.trim() || null,
      parking_covered:
        d.parking_covered !== undefined &&
        d.parking_covered !== null &&
        !isNaN(Number(d.parking_covered))
          ? Math.max(0, Math.trunc(Number(d.parking_covered)))
          : null,
      parking_open:
        d.parking_open !== undefined && d.parking_open !== null && !isNaN(Number(d.parking_open))
          ? Math.max(0, Math.trunc(Number(d.parking_open)))
          : null,
      pincode: d.pincode?.trim() || null,
      available_from: d.available_from?.trim() || null,
      rent_negotiable: typeof d.rent_negotiable === "boolean" ? d.rent_negotiable : null,
    },
  };
}
