import { supabase } from "@/integrations/supabase/client";
import { createSchemaCapability, isExtendedColumnUnavailable } from "./propertySchema";

/** Typed client — `Database` is generated from the live schema. */
const db = supabase;

export type PropertyStatus =
  "draft" | "pending" | "available" | "reserved" | "rented" | "sold" | "archived" | "rejected";

export type VerificationStatus = "pending" | "verified" | "rejected" | "suspended";

export type Property = {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  pincode?: string | null;
  /**
   * Exact street address — SENSITIVE. Deliberately NOT in the public column
   * grant/select, so the public payload never carries it. It is released only
   * by /api/public/properties/location-access after a matching city+locality,
   * the same way owner_phone is gated by the contact endpoint. Hence optional.
   */
  address?: string | null;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  property_type: string;
  listing_type: "rent" | "sale";
  status: PropertyStatus;
  images: string[];
  is_featured: boolean;
  video_url?: string | null;
  video_status?: "pending" | "approved" | "rejected";
  locality?: string | null;
  landmark?: string | null;
  /**
   * Approximate map position, rounded to ~110 m by a generated column.
   * The exact latitude/longitude are deliberately absent from this type:
   * they are not granted to anon or authenticated, so no public query can
   * return them. See migration 20260822143802.
   */
  approx_latitude?: number | null;
  approx_longitude?: number | null;
  metro_station?: string | null;
  it_park?: string | null;
  college?: string | null;
  hospital?: string | null;
  /** Moderation gate — RLS only exposes approved listings publicly. */
  is_approved?: boolean;
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
  deposit?: number;
  maintenance?: number;
  maintenance_included?: boolean;
  furnishing_status?: "fully-furnished" | "semi-furnished" | "unfurnished";
  amenities?: string[];
  admin_notes?: string;
  /**
   * Media moderation, written by admins and area agents through
   * PropertyMediaModal. Not in EXTENDED_PROPERTY_COLUMNS on purpose: these are
   * staff fields and are not granted to anon, so a public select naming them
   * would fail with 42501.
   */
  media_status?: "pending_review" | "verified" | "needs_reshoot" | null;
  media_notes?: string | null;
  owner_id?: string;
  floor_number?: string;
  total_rooms?: number;
  attached_bathroom?: boolean;
  preferred_tenant?: string[];
  food_preference?: string;
  lease_duration?: string;
  pet_policy?: boolean;
  owner_type?: string;
  property_age?: string;
  total_floors?: number;
  exact_floor?: number;
  balconies?: number;
  parking_covered?: number;
  parking_open?: number;
  facing?: string;
  available_from?: string;
  rent_negotiable?: boolean;
};

/**
 * Columns the anon/authenticated roles are actually granted on `public.properties`
 * (see migration 20260730043953). owner_phone / owner_name / owner_email exist but
 * are deliberately NOT granted — PII stays server-side behind the contact endpoint.
 *
 * The verification columns from 20260806000000_enterprise_property_schema.sql are
 * NOT selected here: that migration has not been applied to the live database, and
 * naming a non-existent column makes PostgREST reject the whole query with a 400,
 * which silently collapsed every listing query onto the hard-coded fallback data.
 * They are re-attached with safe defaults by `withVerificationDefaults` below and
 * will start flowing through automatically once the migration lands.
 */
// `address` and `landmark` are SENSITIVE and intentionally excluded from the
// public select (like owner_phone) — the exact address is released only by
// /api/public/properties/location-access after a matching city+locality. The
// coarse `locality`/`city` stay public for browsing and SEO.
const BASE_PROPERTY_COLUMNS =
  "id,title,description,price,city,bedrooms,bathrooms,area_sqft,property_type,listing_type,status,images,is_featured,created_at";

const EXTENDED_PROPERTY_COLUMNS =
  "pincode,approx_latitude,approx_longitude,video_url,video_status,video_urls,locality,metro_station,it_park,college,hospital,property_age,total_floors,exact_floor,balconies,parking_covered,parking_open,facing,available_from,rent_negotiable,project_name,bhk_type,area_unit,deposit,maintenance,furnishing_status";

export const PUBLIC_PROPERTY_COLUMNS = `${BASE_PROPERTY_COLUMNS},${EXTENDED_PROPERTY_COLUMNS}`;

/** See `propertySchema.ts` for why this detection exists. */
const schema = createSchemaCapability("properties");

