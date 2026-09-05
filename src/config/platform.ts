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
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Delhi NCR",
  "Uttar Pradesh",
  "West Bengal",
  "Gujarat",
  "Rajasthan",
  "Kerala",
  "Punjab",
  "Haryana",
  "Madhya Pradesh",
  "Bihar",
  "Odisha",
  "Jharkhand",
  "Chhattisgarh",
  "Assam",
  "Goa",
  "Uttarakhand",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Chandigarh",
  "Ladakh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
  "Puducherry",
  "Andaman & Nicobar",
  "Tripura",
  "Meghalaya",
  "Manipur",
  "Nagaland",
  "Arunachal Pradesh",
  "Mizoram",
  "Sikkim",
] as const;

export const CITIES: CityConfig[] = [
  // ────────────────────────── Andhra Pradesh (26 Districts Covered) ──────────────────────────
  { slug: "visakhapatnam", name: "Visakhapatnam", state: "Andhra Pradesh", live: true },
  { slug: "vijayawada", name: "Vijayawada", state: "Andhra Pradesh", live: true },
  { slug: "guntur", name: "Guntur", state: "Andhra Pradesh", live: true },
  { slug: "nellore", name: "Nellore", state: "Andhra Pradesh", live: true },
  { slug: "kurnool", name: "Kurnool", state: "Andhra Pradesh", live: true },
  { slug: "rajahmundry", name: "Rajahmundry", state: "Andhra Pradesh", live: true },
  { slug: "tirupati", name: "Tirupati", state: "Andhra Pradesh", live: true },
  { slug: "kakinada", name: "Kakinada", state: "Andhra Pradesh", live: true },
  { slug: "anantapur", name: "Anantapur", state: "Andhra Pradesh", live: true },
  { slug: "kadapa", name: "Kadapa", state: "Andhra Pradesh", live: true },
  { slug: "eluru", name: "Eluru", state: "Andhra Pradesh", live: true },
  { slug: "ongole", name: "Ongole", state: "Andhra Pradesh", live: true },
  { slug: "srikakulam", name: "Srikakulam", state: "Andhra Pradesh", live: true },
  { slug: "vizianagaram", name: "Vizianagaram", state: "Andhra Pradesh", live: true },
  { slug: "machilipatnam", name: "Machilipatnam", state: "Andhra Pradesh", live: true },
  { slug: "amaravati", name: "Amaravati", state: "Andhra Pradesh", live: true },
  { slug: "chittoor", name: "Chittoor", state: "Andhra Pradesh", live: true },
  { slug: "proddatur", name: "Proddatur", state: "Andhra Pradesh", live: true },
  { slug: "bhimavaram", name: "Bhimavaram", state: "Andhra Pradesh", live: true },
  { slug: "tenali", name: "Tenali", state: "Andhra Pradesh", live: true },
  { slug: "nandyal", name: "Nandyal", state: "Andhra Pradesh", live: true },
  { slug: "anakapalli", name: "Anakapalli", state: "Andhra Pradesh", live: true },
  { slug: "bapatla", name: "Bapatla", state: "Andhra Pradesh", live: true },
  { slug: "palnadu", name: "Narasaraopet", state: "Andhra Pradesh", live: true },
  { slug: "rayachoti", name: "Rayachoti", state: "Andhra Pradesh", live: true },
  { slug: "puttaparthi", name: "Puttaparthi", state: "Andhra Pradesh", live: true },
  { slug: "amalapuram", name: "Amalapuram", state: "Andhra Pradesh", live: true },
  { slug: "paderu", name: "Paderu", state: "Andhra Pradesh", live: true },
  { slug: "parvathipuram", name: "Parvathipuram", state: "Andhra Pradesh", live: true },

  // ────────────────────────── Telangana (Statutory Urban Centers) ──────────────────────────
  { slug: "hyderabad", name: "Hyderabad", state: "Telangana", live: true },
  { slug: "secunderabad", name: "Secunderabad", state: "Telangana", live: true },
  { slug: "warangal", name: "Warangal", state: "Telangana", live: true },
  { slug: "hanumakonda", name: "Hanamkonda", state: "Telangana", live: true },
  { slug: "karimnagar", name: "Karimnagar", state: "Telangana", live: true },
  { slug: "nizamabad", name: "Nizamabad", state: "Telangana", live: true },
  { slug: "khammam", name: "Khammam", state: "Telangana", live: true },
  { slug: "mahbubnagar", name: "Mahabubnagar", state: "Telangana", live: true },
  { slug: "nalgonda", name: "Nalgonda", state: "Telangana", live: true },
  { slug: "siddipet", name: "Siddipet", state: "Telangana", live: true },
  { slug: "medak", name: "Medak", state: "Telangana", live: true },
  { slug: "sangareddy", name: "Sangareddy", state: "Telangana", live: true },
  { slug: "adilabad", name: "Adilabad", state: "Telangana", live: true },
  { slug: "mancherial", name: "Mancherial", state: "Telangana", live: true },
  { slug: "nirmal", name: "Nirmal", state: "Telangana", live: true },
  { slug: "peddapalli", name: "Peddapalli", state: "Telangana", live: true },
  { slug: "jagtial", name: "Jagtial", state: "Telangana", live: true },
  { slug: "sircilla", name: "Sircilla", state: "Telangana", live: true },
  { slug: "kamareddy", name: "Kamareddy", state: "Telangana", live: true },
  { slug: "kothagudem", name: "Kothagudem", state: "Telangana", live: true },
  { slug: "suryapet", name: "Suryapet", state: "Telangana", live: true },
  { slug: "bhongir", name: "Bhongir", state: "Telangana", live: true },
  { slug: "gadwal", name: "Gadwal", state: "Telangana", live: true },
  { slug: "wanaparthy", name: "Wanaparthy", state: "Telangana", live: true },
  { slug: "nagarkurnool", name: "Nagarkurnool", state: "Telangana", live: true },
  { slug: "narayanpet", name: "Narayanpet", state: "Telangana", live: true },
  { slug: "vikarabad", name: "Vikarabad", state: "Telangana", live: true },
  { slug: "jangaon", name: "Jangaon", state: "Telangana", live: true },
  { slug: "bhupalpally", name: "Bhupalpally", state: "Telangana", live: true },
  { slug: "mulugu", name: "Mulugu", state: "Telangana", live: true },
  { slug: "mahabubabad", name: "Mahabubabad", state: "Telangana", live: true },
  { slug: "asifabad", name: "Asifabad", state: "Telangana", live: true },

  // ────────────────────────── Maharashtra ──────────────────────────
  { slug: "mumbai", name: "Mumbai", state: "Maharashtra", live: true },
  { slug: "pune", name: "Pune", state: "Maharashtra", live: true },
  { slug: "nagpur", name: "Nagpur", state: "Maharashtra", live: true },
  { slug: "nashik", name: "Nashik", state: "Maharashtra", live: true },
  { slug: "thane", name: "Thane", state: "Maharashtra", live: true },
  { slug: "navi-mumbai", name: "Navi Mumbai", state: "Maharashtra", live: true },
  { slug: "aurangabad", name: "Aurangabad", state: "Maharashtra", live: true },
  { slug: "solapur", name: "Solapur", state: "Maharashtra", live: true },
  { slug: "kolhapur", name: "Kolhapur", state: "Maharashtra", live: true },

  // ────────────────────────── Karnataka ──────────────────────────
  { slug: "bengaluru", name: "Bengaluru", state: "Karnataka", live: true },
  { slug: "mysuru", name: "Mysuru", state: "Karnataka", live: true },
  { slug: "mangaluru", name: "Mangaluru", state: "Karnataka", live: true },
  { slug: "hubli", name: "Hubli-Dharwad", state: "Karnataka", live: true },

  // ────────────────────────── Tamil Nadu ──────────────────────────
  { slug: "chennai", name: "Chennai", state: "Tamil Nadu", live: true },
  { slug: "coimbatore", name: "Coimbatore", state: "Tamil Nadu", live: true },
  { slug: "madurai", name: "Madurai", state: "Tamil Nadu", live: true },
  { slug: "tiruchirappalli", name: "Tiruchirappalli", state: "Tamil Nadu", live: true },
  { slug: "salem", name: "Salem", state: "Tamil Nadu", live: true },

  // ────────────────────────── Delhi NCR ──────────────────────────
  { slug: "delhi", name: "Delhi", state: "Delhi NCR", live: true },
  { slug: "gurugram", name: "Gurugram", state: "Delhi NCR", live: true },
  { slug: "noida", name: "Noida", state: "Delhi NCR", live: true },
  { slug: "greater-noida", name: "Greater Noida", state: "Delhi NCR", live: true },
  { slug: "faridabad", name: "Faridabad", state: "Delhi NCR", live: true },
  { slug: "ghaziabad", name: "Ghaziabad", state: "Delhi NCR", live: true },

  // ────────────────────────── Uttar Pradesh ──────────────────────────
  { slug: "lucknow", name: "Lucknow", state: "Uttar Pradesh", live: true },
  { slug: "kanpur", name: "Kanpur", state: "Uttar Pradesh", live: true },
  { slug: "agra", name: "Agra", state: "Uttar Pradesh", live: true },
  { slug: "varanasi", name: "Varanasi", state: "Uttar Pradesh", live: true },
  { slug: "prayagraj", name: "Prayagraj", state: "Uttar Pradesh", live: true },

  // ────────────────────────── West Bengal ──────────────────────────
  { slug: "kolkata", name: "Kolkata", state: "West Bengal", live: true },
  { slug: "howrah", name: "Howrah", state: "West Bengal", live: true },
  { slug: "siliguri", name: "Siliguri", state: "West Bengal", live: true },

  // ────────────────────────── Gujarat ──────────────────────────
  { slug: "ahmedabad", name: "Ahmedabad", state: "Gujarat", live: true },
  { slug: "surat", name: "Surat", state: "Gujarat", live: true },
  { slug: "vadodara", name: "Vadodara", state: "Gujarat", live: true },
  { slug: "rajkot", name: "Rajkot", state: "Gujarat", live: true },
  { slug: "gandhinagar", name: "Gandhinagar", state: "Gujarat", live: true },

  // ────────────────────────── Rajasthan ──────────────────────────
  { slug: "jaipur", name: "Jaipur", state: "Rajasthan", live: true },
  { slug: "jodhpur", name: "Jodhpur", state: "Rajasthan", live: true },
  { slug: "udaipur", name: "Udaipur", state: "Rajasthan", live: true },
  { slug: "kota", name: "Kota", state: "Rajasthan", live: true },

  // ────────────────────────── Kerala ──────────────────────────
  { slug: "kochi", name: "Kochi", state: "Kerala", live: true },
  { slug: "thiruvananthapuram", name: "Thiruvananthapuram", state: "Kerala", live: true },
  { slug: "kozhikode", name: "Kozhikode", state: "Kerala", live: true },
  { slug: "thrissur", name: "Thrissur", state: "Kerala", live: true },

  // ────────────────────────── Punjab / Haryana / Chandigarh ──────────────────────────
  { slug: "chandigarh", name: "Chandigarh", state: "Chandigarh", live: true },
  { slug: "ludhiana", name: "Ludhiana", state: "Punjab", live: true },
  { slug: "amritsar", name: "Amritsar", state: "Punjab", live: true },

  // ────────────────────────── Madhya Pradesh ──────────────────────────
  { slug: "indore", name: "Indore", state: "Madhya Pradesh", live: true },
  { slug: "bhopal", name: "Bhopal", state: "Madhya Pradesh", live: true },
  { slug: "jabalpur", name: "Jabalpur", state: "Madhya Pradesh", live: true },

  // ────────────────────────── Bihar ──────────────────────────
  { slug: "patna", name: "Patna", state: "Bihar", live: true },

  // ────────────────────────── Odisha ──────────────────────────
  { slug: "bhubaneswar", name: "Bhubaneswar", state: "Odisha", live: true },

  // ────────────────────────── Jharkhand ──────────────────────────
  { slug: "ranchi", name: "Ranchi", state: "Jharkhand", live: true },
  { slug: "jamshedpur", name: "Jamshedpur", state: "Jharkhand", live: true },

  // ────────────────────────── Goa ──────────────────────────
  { slug: "goa", name: "Goa", state: "Goa", live: true },

  // ────────────────────────── Uttarakhand ──────────────────────────
  { slug: "dehradun", name: "Dehradun", state: "Uttarakhand", live: true },

  // ────────────────────────── Assam ──────────────────────────
  { slug: "guwahati", name: "Guwahati", state: "Assam", live: true },
  { slug: "silchar", name: "Silchar", state: "Assam", live: true },
  { slug: "agartala", name: "Agartala", state: "Tripura", live: true },
  { slug: "shillong", name: "Shillong", state: "Meghalaya", live: true },
  { slug: "imphal", name: "Imphal", state: "Manipur", live: true },
  { slug: "kohima", name: "Kohima", state: "Nagaland", live: true },
  { slug: "itanagar", name: "Itanagar", state: "Arunachal Pradesh", live: true },
  { slug: "aizawl", name: "Aizawl", state: "Mizoram", live: true },
  { slug: "gangtok", name: "Gangtok", state: "Sikkim", live: true },
  { slug: "puducherry", name: "Puducherry", state: "Puducherry", live: true },
  { slug: "port-blair", name: "Port Blair", state: "Andaman & Nicobar", live: true },
];

