import { supabase } from "@/integrations/supabase/client";

export type PropertyStatus =
  | "draft"
  | "pending"
  | "available"
  | "reserved"
  | "rented"
  | "sold"
  | "archived"
  | "rejected";

export type VerificationStatus = "pending" | "verified" | "rejected" | "suspended";

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
  status: PropertyStatus;
  images: string[];
  is_featured: boolean;
  owner_verification_status?: VerificationStatus;
  property_verification_status?: VerificationStatus;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
  phone_verified?: boolean;
  email_verified?: boolean;
  id_verified?: boolean;
  is_zero_brokerage?: boolean;
  is_premium?: boolean;
  created_at: string;
};

// NOTICE: owner_phone and owner_email are strictly EXCLUDED from public queries to enforce PII safety
export const PUBLIC_PROPERTY_COLUMNS =
  "id,title,description,price,city,address,bedrooms,bathrooms,area_sqft,property_type,listing_type,status,images,is_featured,owner_verification_status,property_verification_status,verified_by,verified_at,verification_notes,phone_verified,email_verified,id_verified,is_zero_brokerage,is_premium,created_at";

export const HYDERABAD_FALLBACK_PROPERTIES: Property[] = [
  {
    id: "hyd-000",
    title: "Luxury Duplex Villa in Vinayak Nagar",
    description: "Experience elegant duplex living in the heart of Vinayak Nagar, Madhapur. This spacious home offers premium interiors, designer false ceilings, Italian marble flooring, a large family lounge, modern wooden staircase, multiple seating areas, and a peaceful residential atmosphere just 3 minutes from Hyderabad's IT corridor.",
    price: 45000,
    city: "Hyderabad",
    address: "Vinayak Nagar, Madhapur",
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 2450,
    property_type: "Villa",
    listing_type: "rent",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80"
    ],
    is_featured: true,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "hyd-001",
    title: "Luxury 2 BHK Apartment in Gachibowli",
    description: "Fully furnished 2 BHK flat near Financial District & DLF Cybercity. 24/7 security, power backup, modular kitchen, and reserved car parking.",
    price: 32000,
    city: "Hyderabad",
    address: "Financial District, Gachibowli",
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1250,
    property_type: "Apartment",
    listing_type: "rent",
    status: "available",
    images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80"],
    is_featured: true,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "hyd-002",
    title: "Modern 1 BHK Flat in Madhapur",
    description: "East-facing 1 BHK apartment walking distance from Cyber Towers & Durgam Cheruvu Metro Station. Includes AC, fridge, and high-speed Wi-Fi.",
    price: 22000,
    city: "Hyderabad",
    address: "Near Cyber Towers, Madhapur",
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 750,
    property_type: "Apartment",
    listing_type: "rent",
    status: "available",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80"],
    is_featured: true,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "hyd-003",
    title: "Spacious 3 BHK Gated Community in Kondapur",
    description: "Premium 3 BHK flat in a gated community with swimming pool, gym, clubhouse, and children play area near Botanical Garden.",
    price: 48000,
    city: "Hyderabad",
    address: "Botanical Garden Road, Kondapur",
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 1850,
    property_type: "Apartment",
    listing_type: "rent",
    status: "available",
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80"],
    is_featured: true,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "hyd-004",
    title: "Studio Apartment in Hitech City",
    description: "Cozy 1 Studio flat for IT professionals. Fully furnished with Smart TV, sofa, balcony view, and daily housekeeping optional.",
    price: 18500,
    city: "Hyderabad",
    address: "Mindspace Road, Hitech City",
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 550,
    property_type: "Studio",
    listing_type: "rent",
    status: "available",
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80"],
    is_featured: false,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "hyd-005",
    title: "Executive Luxury PG in Kukatpally",
    description: "Single & sharing air-conditioned rooms for gents and ladies with 3-times North/South Indian food, laundry, and 24/7 security.",
    price: 8500,
    city: "Hyderabad",
    address: "KPHB 5th Phase, Kukatpally",
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 350,
    property_type: "PG",
    listing_type: "rent",
    status: "available",
    images: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&auto=format&fit=crop&q=80"],
    is_featured: false,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "hyd-006",
    title: "Semi-Furnished 2 BHK in Miyapur",
    description: "Quiet residential 2 BHK flat near Miyapur Metro Station & JNTU Road. Well ventilated with wardrobe, lights, fans, and gas pipeline.",
    price: 24000,
    city: "Hyderabad",
    address: "Metro Corridor, Miyapur",
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1100,
    property_type: "Apartment",
    listing_type: "rent",
    status: "available",
    images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=80"],
    is_featured: false,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: false,
    created_at: new Date().toISOString(),
  },
];

export async function fetchPublicProperties(): Promise<Property[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("properties")
      .select(PUBLIC_PROPERTY_COLUMNS)
      .eq("is_approved", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (error || !data || data.length === 0) {
      return HYDERABAD_FALLBACK_PROPERTIES;
    }
    return data as Property[];
  } catch {
    return HYDERABAD_FALLBACK_PROPERTIES;
  }
}

export async function fetchPublicPropertyById(id: string): Promise<Property | null> {
  const fallback = HYDERABAD_FALLBACK_PROPERTIES.find((p) => p.id === id);
  if (fallback) return fallback;
  const { data, error } = await (supabase as any)
    .from("properties")
    .select(PUBLIC_PROPERTY_COLUMNS)
    .eq("id", id)
    .eq("is_approved", true)
    .maybeSingle();
  if (error) return null;
  return (data as Property | null) ?? null;
}

export function isOwnerVerified(property: Property): boolean {
  return (
    property.owner_verification_status === "verified" ||
    Boolean(property.phone_verified && property.email_verified && property.id_verified)
  );
}

export function isPropertyVerified(property: Property): boolean {
  return property.property_verification_status === "verified";
}

export function isNewlyListed(property: Property): boolean {
  const daysOld = Math.floor(
    (Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysOld <= 7;
}
