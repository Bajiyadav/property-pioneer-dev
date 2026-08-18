import { describe, it, expect } from "vitest";
import {
  calculateHaversineDistanceKm,
  MAJOR_LANDMARKS,
  calculateCommute,
} from "@/modules/property/services/commuteService";

describe("Commute & Map Distance Service", () => {
  it("calculates accurate Haversine distance between Hitec City and Madhapur", () => {
    // Approx coordinates for Madhapur and Hitec City (~2km)
    const lat1 = 17.4483;
    const lon1 = 78.3915;
    const lat2 = 17.4474;
    const lon2 = 78.3762;

    const distance = calculateHaversineDistanceKm(lat1, lon1, lat2, lon2);
    expect(distance).toBeGreaterThan(1.0);
    expect(distance).toBeLessThan(3.0);
  });

  it("provides pre-configured landmarks for top Indian tech hubs", () => {
    expect(MAJOR_LANDMARKS.Hyderabad.length).toBeGreaterThan(3);
    expect(MAJOR_LANDMARKS.Bengaluru.length).toBeGreaterThan(3);
    expect(MAJOR_LANDMARKS.Mumbai.length).toBeGreaterThan(3);

    const itParks = MAJOR_LANDMARKS.Hyderabad.filter((l) => l.category === "IT Park");
    expect(itParks.length).toBeGreaterThan(0);
  });

  it("computes fallback drive time estimates based on distance", async () => {
    const landmark = MAJOR_LANDMARKS.Hyderabad[0];
    const commute = await calculateCommute(17.4483, 78.3915, landmark);

    expect(commute.landmarkName).toBe(landmark.name);
    expect(commute.distanceKm).toBeGreaterThan(0);
    expect(commute.durationMinutes).toBeGreaterThan(0);
  });
});