export const LIVE_CITIES = CITIES.filter((c) => c.live);

/** Canonical localities and neighborhoods under their respective statutory cities */
export const POPULAR_LOCALITIES_BY_CITY: Record<string, string[]> = {
  Hyderabad: [
    "Gachibowli",
    "Madhapur",
    "Kondapur",
    "Hitech City",
    "Financial District",
    "Kukatpally",
    "Jubilee Hills",
    "Banjara Hills",
    "Miyapur",
    "Manikonda",
    "Begumpet",
    "Ameerpet",
    "LB Nagar",
    "Dilsukhnagar",
    "Uppal",
    "Kompally",
    "Shamshabad",
    "Nizampet",
    "Nallagandla",
    "Bachupally",
    "Tarnaka",
  ],
  Visakhapatnam: ["Madhurawada", "Gajuwaka", "MVP Colony", "Seethammadhara", "Rushikonda"],
  Vijayawada: ["Benz Circle", "Governorpet", "Patamata", "Gunadala"],
  Bengaluru: [
    "Indiranagar",
    "Koramangala",
    "HSR Layout",
    "Whitefield",
    "Electronic City",
    "Jayanagar",
  ],
  Mumbai: ["Bandra West", "Andheri West", "Juhu", "Powai", "Worli", "Colaba"],
  Pune: ["Kothrud", "Hinjawadi", "Baner", "Wakad", "Viman Nagar"],
};

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
  name: "SEEDHA Properties",
  shortName: "SEEDHA",
  tagline: "Direct Property Discovery. Zero Brokerage. 100% Verified.",
} as const;
