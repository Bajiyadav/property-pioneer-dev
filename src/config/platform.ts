/**
 * URF platform configuration — the single source of truth for expansion.
 *
 * Multi-city / multi-state / multi-language / franchise growth is data, not
 * code: add an entry here and the rest of the platform picks it up.
 */

export interface CityConfig {
  slug: string;
  name: string;
  state: string;
  /** Cities can be launched independently as the franchise model rolls out. */
  live: boolean;
}

export const STATES = [
  "Maharashtra",
  "Karnataka",
  "Telangana",
  "Tamil Nadu",
  "Delhi NCR",
  "West Bengal",
  "Gujarat",
  "Rajasthan",
  "Kerala",
  "Punjab",
] as const;

export const CITIES: CityConfig[] = [
  { slug: "mumbai", name: "Mumbai", state: "Maharashtra", live: true },
  { slug: "pune", name: "Pune", state: "Maharashtra", live: true },
  { slug: "bengaluru", name: "Bengaluru", state: "Karnataka", live: true },
  { slug: "hyderabad", name: "Hyderabad", state: "Telangana", live: true },
  { slug: "chennai", name: "Chennai", state: "Tamil Nadu", live: true },
  { slug: "delhi", name: "Delhi", state: "Delhi NCR", live: true },
  { slug: "gurugram", name: "Gurugram", state: "Delhi NCR", live: true },
  { slug: "noida", name: "Noida", state: "Delhi NCR", live: true },
  { slug: "kolkata", name: "Kolkata", state: "West Bengal", live: true },
  { slug: "ahmedabad", name: "Ahmedabad", state: "Gujarat", live: true },
  { slug: "jaipur", name: "Jaipur", state: "Rajasthan", live: true },
  { slug: "kochi", name: "Kochi", state: "Kerala", live: true },
  { slug: "chandigarh", name: "Chandigarh", state: "Punjab", live: false },
];

export const LIVE_CITIES = CITIES.filter((c) => c.live);

export function citySlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/** Locales reserved for future multi-language support. Only `en` is active. */
export const LOCALES = [
  { code: "en", label: "English", active: true },
  { code: "hi", label: "हिन्दी", active: false },
  { code: "mr", label: "मराठी", active: false },
  { code: "ta", label: "தமிழ்", active: false },
  { code: "te", label: "తెలుగు", active: false },
  { code: "kn", label: "ಕನ್ನಡ", active: false },
  { code: "bn", label: "বাংলা", active: false },
] as const;

export const DEFAULT_LOCALE = "en";

export const CURRENCY = { code: "INR", symbol: "₹", locale: "en-IN" } as const;

/** Payment providers the billing layer is designed against. */
export const PAYMENT_PROVIDERS = [
  { id: "razorpay", label: "Razorpay", regions: ["IN"], enabled: false },
  { id: "stripe", label: "Stripe", regions: ["IN", "GLOBAL"], enabled: false },
] as const;

/** Monetisation SKUs. Wiring a provider later needs no schema redesign. */
export const PLANS = [
  { id: "owner_free", audience: "owner", label: "Owner Free", priceInr: 0, listings: 2 },
  { id: "assist-basic", audience: "owner", label: "Assist Basic", priceInr: 249, listings: 15 },
  { id: "assist-managed", audience: "owner", label: "Assist Plus", priceInr: 499, listings: 30 },
  {
    id: "assist-complete",
    audience: "owner",
    label: "Assist Complete",
    priceInr: 999,
    listings: 100,
  },
  { id: "agent_pro", audience: "agent", label: "Agent Pro", priceInr: 1999, listings: 100 },
  {
    id: "builder_suite",
    audience: "builder",
    label: "Builder Suite",
    priceInr: 9999,
    listings: 1000,
  },
  {
    id: "customer_basic",
    audience: "customer",
    label: "Customer Basic",
    priceInr: 49,
    listings: 0,
  },
  {
    id: "customer_standard",
    audience: "customer",
    label: "Customer Standard",
    priceInr: 99,
    listings: 0,
  },
  {
    id: "customer_premium",
    audience: "customer",
    label: "Customer Premium",
    priceInr: 149,
    listings: 0,
  },
  {
    id: "customer_elite",
    audience: "customer",
    label: "Customer Elite",
    priceInr: 199,
    listings: 0,
  },
] as const;

export const LISTING_BOOSTS = [
  { id: "featured", label: "Featured property", priceInr: 999, days: 30 },
  { id: "premium", label: "Premium listing", priceInr: 1999, days: 30 },
] as const;

export const BRAND = {
  name: "Seedha Properties",
  shortName: "Seedha",
  tagline: "India's next-generation real estate ecosystem.",
} as const;
