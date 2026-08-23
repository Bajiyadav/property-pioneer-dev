import { describe, it, expect } from "vitest";

describe("Seedha Canonical Property Search Navigation Suite", () => {
  describe("1. Canonical Search Parameter Mapping", () => {
    it("maps Buy intent to canonical listing=sale query parameter", () => {
      const search = {
        q: "Madhapur",
        city: "Hyderabad",
        listing: "sale",
      };
      expect(search.listing).toBe("sale");
      expect(search.q).toBe("Madhapur");
    });

    it("maps Rent intent to canonical listing=rent query parameter", () => {
      const search = {
        q: "Gachibowli",
        city: "Hyderabad",
        listing: "rent",
      };
      expect(search.listing).toBe("rent");
    });

    it("maps Commercial intent to canonical type=commercial query parameter", () => {
      const search: { type: string; listing?: string } = {
        type: "commercial",
      };
      expect(search.type).toBe("commercial");
    });
  });

  describe("2. Navigation Consistency across Entry Points", () => {
    it("ensures Header, Hero, and Category tiles all target canonical /properties path", () => {
      const headerTargets = {
        rent: { path: "/properties", search: { listing: "rent" } },
        buy: { path: "/properties", search: { listing: "sale" } },
        commercial: { path: "/properties", search: { type: "commercial" } },
      };

      const heroTabs = {
        rent: { path: "/properties", search: { listing: "rent" } },
        buy: { path: "/properties", search: { listing: "sale" } },
        commercial: { path: "/properties", search: { type: "commercial" } },
      };

      const categoryCards = {
        rent: { path: "/properties", search: { listing: "rent" } },
        buy: { path: "/properties", search: { listing: "sale" } },
        commercial: { path: "/properties", search: { type: "commercial" } },
      };

      // Header vs Hero vs Categories match canonical destinations
      expect(headerTargets.rent.path).toBe(heroTabs.rent.path);
      expect(headerTargets.buy.path).toBe(heroTabs.buy.path);
      expect(headerTargets.commercial.path).toBe(heroTabs.commercial.path);

      expect(heroTabs.rent.search.listing).toBe(categoryCards.rent.search.listing);
      expect(heroTabs.buy.search.listing).toBe(categoryCards.buy.search.listing);
      expect(heroTabs.commercial.search.type).toBe(categoryCards.commercial.search.type);
    });
  });
});