function shouldTryExtended(): boolean {
  return schema.shouldTry();
}

function propertyColumns(useExtended: boolean): string {
  return useExtended ? PUBLIC_PROPERTY_COLUMNS : BASE_PROPERTY_COLUMNS;
}

/** Test seam — lets a suite assert both schema states deterministically. */
export function __resetPropertySchemaProbe() {
  schema.reset();
}

/** Reports what the last query observed: true, false, or null when untested. */
export function propertySchemaHasExtendedColumns(): boolean | null {
  return schema.state();
}

/** Shape PostgREST returns for the granted column set. */
type PropertyRow = Omit<
  Property,
  | "owner_verification_status"
  | "property_verification_status"
  | "verified_by"
  | "verified_at"
  | "verification_notes"
  | "phone_verified"
  | "email_verified"
  | "id_verified"
  | "is_zero_brokerage"
  | "is_premium"
> &
  Partial<Property>;

/**
 * Normalises a database row into a full `Property`. Verification flags default to
 * the conservative "pending / unverified" state so a missing column can never make
 * an unverified listing look verified.
 */
function withVerificationDefaults(row: PropertyRow): Property {
  return {
    ...row,
    images: Array.isArray(row.images) ? row.images : [],
    owner_verification_status: row.owner_verification_status ?? "pending",
    property_verification_status: row.property_verification_status ?? "pending",
    phone_verified: row.phone_verified ?? false,
    email_verified: row.email_verified ?? false,
    id_verified: row.id_verified ?? false,
    is_zero_brokerage: row.is_zero_brokerage ?? true,
    is_premium: row.is_premium ?? false,
    video_url: row.video_status === "approved" ? row.video_url : null,
  } as Property;
}

/**
 * Fixed timestamps for the seed rows.
 *
 * These were `new Date().toISOString()`, evaluated when the module was first
 * imported — which happens at a different instant on the server than in the
 * browser. Any component deriving output from `created_at` (relative times, the
 * "Newly Listed" badge) therefore rendered different text on each side and broke
 * hydration. Constants keep SSR and the client byte-identical.
 */
const SEED_CREATED_AT = [
  "2026-08-01T09:00:00.000Z",
  "2026-07-30T09:00:00.000Z",
  "2026-07-28T09:00:00.000Z",
  "2026-07-25T09:00:00.000Z",
  "2026-07-22T09:00:00.000Z",
  "2026-07-18T09:00:00.000Z",
] as const;

