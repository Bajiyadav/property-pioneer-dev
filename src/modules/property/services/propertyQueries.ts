import type { Database } from "@/integrations/supabase/types";
import {
  type Property,
  type PropertyStatus,
  type PropertyFeed,
  type VerificationStatus,
  fetchPublicProperties,
  fetchPublicPropertyFeed,
  fetchPublicPropertyById,
  type PropertySearchParams,
} from "@/modules/property/services/propertyService";

export type { Property, PropertyStatus, PropertyFeed, VerificationStatus, PropertySearchParams };

export async function fetchProperties(params?: PropertySearchParams): Promise<Property[]> {
  return fetchPublicProperties(params);
}

/** Listings plus provenance — used by dashboards to flag seed data. */
export async function fetchPropertyFeed(): Promise<PropertyFeed> {
  return fetchPublicPropertyFeed();
}

export async function fetchProperty(id: string): Promise<Property | null> {
  return fetchPublicPropertyById(id);
}

/**
 * `listing_type` is a free-text column in Postgres, so anything read from the
 * database arrives as `string`. Narrow it once here rather than casting at each
 * call site — an unknown value formats as a sale price instead of throwing.
 */
export type ListingType = "rent" | "sale";

export function toListingType(value: string | null | undefined): ListingType {
  return value === "rent" ? "rent" : "sale";
}

export function formatPrice(price: number, listingType: ListingType | string): string {
  const n = Number(price);
  const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  if (toListingType(String(listingType)) === "rent") return `₹${inr.format(n)}/mo`;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${inr.format(n)}`;
}

/** Drops a trailing ".0" so 1.5 stays "1.5" but 2.0 reads "2". */
function trimTrailingZero(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

/**
 * Price for a narrow, fixed-width stat cell — the three-column row on
 * `PropertyCard`, where each column is roughly 90px on a 360px phone.
 *
 * Deliberately different from `formatPrice` in two ways, both forced by that
 * width:
 *
 * 1. No "/mo" suffix. The cell's own label directly underneath already reads
 *    "Rent/Month", so "₹48,000/mo" states the period twice while producing the
 *    widest string in the row — the thing that was overflowing on mobile.
 *
 * 2. Lakh/crore shortening applies to rent as well as sale. `formatPrice` only
 *    shortens sale prices, so a ₹1,50,000 rental produced a 12-character string
 *    that no 90px column can hold at any readable font size.
 *
 * It also rounds honestly. The card used to hard-code
 * `(deposit / 100000).toFixed(1) + "L"`, which rendered a ₹96,000 deposit as
 * "₹1.0L" — reading as a lakh when it is not one. Values below a lakh now show
 * in full.
 */
export function formatPriceCompact(price: number, listingType: ListingType | string): string {
  void listingType; // Same shape for rent and sale; kept for call-site symmetry.
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return "N/A";
  if (n >= 10000000) return `₹${trimTrailingZero(n / 10000000)}Cr`;
  if (n >= 100000) return `₹${trimTrailingZero(n / 100000)}L`;
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}`;
}

import { supabase } from "@/integrations/supabase/client";

export async function fetchOwnerContact(
  propertyId: string,
  turnstileToken?: string,
): Promise<{ ok: boolean; whatsappUrl?: string; error?: string }> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const res = await fetch(`/api/public/properties/${propertyId}/contact`, {
      method: "POST",
      headers,
      body: JSON.stringify({ turnstileToken }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Failed to generate contact request." };
    return { ok: true, whatsappUrl: data.whatsappUrl };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error." };
  }
}

// silence unused Database import when strict
export type _Db = Database;
