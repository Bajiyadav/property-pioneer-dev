import type { TenantProfile, MatchBreakdown, MatchedProperty } from "../types";

export interface PropertyCandidate {
  id: string;
  title: string;
  price: number;
  deposit?: number;
  city: string;
  locality?: string;
  address?: string;
  bhk_type?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqft?: number;
  furnishing_status?: string;
  amenities?: string[];
  images?: string[];
  owner_name?: string;
  owner_phone?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Calculates the compatibility score (0 to 100%) between a tenant profile and a property.
 * Formula: Match Score = (Location × 30%) + (Budget × 30%) + (BHK × 25%) + (Amenities × 15%)
 */
export function calculateMatchScore(
  tenant: TenantProfile,
  property: PropertyCandidate,
): MatchBreakdown {
  // 1. Location Match (30% weight)
  let locationMatch = 20;
  const propCity = (property.city || "").toLowerCase().trim();
  const tenantCity = (tenant.primary_city || "").toLowerCase().trim();
  const propLocality = (property.locality || "").toLowerCase().trim();
  const tenantLocality = (tenant.primary_locality || "").toLowerCase().trim();

  if (propCity && tenantCity && propCity === tenantCity) {
    if (
      propLocality &&
      tenantLocality &&
      (propLocality === tenantLocality ||
        propLocality.includes(tenantLocality) ||
        tenantLocality.includes(propLocality))
    ) {
      locationMatch = 100;
    } else {
      locationMatch = 75; // Same metro city
    }
  } else if (
    tenant.secondary_cities &&
    tenant.secondary_cities.some((c) => c.toLowerCase().trim() === propCity)
  ) {
    locationMatch = 50; // In secondary preference city
  }

  // 2. Budget Match (30% weight)
  let budgetMatch = 30;
  const price = property.price || 0;
  const minBudget = tenant.budget_min || 5000;
  const maxBudget = tenant.budget_max || 100000;

  if (price >= minBudget && price <= maxBudget) {
    budgetMatch = 100;
  } else if (price < minBudget) {
    // Under budget is still desirable, gentle reduction
    const diff = minBudget - price;
    const ratio = diff / minBudget;
    budgetMatch = Math.max(50, Math.round(100 - ratio * 50));
  } else {
    // Over budget
    const diff = price - maxBudget;
    const ratio = diff / maxBudget;
    budgetMatch = Math.max(10, Math.round(100 - ratio * 150));
  }

  // 3. BHK Match (25% weight)
  let bhkMatch = 30;
  const propBhk = (property.bhk_type || (property.bedrooms ? `${property.bedrooms} BHK` : "2 BHK"))
    .replace(/\s+/g, "")
    .toLowerCase();

  const preferred = (tenant.preferred_bhk || ["1 BHK", "2 BHK"]).map((b) =>
    b.replace(/\s+/g, "").toLowerCase(),
  );

  if (preferred.includes(propBhk)) {
    bhkMatch = 100;
  } else {
    // Check adjacent BHK
    const propBedrooms =
      property.bedrooms ||
      (propBhk.includes("1") ? 1 : propBhk.includes("2") ? 2 : propBhk.includes("3") ? 3 : 4);
    const hasAdjacent = preferred.some((p) => {
      const pNum = p.includes("1") ? 1 : p.includes("2") ? 2 : p.includes("3") ? 3 : 4;
      return Math.abs(pNum - propBedrooms) <= 1;
    });
    bhkMatch = hasAdjacent ? 60 : 30;
  }

  // 4. Amenities Match (15% weight)
  let amenityMatch = 100;
  if (tenant.special_amenities && tenant.special_amenities.length > 0) {
    const propAmenities = (property.amenities || []).map((a) => a.toLowerCase().trim());
    const matchedCount = tenant.special_amenities.filter((req) =>
      propAmenities.some(
        (pa) => pa.includes(req.toLowerCase().trim()) || req.toLowerCase().trim().includes(pa),
      ),
    ).length;
    amenityMatch = Math.round((matchedCount / tenant.special_amenities.length) * 100);
  }

  // Calculate Weighted Total Score
  const totalScore = Math.min(
    100,
    Math.max(
      10,
      Math.round(locationMatch * 0.3 + budgetMatch * 0.3 + bhkMatch * 0.25 + amenityMatch * 0.15),
    ),
  );

  return {
    locationMatch,
    budgetMatch,
    bhkMatch,
    amenityMatch,
    totalScore,
  };
}

/**
 * Approximate commute time to tech hub/office in minutes.
 */
export function estimateCommuteTime(
  locality: string,
  city: string,
  officeName?: string,
): { minutes: number; label: string } {
  const loc = (locality || "").toLowerCase();
  const dest = officeName || "Major Tech Hub";

  let minutes = 15;
  if (loc.includes("madhapur") || loc.includes("hitec") || loc.includes("kondapur")) {
    minutes = 8;
  } else if (loc.includes("gachibowli") || loc.includes("financial") || loc.includes("kokapet")) {
    minutes = 12;
  } else if (loc.includes("jubilee") || loc.includes("banjara") || loc.includes("kothrud")) {
    minutes = 22;
  } else if (
    loc.includes("whitefield") ||
    loc.includes("bellandur") ||
    loc.includes("electronic")
  ) {
    minutes = 14;
  } else if (loc.includes("andheri") || loc.includes("bandra") || loc.includes("powai")) {
    minutes = 18;
  } else {
    minutes = 25;
  }

  return {
    minutes,
    label: `🏢 ${minutes} min to ${dest}`,
  };
}

/**
 * Calculates profile completeness percentage (0-100%).
 */
export function calculateProfileCompleteness(profile: Partial<TenantProfile>): number {
  let score = 0;
  if (profile.full_name?.trim()) score += 15;
  if (profile.phone_number?.trim()) score += 15;
  if (profile.email?.trim()) score += 15;
  if (profile.primary_city?.trim() && profile.primary_locality?.trim()) score += 25;
  if (profile.budget_max && profile.budget_max > 0) score += 10;
  if (profile.preferred_bhk && profile.preferred_bhk.length > 0) score += 10;
  if (profile.company_name?.trim() || profile.profession?.trim()) score += 5;
  if (profile.move_in_date) score += 5;
  return Math.min(100, score);
}

/**
 * Maps and sorts raw property candidates by match score for a given tenant profile.
 */
export function rankPropertiesForTenant(
  tenant: TenantProfile,
  properties: PropertyCandidate[],
): MatchedProperty[] {
  return properties
    .map((property) => {
      const matchBreakdown = calculateMatchScore(tenant, property);
      const commute = estimateCommuteTime(
        property.locality || "",
        property.city || tenant.primary_city,
        tenant.office_name,
      );

      const highlights: string[] = [];
      if (matchBreakdown.locationMatch >= 90) highlights.push("Exact Locality Match");
      if (matchBreakdown.budgetMatch >= 95) highlights.push("Within Budget");
      if (matchBreakdown.bhkMatch >= 95) highlights.push("Desired BHK");
      if (commute.minutes <= tenant.max_commute_minutes)
        highlights.push(`Under ${tenant.max_commute_minutes}m Commute`);

      return {
        id: property.id,
        title: property.title,
        price: property.price,
        deposit: property.deposit || property.price * 2,
        city: property.city,
        locality: property.locality || "Central Locality",
        address: property.address || `${property.locality}, ${property.city}`,
        bhk_type: property.bhk_type || (property.bedrooms ? `${property.bedrooms} BHK` : "2 BHK"),
        property_type: property.property_type || "Apartment",
        bedrooms: property.bedrooms || 2,
        bathrooms: property.bathrooms || 2,
        area_sqft: property.area_sqft || 1100,
        furnishing_status: property.furnishing_status || "semi-furnished",
        amenities: property.amenities || ["Lift", "Power Backup", "Security"],
        images: property.images || [
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
        ],
        owner_name: property.owner_name || "Verified Owner",
        owner_phone: property.owner_phone,
        matchScore: matchBreakdown.totalScore,
        matchBreakdown,
        commuteTimeMinutes: commute.minutes,
        commuteLabel: commute.label,
        highlights,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
