import { describe, it, expect } from "vitest";
import {
  fetchPublicPropertyFeed,
  type PropertySearchParams,
} from "@/modules/property/services/propertyService";

describe("Server-Side Search & Pagination", () => {
  it("applies default page and limit bounds when paginating", async () => {
    const feed = await fetchPublicPropertyFeed({ page: 1, limit: 2 });
    expect(feed.page).toBe(1);
    expect(feed.limit).toBe(2);
    expect(feed.properties.length).toBeLessThanOrEqual(2);
  });

  it("handles subsequent pages properly", async () => {
    const page1 = await fetchPublicPropertyFeed({ page: 1, limit: 3 });
    const page2 = await fetchPublicPropertyFeed({ page: 2, limit: 3 });

    expect(page1.page).toBe(1);
    expect(page2.page).toBe(2);
    if (page1.properties.length > 0 && page2.properties.length > 0 && page1.source === "fallback") {
      // For fallback dataset pagination, items on page 1 and page 2 are distinct
      const page1Ids = new Set(page1.properties.map((p) => p.id));
      const hasDuplicate = page2.properties.some((p) => page1Ids.has(p.id));
      expect(hasDuplicate).toBe(false);
    }
  });

  it("filters listings by listing type", async () => {
    const rentFeed = await fetchPublicPropertyFeed({ listing: "rent", limit: 10 });
    for (const prop of rentFeed.properties) {
      expect(prop.listing_type).toBe("rent");
    }

    const saleFeed = await fetchPublicPropertyFeed({ listing: "sale", limit: 10 });
    for (const prop of saleFeed.properties) {
      expect(prop.listing_type).toBe("sale");
    }
  });

  it("returns truthful empty result for non-existent city search", async () => {
    const feed = await fetchPublicPropertyFeed({ city: "NonExistentCityXYZ123" });
    expect(feed.properties).toEqual([]);
    expect(feed.totalCount).toBe(0);
  });
});
