/**
 * Location Master Service (Web Client)
 * Connects to /api/v2/locations/* endpoints with offline-resilient caching
 * and authoritative Government of India / LGD fallback data.
 */

export interface LocationItem {
  id: string;
  name: string;
  code?: string;
  type: "STATE" | "DISTRICT" | "CITY" | "LOCALITY";
  parentId?: string;
  stateCode?: string;
  latitude?: number;
  longitude?: number;
  pincode?: string;
  metadata?: Record<string, any>;
}

// Complete 36 States and Union Territories (LGD & ISO 3166-2:IN)
export const FALLBACK_STATES: LocationItem[] = [
  { id: "IN-AP", name: "Andhra Pradesh", code: "AP", type: "STATE" },
  { id: "IN-AR", name: "Arunachal Pradesh", code: "AR", type: "STATE" },
  { id: "IN-AS", name: "Assam", code: "AS", type: "STATE" },
  { id: "IN-BR", name: "Bihar", code: "BR", type: "STATE" },
  { id: "IN-CT", name: "Chhattisgarh", code: "CT", type: "STATE" },
  { id: "IN-GA", name: "Goa", code: "GA", type: "STATE" },
  { id: "IN-GJ", name: "Gujarat", code: "GJ", type: "STATE" },
  { id: "IN-HR", name: "Haryana", code: "HR", type: "STATE" },
  { id: "IN-HP", name: "Himachal Pradesh", code: "HP", type: "STATE" },
  { id: "IN-JH", name: "Jharkhand", code: "JH", type: "STATE" },
  { id: "IN-KA", name: "Karnataka", code: "KA", type: "STATE" },
  { id: "IN-KL", name: "Kerala", code: "KL", type: "STATE" },
  { id: "IN-MP", name: "Madhya Pradesh", code: "MP", type: "STATE" },
  { id: "IN-MH", name: "Maharashtra", code: "MH", type: "STATE" },
  { id: "IN-MN", name: "Manipur", code: "MN", type: "STATE" },
  { id: "IN-ML", name: "Meghalaya", code: "ML", type: "STATE" },
  { id: "IN-MZ", name: "Mizoram", code: "MZ", type: "STATE" },
  { id: "IN-NL", name: "Nagaland", code: "NL", type: "STATE" },
  { id: "IN-OR", name: "Odisha", code: "OD", type: "STATE" },
  { id: "IN-PB", name: "Punjab", code: "PB", type: "STATE" },
  { id: "IN-RJ", name: "Rajasthan", code: "RJ", type: "STATE" },
  { id: "IN-SK", name: "Sikkim", code: "SK", type: "STATE" },
  { id: "IN-TN", name: "Tamil Nadu", code: "TN", type: "STATE" },
  { id: "IN-TG", name: "Telangana", code: "TS", type: "STATE" },
  { id: "IN-TR", name: "Tripura", code: "TR", type: "STATE" },
  { id: "IN-UP", name: "Uttar Pradesh", code: "UP", type: "STATE" },
  { id: "IN-UT", name: "Uttarakhand", code: "UK", type: "STATE" },
  { id: "IN-WB", name: "West Bengal", code: "WB", type: "STATE" },
  { id: "IN-AN", name: "Andaman and Nicobar Islands", code: "AN", type: "STATE" },
  { id: "IN-CH", name: "Chandigarh", code: "CH", type: "STATE" },
  { id: "IN-DH", name: "Dadra and Nagar Haveli and Daman and Diu", code: "DD", type: "STATE" },
  { id: "IN-DL", name: "Delhi NCR", code: "DL", type: "STATE" },
  { id: "IN-JK", name: "Jammu and Kashmir", code: "JK", type: "STATE" },
  { id: "IN-LA", name: "Ladakh", code: "LA", type: "STATE" },
  { id: "IN-LD", name: "Lakshadweep", code: "LD", type: "STATE" },
  { id: "IN-PY", name: "Puducherry", code: "PY", type: "STATE" },
];

// All 26 Reorganized Districts of Andhra Pradesh
export const AP_DISTRICTS: LocationItem[] = [
  { id: "IN-AP-ALLURI", name: "Alluri Sitharama Raju", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-ANAKAPALLI", name: "Anakapalli", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-ANANTHAPURAMU", name: "Ananthapuramu", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-ANNAMAYYA", name: "Annamayya", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-BAPATLA", name: "Bapatla", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-CHITTOOR", name: "Chittoor", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-DRAVIDA", name: "Dr. B.R. Ambedkar Konaseema", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-EAST-GODAVARI", name: "East Godavari", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-ELURU", name: "Eluru", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-GUNTUR", name: "Guntur", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-KAKINADA", name: "Kakinada", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-KRISHNA", name: "Krishna", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-KURNOOL", name: "Kurnool", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-NANDYAL", name: "Nandyal", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-NTR", name: "NTR (Vijayawada)", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-PALNADU", name: "Palnadu", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-PARVATHIPURAM", name: "Parvathipuram Manyam", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-PRAKASAM", name: "Prakasam", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-NELLORE", name: "Sri Potti Sriramulu Nellore", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-SATYASAI", name: "Sri Sathya Sai", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-SRIKAKULAM", name: "Srikakulam", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-TIRUPATI", name: "Tirupati", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-VISAKHAPATNAM", name: "Visakhapatnam", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-VIZIANAGARAM", name: "Vizianagaram", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-WEST-GODAVARI", name: "West Godavari", parentId: "IN-AP", type: "DISTRICT" },
  { id: "IN-AP-YSR", name: "YSR Kadapa", parentId: "IN-AP", type: "DISTRICT" },
];

