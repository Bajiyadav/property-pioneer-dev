import { describe, it, expect } from "vitest";
import {
  calculateMatchScore,
  calculateProfileCompleteness,
  estimateCommuteTime,
  rankPropertiesForTenant,
  type PropertyCandidate,
} from "@/modules/tenant/services/matchingService";
import type { TenantProfile } from "@/modules/tenant/types";

describe("Tenant Profile & Smart Property Matching Algorithm", () => {
  const baseTenant: TenantProfile = {
    phone_number: "9876543210",
    full_name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    company_name: "Google India",
    profession: "Software Engineer",
    budget_min: 20000,
    budget_max: 35000,
    preferred_bhk: ["2 BHK", "3 BHK"],
    move_in_date: "2026-09-01",
    is_vegetarian: false,
    pets_allowed: true,
    preferred_furnishing: "semi-furnished",
    preferred_building_type: "Apartment",
    special_amenities: ["Lift", "Power Backup", "Gym"],
    primary_city: "Hyderabad",
    primary_locality: "Madhapur",
    secondary_cities: ["Bengaluru"],
    office_name: "HITEC City Phase 2",
    max_commute_minutes: 30,
    profile_completeness: 95,
  };

  const highMatchProp: PropertyCandidate = {
    id: "p1",
    title: "Luxury 2 BHK in Madhapur near Cyber Towers",
    price: 28000,
    city: "Hyderabad",
    locality: "Madhapur",
    bhk_type: "2 BHK",
    bedrooms: 2,
    amenities: ["Lift", "Power Backup", "Gym", "Security", "Parking"],
  };

  const mediumMatchProp: PropertyCandidate = {
    id: "p2",
    title: "1 BHK in Gachibowli",
    price: 18000, // slightly under budget min
    city: "Hyderabad",
    locality: "Gachibowli", // same city, different locality
    bhk_type: "1 BHK", // adjacent to 2BHK
    bedrooms: 1,
    amenities: ["Lift", "Security"],
  };

  const lowMatchProp: PropertyCandidate = {
    id: "p3",
    title: "4 BHK Villa in Chennai",
    price: 85000, // way over budget
    city: "Chennai", // completely different city
    locality: "OMR",
    bhk_type: "4 BHK",
    bedrooms: 4,
    amenities: ["Swimming Pool"],
  };

  it("computes high compatibility (>85%) for exact locality, budget, and BHK match", () => {
    const score = calculateMatchScore(baseTenant, highMatchProp);
    expect(score.locationMatch).toBe(100);
    expect(score.budgetMatch).toBe(100);
    expect(score.bhkMatch).toBe(100);
    expect(score.amenityMatch).toBe(100);
    expect(score.totalScore).toBeGreaterThanOrEqual(90);
  });

  it("grades medium compatibility (70-85%) for same city but different locality or adjacent BHK", () => {
    const score = calculateMatchScore(baseTenant, mediumMatchProp);
    expect(score.locationMatch).toBe(75); // same metro
    expect(score.bhkMatch).toBe(60); // adjacent BHK
    expect(score.totalScore).toBeGreaterThanOrEqual(60);
    expect(score.totalScore).toBeLessThan(90);
  });

  it("penalizes heavily when location and budget mismatch", () => {
    const score = calculateMatchScore(baseTenant, lowMatchProp);
    expect(score.locationMatch).toBe(20);
    expect(score.totalScore).toBeLessThan(50);
  });

  it("calculates profile completeness correctly", () => {
    expect(calculateProfileCompleteness({})).toBe(0);
    expect(calculateProfileCompleteness(baseTenant)).toBeGreaterThanOrEqual(90);
  });

  it("estimates commute time to office or tech park", () => {
    const commute = estimateCommuteTime("Madhapur", "Hyderabad", "HITEC City");
    expect(commute.minutes).toBeLessThanOrEqual(15);
    expect(commute.label).toContain("HITEC City");
  });

  it("ranks properties in descending order of compatibility score", () => {
    const ranked = rankPropertiesForTenant(baseTenant, [
      lowMatchProp,
      highMatchProp,
      mediumMatchProp,
    ]);

    expect(ranked.length).toBe(3);
    expect(ranked[0].id).toBe("p1"); // Highest score first
    expect(ranked[0].matchScore).toBeGreaterThan(ranked[1].matchScore);
    expect(ranked[1].matchScore).toBeGreaterThan(ranked[2].matchScore);
    expect(ranked[0].highlights).toContain("Exact Locality Match");
  });
});