export const HYDERABAD_FALLBACK_PROPERTIES: Property[] = [
  {
    id: "hyd-000",
    title: "Luxury Duplex Villa in Vinayak Nagar",
    description:
      "Experience elegant duplex living in the heart of Vinayak Nagar, Madhapur. This spacious home offers premium interiors, designer false ceilings, Italian marble flooring, a large family lounge, modern wooden staircase, multiple seating areas, and a peaceful residential atmosphere just 3 minutes from Hyderabad's IT corridor.",
    price: 45000,
    city: "Hyderabad",
    locality: "Madhapur",
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
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80",
    ],
    is_featured: true,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: true,
    created_at: SEED_CREATED_AT[0],
  },
  {
    id: "hyd-001",
    title: "Luxury 2 BHK Apartment in Gachibowli",
    description:
      "Fully furnished 2 BHK flat near Financial District & DLF Cybercity. 24/7 security, power backup, modular kitchen, and reserved car parking.",
    price: 32000,
    city: "Hyderabad",
    locality: "Gachibowli",
    address: "Financial District, Gachibowli",
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1250,
    property_type: "Apartment",
    listing_type: "rent",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
    ],
    is_featured: true,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: true,
    created_at: SEED_CREATED_AT[1],
  },
  {
    id: "hyd-002",
    title: "Modern 1 BHK Flat in Madhapur",
    description:
      "East-facing 1 BHK apartment walking distance from Cyber Towers & Durgam Cheruvu Metro Station. Includes AC, fridge, and high-speed Wi-Fi.",
    price: 22000,
    city: "Hyderabad",
    locality: "Madhapur",
    address: "Near Cyber Towers, Madhapur",
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 750,
    property_type: "Apartment",
    listing_type: "rent",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
    ],
    is_featured: true,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: true,
    created_at: SEED_CREATED_AT[2],
  },
  {
    id: "hyd-003",
    title: "Spacious 3 BHK Gated Community in Kondapur",
    description:
      "Premium 3 BHK flat in a gated community with swimming pool, gym, clubhouse, and children play area near Botanical Garden.",
    price: 48000,
    city: "Hyderabad",
    locality: "Kondapur",
    address: "Botanical Garden Road, Kondapur",
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 1850,
    property_type: "Apartment",
    listing_type: "rent",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
    ],
    is_featured: true,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: true,
    created_at: SEED_CREATED_AT[3],
  },
  {
    id: "hyd-004",
    title: "Studio Apartment in Hitech City",
    description:
      "Cozy 1 Studio flat for IT professionals. Fully furnished with Smart TV, sofa, balcony view, and daily housekeeping optional.",
    price: 18500,
    city: "Hyderabad",
    locality: "Hitech City",
    address: "Mindspace Road, Hitech City",
    bedrooms: 1,
    bathrooms: 1,
    area_sqft: 550,
    property_type: "Studio",
    listing_type: "rent",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80",
    ],
    is_featured: false,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: false,
    created_at: SEED_CREATED_AT[4],
  },
  {
    id: "hyd-006",
    title: "Semi-Furnished 2 BHK in Miyapur",
    description:
      "Quiet residential 2 BHK flat near Miyapur Metro Station & JNTU Road. Well ventilated with wardrobe, lights, fans, and gas pipeline.",
    price: 24000,
    city: "Hyderabad",
    locality: "Miyapur",
    address: "Metro Corridor, Miyapur",
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1100,
    property_type: "Apartment",
    listing_type: "rent",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=80",
    ],
    is_featured: false,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: false,
    created_at: SEED_CREATED_AT[5],
  },
  {
    id: "hyd-sale-001",
    title: "Premium 3 BHK Apartment in Gachibowli",
    description:
      "Stunning 3 BHK flat for sale in a premier high-rise society in Gachibowli, close to Outer Ring Road (ORR). Premium modular kitchen, spacious balconies with skyline views, 24/7 security, and world-class amenities.",
    price: 12500000,
    city: "Hyderabad",
    locality: "Gachibowli",
    address: "Vasavi GP Trends, Gachibowli",
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 1850,
    property_type: "Apartment",
    listing_type: "sale",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
    ],
    is_featured: true,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: true,
    created_at: SEED_CREATED_AT[0],
  },
  {
    id: "hyd-sale-002",
    title: "Luxury 4 BHK Villa in Kokapet",
    description:
      "Exquisite 4 BHK ultra-luxury independent villa for sale in Kokapet's most exclusive gated community. Italian marble, private garden, home automation, double-height ceiling, and 3 covered car parking spaces.",
    price: 38000000,
    city: "Hyderabad",
    locality: "Kokapet",
    address: "Neopolis Corridor, Kokapet",
    bedrooms: 4,
    bathrooms: 4,
    area_sqft: 4200,
    property_type: "Villa",
    listing_type: "sale",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80",
    ],
    is_featured: true,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: true,
    created_at: SEED_CREATED_AT[1],
  },
  {
    id: "hyd-sale-003",
    title: "Modern 2 BHK Flat in Kondapur",
    description:
      "Well-designed 2 BHK apartment for sale in Kondapur, close to Botanical Gardens. Features excellent cross-ventilation, lift, security, modular wardrobes, and close proximity to major IT parks.",
    price: 8500000,
    city: "Hyderabad",
    locality: "Kondapur",
    address: "Silpa Layout, Kondapur",
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1200,
    property_type: "Apartment",
    listing_type: "sale",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
    ],
    is_featured: false,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: false,
    created_at: SEED_CREATED_AT[2],
  },
  {
    id: "hyd-sale-004",
    title: "Spacious 3 BHK Apartment in Madhapur",
    description:
      "Semi-furnished 3 BHK flat for sale in Madhapur. Located walking distance to Cyber Towers and Durgam Cheruvu metro station. Unmatched location convenience, lift, and power backup.",
    price: 14500000,
    city: "Hyderabad",
    locality: "Madhapur",
    address: "Kavuri Hills, Madhapur",
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 1950,
    property_type: "Apartment",
    listing_type: "sale",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
    ],
    is_featured: false,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: false,
    created_at: SEED_CREATED_AT[3],
  },
  {
    id: "hyd-comm-001",
    title: "Grade-A Commercial Office Space in Hitech City",
    description:
      "Fully fitted Grade-A commercial office space for rent in Hitech City's prime tech park corridor. 100 workstations, 4 manager cabins, conference room, double power backup, central AC, and 10 parking slots.",
    price: 180000,
    city: "Hyderabad",
    locality: "Hitech City",
    address: "Mindspace Tech Park, Hitech City",
    bedrooms: 0,
    bathrooms: 2,
    area_sqft: 3500,
    property_type: "Commercial",
    listing_type: "rent",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80",
    ],
    is_featured: true,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: true,
    created_at: SEED_CREATED_AT[0],
  },
  {
    id: "hyd-comm-002",
    title: "Prime Corner Retail Shop in Madhapur",
    description:
      "High-visibility corner retail storefront for rent on main Madhapur 100 Feet Road. Premium glass frontage, high footfall zone, suitable for premium brands, cafes, or boutiques.",
    price: 95000,
    city: "Hyderabad",
    locality: "Madhapur",
    address: "100 Feet Road, Madhapur",
    bedrooms: 0,
    bathrooms: 1,
    area_sqft: 850,
    property_type: "Commercial",
    listing_type: "rent",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1555529669-e69e7aa0db9a?w=1200&auto=format&fit=crop&q=80",
    ],
    is_featured: true,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: true,
    created_at: SEED_CREATED_AT[1],
  },
  {
    id: "hyd-comm-003",
    title: "Premium Commercial Building in Gachibowli",
    description:
      "Fully independent commercial building for sale in Gachibowli. Ideal for corporate offices, banks, clinics, or upscale showrooms. Features high floor height, lift, and front road access.",
    price: 150000000,
    city: "Hyderabad",
    locality: "Gachibowli",
    address: "ORR Junction, Gachibowli",
    bedrooms: 0,
    bathrooms: 6,
    area_sqft: 12000,
    property_type: "Commercial",
    listing_type: "sale",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
    ],
    is_featured: false,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: false,
    created_at: SEED_CREATED_AT[2],
  },
  {
    id: "hyd-comm-004",
    title: "Boutique Office Suite in Financial District",
    description:
      "Modern boutique office suite for rent in the Financial District. Fully air-conditioned, 25 workstations, pantry, conference room, and high-speed elevator access.",
    price: 250000,
    city: "Hyderabad",
    locality: "Financial District",
    address: "ISB Road, Financial District",
    bedrooms: 0,
    bathrooms: 2,
    area_sqft: 5000,
    property_type: "Commercial",
    listing_type: "rent",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&auto=format&fit=crop&q=80",
    ],
    is_featured: false,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: false,
    created_at: SEED_CREATED_AT[3],
  },
];

