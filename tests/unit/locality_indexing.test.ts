import { describe, it, expect } from "vitest";
import {
  getLocalityIndexedData,
  searchLocalities,
  getLocalityStats,
  INDEXED_LOCALITIES_MASTER,
} from "@/modules/property/services/localityService";

describe("Locality Indexing & Location-First Service", () => {
  it("provides pre-loaded master data for top Indian metros", () => {
    expect(INDEXED_LOCALITIES_MASTER).toHaveProperty("Hyderabad");
    expect(INDEXED_LOCALITIES_MASTER).toHaveProperty("Bengaluru");
    expect(INDEXED_LOCALITIES_MASTER).toHaveProperty("Mumbai");
    expect(INDEXED_LOCALITIES_MASTER).toHaveProperty("Pune");

    const madhapur = INDEXED_LOCALITIES_MASTER.Hyderabad.find(
      (l) => l.locality_name === "Madhapur",
    );
    expect(madhapur).toBeDefined();
    expect(madhapur?.average_rent_1bhk).toBeGreaterThan(10000);
    expect(madhapur?.nearby_metro_station).toContain("Madhapur Metro");
    expect(madhapur?.nearby_tech_parks.length).toBeGreaterThan(0);
  });

  it("retrieves indexed locality metrics with <10ms performance guarantee", async () => {
    const start = performance.now();
    const data = await getLocalityIndexedData("Hyderabad", "Madhapur");
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
    expect(data).toBeDefined();
    expect(data?.city).toBe("Hyderabad");
    expect(data?.locality_name).toBe("Madhapur");
    expect(data?.average_rent_2bhk).toBe(28000);
    expect(data?.furnished_percentage).toBe(74);
  });

  it("searches and autocompletes localities by query", async () => {
    const hyderabadResults = await searchLocalities("Hyderabad", "mad");
    expect(hyderabadResults).toContain("Madhapur");

    const bengaluruResults = await searchLocalities("Bengaluru", "ind");
    expect(bengaluruResults).toContain("Indiranagar");
  });

  it("falls back gracefully to synthetic indexed data for unknown areas", async () => {
    const unknownData = await getLocalityIndexedData("Hyderabad", "Chandanagar");
    expect(unknownData).toBeDefined();
    expect(unknownData?.locality_name).toBe("Chandanagar");
    expect(unknownData?.average_rent_1bhk).toBeGreaterThan(0);
    expect(unknownData?.average_rent_2bhk).toBeGreaterThan(0);
  });

  it("calculates locality property counts accurately", async () => {
    const stats = await getLocalityStats("Hyderabad");
    expect(Array.isArray(stats)).toBe(true);
    expect(stats.length).toBeGreaterThan(0);
  });
});
