import type { Database } from "@/integrations/supabase/types";
import {
  type Property,
  type PropertyStatus,
  type PropertyFeed,
  type VerificationStatus,
  fetchPublicProperties,
  fetchPublicPropertyFeed,
  fetchPublicPropertyById,
} from "@/modules/property/services/propertyService";

export type { Property, PropertyStatus, PropertyFeed, VerificationStatus };

export async function fetchProperties(): Promise<Property[]> {
  return fetchPublicProperties();
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

export async function fetchOwnerContact(
  propertyId: string,
  turnstileToken?: string,
): Promise<{ ok: boolean; whatsappUrl?: string; error?: string }> {
  try {
    const res = await fetch(`/api/public/properties/${propertyId}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