export const BANGALORE_FALLBACK_PROPERTIES: Property[] = [
  {
    id: "blr-001",
    title: "Modern 2 BHK in Koramangala 4th Block",
    description:
      "Well-lit 2 BHK rental apartment near Sony World Junction and 80 Feet Road. Premium wood flooring, modular kitchen, power backup, and dedicated parking.",
    price: 42000,
    city: "Bangalore",
    locality: "Koramangala",
    address: "4th Block, Koramangala",
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1200,
    property_type: "Apartment",
    listing_type: "rent",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
    ],
    is_featured: true,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: true,
    created_at: SEED_CREATED_AT[1],
  },
  {
    id: "blr-002",
    title: "Luxury 3 BHK Penthouse in Indiranagar",
    description:
      "Spacious 3 BHK home on 100 Feet Road, Indiranagar. Walking distance from 12th Main food street & CMH Road Metro Station.",
    price: 65000,
    city: "Bangalore",
    locality: "Indiranagar",
    address: "100 Feet Road, Indiranagar",
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 2100,
    property_type: "Apartment",
    listing_type: "rent",
    status: "available",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
    ],
    is_featured: true,
    owner_verification_status: "verified",
    property_verification_status: "verified",
    phone_verified: true,
    email_verified: true,
    id_verified: true,
    is_zero_brokerage: true,
    is_premium: true,
    created_at: SEED_CREATED_AT[2],
  },
];

export const ALL_FALLBACK_PROPERTIES: Property[] = [
  ...HYDERABAD_FALLBACK_PROPERTIES,
  ...BANGALORE_FALLBACK_PROPERTIES,
];