// All 33 Reorganized Districts of Telangana
export const TS_DISTRICTS: LocationItem[] = [
  { id: "IN-TG-ADILABAD", name: "Adilabad", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-BHADRADRI", name: "Bhadradri Kothagudem", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-HANUMAKONDA", name: "Hanumakonda", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-HYDERABAD", name: "Hyderabad", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-JAGTIAL", name: "Jagtial", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-JANGAON", name: "Jangaon", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-JAYASHANKAR", name: "Jayashankar Bhupalpally", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-JOGULAMBA", name: "Jogulamba Gadwal", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-KAMAREDDY", name: "Kamareddy", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-KARIMNAGAR", name: "Karimnagar", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-KHAMMAM", name: "Khammam", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-KUMURAM", name: "Kumuram Bheem Asifabad", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-MAHABUBABAD", name: "Mahabubabad", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-MAHABUBNAGAR", name: "Mahabubnagar", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-MANCHERIAL", name: "Mancherial", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-MEDAK", name: "Medak", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-MEDCHAL", name: "Medchal-Malkajgiri", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-MULUGU", name: "Mulugu", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-NAGARKURNOOL", name: "Nagarkurnool", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-NALGONDA", name: "Nalgonda", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-NARAYANPET", name: "Narayanpet", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-NIRMAL", name: "Nirmal", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-NIZAMABAD", name: "Nizamabad", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-PEDDAPALLI", name: "Peddapalli", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-RAJANNA", name: "Rajanna Sircilla", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-RANGAREDDY", name: "Ranga Reddy", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-SANGAREDDY", name: "Sangareddy", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-SIDDIPET", name: "Siddipet", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-SURYAPET", name: "Suryapet", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-VIKARABAD", name: "Vikarabad", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-WANAPARTHY", name: "Wanaparthy", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-WARANGAL", name: "Warangal", parentId: "IN-TG", type: "DISTRICT" },
  { id: "IN-TG-YADADRI", name: "Yadadri Bhuvanagiri", parentId: "IN-TG", type: "DISTRICT" },
];

class LocationMasterService {
  private cache: Map<string, any> = new Map();

  async getStates(): Promise<LocationItem[]> {
    if (this.cache.has("states")) {
      return this.cache.get("states");
    }

    try {
      const res = await fetch("/api/v2/locations/states");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cache.set("states", data);
          return data;
        }
      }
    } catch {
      // Offline fallback
    }

    return FALLBACK_STATES;
  }

  async getDistricts(stateIdOrCode: string): Promise<LocationItem[]> {
    const key = `districts_${stateIdOrCode}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const res = await fetch(
        `/api/v2/locations/states/${encodeURIComponent(stateIdOrCode)}/districts`,
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cache.set(key, data);
          return data;
        }
      }
    } catch {
      // Offline fallback
    }

    const norm = stateIdOrCode.toUpperCase();
    if (norm === "IN-AP" || norm === "AP" || norm.includes("ANDHRA")) {
      return AP_DISTRICTS;
    }
    if (norm === "IN-TG" || norm === "TS" || norm === "TG" || norm.includes("TELANGANA")) {
      return TS_DISTRICTS;
    }

    return [];
  }

  async getCities(districtIdOrState: string): Promise<LocationItem[]> {
    const key = `cities_${districtIdOrState}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const res = await fetch(
        `/api/v2/locations/districts/${encodeURIComponent(districtIdOrState)}/cities`,
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cache.set(key, data);
          return data;
        }
      }
    } catch {
      // Fallback
    }

    return [];
  }

  async search(query: string, state?: string, limit = 10): Promise<LocationItem[]> {
    if (!query || query.trim().length < 2) return [];

    try {
      const params = new URLSearchParams({ q: query, limit: String(limit) });
      if (state) params.append("state", state);
      const res = await fetch(`/api/v2/locations/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {
      // Fallback
    }

    // Client-side fallback search
    const q = query.toLowerCase();
    const results: LocationItem[] = [];

    for (const s of FALLBACK_STATES) {
      if (s.name.toLowerCase().includes(q)) results.push(s);
    }
    for (const d of [...AP_DISTRICTS, ...TS_DISTRICTS]) {
      if (d.name.toLowerCase().includes(q)) results.push(d);
    }

    return results.slice(0, limit);
  }
}

export const locationMasterService = new LocationMasterService();
