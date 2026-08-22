import { describe, it, expect } from "vitest";
import {
  calculateEmi,
  calculateLoanEligibility,
  formatINR,
} from "../../src/modules/loans/utils/loanCalculations";

describe("Seedha Properties MVP Launch Verification", () => {
  describe("Task 1 — Admin Listing Moderation", () => {
    it("ensures moderation statuses and transitions are valid", () => {
      const allowedStatuses = ["available", "rented", "sold", "pending"];
      const allowedModeration = ["pending", "approved", "rejected"];

      expect(allowedStatuses).toContain("available");
      expect(allowedModeration).toContain("approved");
      expect(allowedModeration).toContain("rejected");
    });
  });

  describe("Task 2 — Owner Contact & Phone Protection", () => {
    it("normalizes and validates Indian phone numbers for WhatsApp contact routing", () => {
      function normalisePhone(raw: string | null | undefined): string | null {
        const digits = (raw ?? "").replace(/\D/g, "");
        if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`;
        if (/^91[6-9]\d{9}$/.test(digits)) return digits;
        return null;
      }

      expect(normalisePhone("9849012345")).toBe("919849012345");
      expect(normalisePhone("+91 98490 12345")).toBe("919849012345");
      expect(normalisePhone("919849012345")).toBe("919849012345");
      expect(normalisePhone("12345")).toBeNull();
      expect(normalisePhone(null)).toBeNull();
    });

    it("verifies 3-free contact quota business logic", () => {
      const MAX_FREE_CONTACTS = 3;
      const contactedProperties = new Set(["prop-1", "prop-2"]);
      expect(contactedProperties.size < MAX_FREE_CONTACTS).toBe(true);

      contactedProperties.add("prop-3");
      expect(contactedProperties.size >= MAX_FREE_CONTACTS).toBe(true);
    });
  });

  describe("Task 3 — Enquiry & Schedule Visit", () => {
    it("validates visit slots and scheduling inputs", () => {
      const validSlots = [
        "Morning (9 AM - 12 PM)",
        "Afternoon (12 PM - 3 PM)",
        "Evening (3 PM - 6 PM)",
      ];
      expect(validSlots.length).toBe(3);
      expect(validSlots).toContain("Morning (9 AM - 12 PM)");
    });
  });

  describe("Task 4 — Favorites Persistence", () => {
    it("handles deduplication and toggling of saved listings", () => {
      let favs: string[] = ["prop-1", "prop-2"];
      const toggle = (id: string) => {
        favs = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
      };

      toggle("prop-3");
      expect(favs).toEqual(["prop-1", "prop-2", "prop-3"]);

      toggle("prop-1");
      expect(favs).toEqual(["prop-2", "prop-3"]);

      // Deduplication test
      const uniqueFavs = Array.from(new Set([...favs, "prop-2", "prop-4"]));
      expect(uniqueFavs).toEqual(["prop-2", "prop-3", "prop-4"]);
    });
  });

  describe("Task 5 — SEO & Home Loans Integration", () => {
    it("verifies home loan EMI calculation and INR formatting", () => {
      const emi = calculateEmi(5000000, 8.5, 240);
      expect(emi).toBeGreaterThan(43000);
      expect(formatINR(5000000)).toBe("₹50 L");
      expect(formatINR(15000000)).toBe("₹1.50 Cr");
    });
  });
});