export const FALLBACK_PROPERTIES = HYDERABAD_FALLBACK_PROPERTIES;

/** Where a listing set came from — lets the UI be honest about demo data. */
export type PropertySource = "database" | "fallback";

export interface PropertyFeed {
  properties: Property[];
  totalCount?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  source: PropertySource;
  /** Populated when the database query failed and the fallback was used. */
  error: string | null;
}

/**
 * Loads approved listings with their provenance.
 *
 * A failed or empty query still yields a usable list, but `source: "fallback"`
 * lets callers show a banner instead of passing seed data off as live records.
 */
export interface PropertySearchParams {
  q?: string;
  state?: string;
  city?: string;
  listing?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  beds?: number;
  baths?: number;
  type?: string;
  locality?: string;
  status?: PropertyStatus;
  sort?: "recommended" | "newest" | "lowest_rent" | "highest_rent" | "largest_area";
  tenantType?: string;
  furnishing?: string;
  amenities?: string[];
  page?: number;
  limit?: number;
}

/**
 * Builds the public feed query.
 *
 * `useExtended` covers both the selected columns *and* the filters: `locality`
 * and `landmark` are filtered and text-searched, so a query that merely trimmed
 * the select list would still reference missing columns and still 400.
 */
function buildFeedQuery(params: PropertySearchParams | undefined, useExtended: boolean) {
  let query = db
    .from("properties")
    .select(propertyColumns(useExtended), { count: "exact" })
    .eq("is_approved", true);

  if (params) {
    const city = params.city?.trim();
    if (city) query = query.ilike("city", `%${city}%`);

    const listing = params.listing?.trim();
    if (listing) query = query.ilike("listing_type", `%${listing}%`);

    const status = params.status?.trim();
    if (status) query = query.eq("status", status);

    if (params.beds && params.beds > 0) query = query.gte("bedrooms", params.beds);
    if (params.baths && params.baths > 0) query = query.gte("bathrooms", params.baths);

    const type = params.type?.trim();
    if (type) query = query.ilike("property_type", `%${type}%`);

    const locality = params.locality?.trim();
    if (locality && useExtended) query = query.ilike("locality", `%${locality}%`);

    if (params.minPrice && params.minPrice > 0) query = query.gte("price", params.minPrice);
    if (params.maxPrice && params.maxPrice > 0) query = query.lte("price", params.maxPrice);

    if (params.minArea && params.minArea > 0) query = query.gte("area_sqft", params.minArea);
    if (params.maxArea && params.maxArea > 0) query = query.lte("area_sqft", params.maxArea);

    const q = params.q?.trim().replace(/[%_]/g, "");
    if (q) {
      // `address` is intentionally NOT searched: it is sensitive and excluded
      // from the public grant, so filtering on it would both leak intent and
      // (once the column grant is revoked) fail for anon. Locality covers area
      // search below.
      const columns = ["title", "city", "description"];
      if (useExtended) columns.push("locality");
      query = query.or(columns.map((c) => `${c}.ilike.%${q}%`).join(","));
    }
  }

  // Apply sorting
  if (params?.sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (params?.sort === "lowest_rent") {
    query = query.order("price", { ascending: true });
  } else if (params?.sort === "highest_rent") {
    query = query.order("price", { ascending: false });
  } else if (params?.sort === "largest_area") {
    query = query.order("area_sqft", { ascending: false });
  } else {
    // Default / "recommended"
    query = query
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
  }

  // Apply pagination / range bounds if pagination parameters are provided
  if (params?.page || params?.limit) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  }

  return query;
}

