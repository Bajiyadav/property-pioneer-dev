/**
 * Unified Authoritative Location Hierarchy for Seedha Properties.
 *
 * Single source of truth for supported states, cities, coordinates (centroids),
 * and discovery metadata. Used by Web, Mobile (Flutter), and Java backend.
 */

export interface CityInfo {
  slug: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  popularLocalities: string[];
  isMetro?: boolean;
}

export interface StateInfo {
  id: string;
  name: string;
  shortCode: string;
  tagline: string;
  landmark: string;
  imageUrl: string;
  cities: CityInfo[];
}

export const AUTHORITATIVE_LOCATIONS: StateInfo[] = [
  {
    id: "telangana",
    name: "Telangana",
    shortCode: "TS",
    tagline: "Hi-Tech City, Cyberabad & Historic Heritage",
    landmark: "Charminar & Hitec City",
    imageUrl:
      "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80",
    cities: [
      {
        slug: "hyderabad",
        name: "Hyderabad",
        state: "Telangana",
        lat: 17.385,
        lng: 78.4867,
        isMetro: true,
        popularLocalities: [
          "Gachibowli",
          "Madhapur",
          "Kondapur",
          "Kukatpally",
          "Banjara Hills",
          "Jubilee Hills",
          "Hitech City",
          "Manikonda",
        ],
      },
      {
        slug: "secunderabad",
        name: "Secunderabad",
        state: "Telangana",
        lat: 17.4399,
        lng: 78.4983,
        popularLocalities: ["Marredpally", "Sainikpuri", "Begumpet", "Tarnaka", "Malkajgiri"],
      },
      {
        slug: "warangal",
        name: "Warangal",
        state: "Telangana",
        lat: 17.9689,
        lng: 79.5941,
        popularLocalities: ["Hanamkonda", "Kazipet", "Subedari", "Nayeem Nagar"],
      },
      {
        slug: "karimnagar",
        name: "Karimnagar",
        state: "Telangana",
        lat: 18.4386,
        lng: 79.1288,
        popularLocalities: ["Mukarrampura", "Kothirampur", "Vidyanagar"],
      },
      {
        slug: "nizamabad",
        name: "Nizamabad",
        state: "Telangana",
        lat: 18.6725,
        lng: 78.0941,
        popularLocalities: ["Khaleelwadi", "Vinayak Nagar", "Armoor Road"],
      },
      {
        slug: "khammam",
        name: "Khammam",
        state: "Telangana",
        lat: 17.2473,
        lng: 80.1514,
        popularLocalities: ["Rotary Nagar", "Bank Colony", "Wyra Road"],
      },
    ],
  },
  {
    id: "karnataka",
    name: "Karnataka",
    shortCode: "KA",
    tagline: "Silicon Valley of India & Cultural Hubs",
    landmark: "Vidhana Soudha & IT Corridor",
    imageUrl:
      "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80",
    cities: [
      {
        slug: "bengaluru",
        name: "Bengaluru",
        state: "Karnataka",
        lat: 12.9716,
        lng: 77.5946,
        isMetro: true,
        popularLocalities: [
          "Indiranagar",
          "Koramangala",
          "Whitefield",
          "HSR Layout",
          "Electronic City",
          "Bellandur",
          "Sarjapur Road",
          "Jayanagar",
        ],
      },
      {
        slug: "mysuru",
        name: "Mysuru",
        state: "Karnataka",
        lat: 12.2958,
        lng: 76.6394,
        popularLocalities: ["Gokulam", "Jayalakshmipuram", "Kuvempunagar", "Vijayanagar"],
      },
      {
        slug: "hubballi",
        name: "Hubballi",
        state: "Karnataka",
        lat: 15.3647,
        lng: 75.124,
        popularLocalities: ["Vidyanagar", "Keshwapur", "Gokul Road"],
      },
      {
        slug: "mangaluru",
        name: "Mangaluru",
        state: "Karnataka",
        lat: 12.9141,
        lng: 74.856,
        popularLocalities: ["Kadri", "Bejai", "Kodialbail", "Urwa"],
      },
    ],
  },
  {
    id: "maharashtra",
    name: "Maharashtra",
    shortCode: "MH",
    tagline: "Financial Capital & Oxford of the East",
    landmark: "Gateway of India & Marine Drive",
    imageUrl:
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80",
    cities: [
      {
        slug: "mumbai",
        name: "Mumbai",
        state: "Maharashtra",
        lat: 19.076,
        lng: 72.8777,
        isMetro: true,
        popularLocalities: [
          "Bandra West",
          "Andheri West",
          "Powai",
          "BKC",
          "Worli",
          "Juhu",
          "Lower Parel",
          "Malad West",
        ],
      },
      {
        slug: "pune",
        name: "Pune",
        state: "Maharashtra",
        lat: 18.5204,
        lng: 73.8567,
        isMetro: true,
        popularLocalities: [
          "Hinjewadi",
          "Kothrud",
          "Baner",
          "Viman Nagar",
          "Wakad",
          "Kalyani Nagar",
          "Aundh",
          "Magarpatta",
        ],
      },
      {
        slug: "nagpur",
        name: "Nagpur",
        state: "Maharashtra",
        lat: 21.1458,
        lng: 79.0882,
        popularLocalities: ["Dharampeth", "Ramdaspeth", "Civil Lines", "Manish Nagar"],
      },
      {
        slug: "thane",
        name: "Thane",
        state: "Maharashtra",
        lat: 19.2183,
        lng: 72.9781,
        popularLocalities: ["Ghodbunder Road", "Majiwada", "Vasant Vihar", "Naupada"],
      },
      {
        slug: "nashik",
        name: "Nashik",
        state: "Maharashtra",
        lat: 19.9975,
        lng: 73.7898,
        popularLocalities: ["College Road", "Gangapur Road", "Indira Nagar", "Govind Nagar"],
      },
    ],
  },
  {
    id: "delhi-ncr",
    name: "Delhi NCR",
    shortCode: "DL",
    tagline: "National Capital Region & Millennium City",
    landmark: "India Gate & Capital Skyline",
    imageUrl:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80",
    cities: [
      {
        slug: "delhi",
        name: "Delhi",
        state: "Delhi NCR",
        lat: 28.6139,
        lng: 77.209,
        isMetro: true,
        popularLocalities: [
          "Connaught Place",
          "Dwarka",
          "Saket",
          "Vasant Kunj",
          "Hauz Khas",
          "Greater Kailash",
          "Rohini",
        ],
      },
      {
        slug: "gurugram",
        name: "Gurugram",
        state: "Delhi NCR",
        lat: 28.4595,
        lng: 77.0266,
        isMetro: true,
        popularLocalities: [
          "Cyber City",
          "Golf Course Road",
          "DLF Phase 5",
          "Sohna Road",
          "Sector 57",
          "Sushant Lok",
        ],
      },
      {
        slug: "noida",
        name: "Noida",
        state: "Delhi NCR",
        lat: 28.5355,
        lng: 77.391,
        isMetro: true,
        popularLocalities: [
          "Sector 62",
          "Sector 18",
          "Sector 137",
          "Sector 50",
          "Noida Expressway",
        ],
      },
      {
        slug: "faridabad",
        name: "Faridabad",
        state: "Delhi NCR",
        lat: 28.4089,
        lng: 77.3178,
        popularLocalities: ["Sector 15", "Green Fields", "Neharpar", "Sector 21C"],
      },
    ],
  },
  {
    id: "tamil-nadu",
    name: "Tamil Nadu",
    shortCode: "TN",
    tagline: "Gateway of South India & Industrial Powerhouses",
    landmark: "Shore Temple & Marina Coast",
    imageUrl:
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80",
    cities: [
      {
        slug: "chennai",
        name: "Chennai",
        state: "Tamil Nadu",
        lat: 13.0827,
        lng: 80.2707,
        isMetro: true,
        popularLocalities: [
          "OMR",
          "Velachery",
          "Adyar",
          "Anna Nagar",
          "T Nagar",
          "Thiruvanmiyur",
          "Besant Nagar",
        ],
      },
      {
        slug: "coimbatore",
        name: "Coimbatore",
        state: "Tamil Nadu",
        lat: 11.0168,
        lng: 76.9558,
        popularLocalities: ["RS Puram", "Gandhipuram", "Saibaba Colony", "Peelamedu"],
      },
      {
        slug: "madurai",
        name: "Madurai",
        state: "Tamil Nadu",
        lat: 9.9252,
        lng: 78.1198,
        popularLocalities: ["KK Nagar", "Anna Nagar", "SS Colony", "Tallakulam"],
      },
    ],
  },
  {
    id: "andhra-pradesh",
    name: "Andhra Pradesh",
    shortCode: "AP",
    tagline: "Coastal Metropolis, Amaravati & Royal Tirupati",
    landmark: "RK Beach & Coastal Amaravati",
    imageUrl:
      "https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&w=600&q=80",
    cities: [
      {
        slug: "visakhapatnam",
        name: "Visakhapatnam",
        state: "Andhra Pradesh",
        lat: 17.6868,
        lng: 83.2185,
        isMetro: true,
        popularLocalities: [
          "Madhurawada",
          "MVP Colony",
          "Siripuram",
          "Gajuwaka",
          "Rushikonda",
          "Seethammadhara",
        ],
      },
      {
        slug: "vijayawada",
        name: "Vijayawada",
        state: "Andhra Pradesh",
        lat: 16.5062,
        lng: 80.648,
        popularLocalities: ["Benz Circle", "MG Road", "Governorpet", "Bhavanipuram"],
      },
      {
        slug: "guntur",
        name: "Guntur",
        state: "Andhra Pradesh",
        lat: 16.3067,
        lng: 80.4365,
        popularLocalities: ["Brodipet", "Arundelpet", "Vidya Nagar", "Pattabhipuram"],
      },
      {
        slug: "tirupati",
        name: "Tirupati",
        state: "Andhra Pradesh",
        lat: 13.6288,
        lng: 79.4192,
        popularLocalities: ["MR Palli", "Bhavani Nagar", "Korlagunta", "AIR Bypass Road"],
      },
      {
        slug: "nellore",
        name: "Nellore",
        state: "Andhra Pradesh",
        lat: 14.4426,
        lng: 79.9865,
        popularLocalities: ["Magunta Layout", "Pogathota", "Vedayapalem"],
      },
      {
        slug: "kurnool",
        name: "Kurnool",
        state: "Andhra Pradesh",
        lat: 15.8281,
        lng: 78.0373,
        popularLocalities: ["Nandyal Checkpost", "B Camp", "Gayathri Estate"],
      },
    ],
  },
];

/**
 * Find State by name or id (case-insensitive)
 */
export function findState(query: string): StateInfo | undefined {
  const q = query.trim().toLowerCase();
  return AUTHORITATIVE_LOCATIONS.find(
    (s) => s.id === q || s.name.toLowerCase() === q || s.shortCode.toLowerCase() === q,
  );
}

/**
 * Find City by name or slug across all supported states
 */
export function findCity(cityNameOrSlug: string, stateName?: string): CityInfo | undefined {
  const c = cityNameOrSlug.trim().toLowerCase();
  if (stateName) {
    const s = findState(stateName);
    if (s) {
      return s.cities.find((city) => city.slug === c || city.name.toLowerCase() === c);
    }
  }

  for (const s of AUTHORITATIVE_LOCATIONS) {
    const found = s.cities.find((city) => city.slug === c || city.name.toLowerCase() === c);
    if (found) return found;
  }
  return undefined;
}

/**
 * Get all cities for a specific state
 */
export function getCitiesForState(stateName: string): CityInfo[] {
  const s = findState(stateName);
  return s ? s.cities : [];
}
