import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Property = {
  id: string;
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
  status: string;
  images: string[];
  is_featured: boolean;
  created_at: string;
};

const PUBLIC_COLUMNS =
  "id,title,description,price,city,address,bedrooms,bathrooms,area_sqft,property_type,listing_type,status,images,is_featured,created_at";

export async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await (supabase as any)
    .from("properties")
    .select(PUBLIC_COLUMNS)
    .eq("is_approved", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Property[];
}

export async function fetchProperty(id: string): Promise<Property | null> {
  const { data, error } = await (supabase as any)
    .from("properties")
    .select(PUBLIC_COLUMNS)
    .eq("id", id)
    .eq("is_approved", true)
    .maybeSingle();
  if (error) throw error;
  return (data as Property | null) ?? null;
}

export function formatPrice(price: number, listingType: "rent" | "sale"): string {
  const n = Number(price);
  const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  if (listingType === "rent") return `₹${inr.format(n)}/mo`;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${inr.format(n)}`;
}

// silence unused Database import when strict
export type _Db = Database;