export async function fetchPublicPropertyFeed(
  params?: PropertySearchParams,
): Promise<PropertyFeed> {
  const page = Math.max(1, params?.page || 1);
  const limit = Math.max(1, Math.min(100, params?.limit || 20));

  try {
    const tryExtended = shouldTryExtended();
    let { data, count, error } = await buildFeedQuery(params, tryExtended);

    if (error && tryExtended && isExtendedColumnUnavailable(error)) {
      // The video/location migration has not been applied to this database.
      // Latch the capability off and serve the query the schema can answer.
      schema.record(false);
      ({ data, count, error } = await buildFeedQuery(params, false));
    } else if (!error && tryExtended) {
      schema.record(true);
    }

    if (error) {
      console.error("[properties] query failed", error);
      const q = params?.q?.toLowerCase();
      const loc = params?.locality?.toLowerCase();
      const city = params?.city?.toLowerCase();
      const filtered = ALL_FALLBACK_PROPERTIES.filter((p) => {
        if (city && p.city.toLowerCase() !== city) return false;
        if (loc && !(p.locality?.toLowerCase().includes(loc) ?? false)) return false;
        if (params?.listing && p.listing_type !== params.listing) return false;
        if (params?.type) {
          const typeLower = params.type.toLowerCase();
          if (typeLower === "commercial") {
            const isCommercial =
              p.property_type?.toLowerCase() === "commercial" ||
              p.title?.toLowerCase().includes("commercial") ||
              p.description?.toLowerCase().includes("office");
            if (!isCommercial) return false;
          } else {
            if (!p.property_type?.toLowerCase().includes(typeLower)) return false;
          }
        }
        if (
          q &&
          !p.title.toLowerCase().includes(q) &&
          !p.description.toLowerCase().includes(q) &&
          !(p.locality?.toLowerCase().includes(q) ?? false) &&
          !(p.address?.toLowerCase().includes(q) ?? false)
        ) {
          return false;
        }
        return true;
      });

      const totalCount = filtered.length;
      const paginated =
        params?.page || params?.limit ? filtered.slice((page - 1) * limit, page * limit) : filtered;

      return {
        properties: paginated,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
        source: "fallback",
        error: error.message,
      };
    }

    const totalCount = count ?? (data?.length || 0);

    if (!data || data.length === 0) {
      return {
        properties: [],
        totalCount: totalCount || 0,
        page,
        limit,
        totalPages: Math.ceil((totalCount || 0) / limit) || 1,
        source: "database",
        error: null,
      };
    }
    return {
      properties: (data as unknown as PropertyRow[]).map(withVerificationDefaults),
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      source: "database",
      error: null,
    };
  } catch (err) {
    console.error("[properties] unreachable", err);
    return {
      properties: [],
      totalCount: 0,
      page,
      limit,
      totalPages: 1,
      source: "fallback",
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function fetchPublicProperties(params?: PropertySearchParams): Promise<Property[]> {
  const feed = await fetchPublicPropertyFeed(params);

  // The public site never shows seed listings as if they were real inventory.
  //
  // fetchPublicPropertyFeed falls back to ALL_FALLBACK_PROPERTIES when the query
  // fails, and marks the result `source: "fallback"` so the caller can say so.
  // The three dashboards honour that and render a "Showing sample data" banner.
  // This function dropped the marker on the floor, and it is what every public
  // surface uses — /properties, the home page, and all the rent/buy/commercial
  // city and locality pages. So a failed query showed visitors fourteen invented
  // Hyderabad listings, indistinguishable from real ones.
  //
  // A mislabelled metrics panel is a cosmetic problem; a fabricated listing is
  // not. It is clickable, it has a detail page, and a visitor can try to enquire
  // about a home that does not exist. An empty result is the honest answer, and
  // the search UI already has a good empty state for it.
  //
  // The feed itself is unchanged, so the dashboards keep their labelled data.
  if (feed.source === "fallback") {
    console.error(
      "[properties] public query failed; serving an empty result rather than seed listings",
      feed.error,
    );
    return [];
  }

  return feed.properties;
}

export async function fetchPublicPropertyById(id: string): Promise<Property | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (isUuid) {
    const detailQuery = (useExtended: boolean) =>
      db
        .from("properties")
        .select(propertyColumns(useExtended))
        .eq("id", id)
        .eq("is_approved", true)
        .maybeSingle();

    try {
      const tryExtended = shouldTryExtended();
      let { data, error } = await detailQuery(tryExtended);

      if (error && tryExtended && isExtendedColumnUnavailable(error)) {
        schema.record(false);
        ({ data, error } = await detailQuery(false));
      } else if (!error && tryExtended) {
        schema.record(true);
      }

      if (!error && data) return withVerificationDefaults(data as unknown as PropertyRow);
      if (error) console.error("[properties] detail query failed", error);
    } catch (err) {
      console.error("[properties] detail unreachable", err);
    }
  }

  // Seed listings keep the demo links (e.g. /properties/hyd-000) working.
  return ALL_FALLBACK_PROPERTIES.find((p) => p.id === id) ?? null;
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
    (Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24),
  );
  return daysOld <= 7;
}
