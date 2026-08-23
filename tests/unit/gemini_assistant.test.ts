import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  SEEDHA_SYSTEM_PROMPT,
  classifyAndExtractIntent,
  retrieveKnowledgeDocuments,
  retrieveStructuredProperties,
  retrieveDynamicContext,
  askSeedhaAI,
} from "@/modules/interactions/services/geminiService";

describe("Seedha Gemini AI Assistant (Structured RAG + Knowledge Grounding)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          text: "Based on Seedha's Zero Brokerage policy, direct owners and tenants connect with 0% brokerage.",
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("includes 0% brokerage and direct-owner domain knowledge in system prompt", () => {
    expect(SEEDHA_SYSTEM_PROMPT).toContain("0% Brokerage");
    expect(SEEDHA_SYSTEM_PROMPT).toContain("Direct-Owner");
    expect(SEEDHA_SYSTEM_PROMPT).toContain("Hyderabad");
    expect(SEEDHA_SYSTEM_PROMPT).toContain("Bengaluru");
    expect(SEEDHA_SYSTEM_PROMPT).toContain("Verified Owner");
  });

  describe("Intent Classification & Structured Filter Extraction", () => {
    it("correctly identifies PROPERTY_SEARCH intent and extracts locality, BHK, and price", () => {
      const parsed = classifyAndExtractIntent("Find 2BHK in Madhapur under 30k with parking");
      expect(parsed.intent).toBe("PROPERTY_SEARCH");
      expect(parsed.locality).toBe("Madhapur");
      expect(parsed.city).toBe("Hyderabad");
      expect(parsed.bhk).toBe(2);
      expect(parsed.maxPrice).toBe(30000);
      expect(parsed.amenities).toContain("Parking");
    });

    it("correctly identifies SEEDHA_KNOWLEDGE intent for policy questions", () => {
      const parsed = classifyAndExtractIntent("Does Seedha charge any brokerage or hidden fee?");
      expect(parsed.intent).toBe("SEEDHA_KNOWLEDGE");
      expect(parsed.locality).toBeUndefined();
    });

    it("correctly identifies MIXED intent for multi-part questions", () => {
      const parsed = classifyAndExtractIntent(
        "Find me a 2BHK in Kondapur under 25k and explain how visit scheduling works",
      );
      expect(parsed.intent).toBe("MIXED");
      expect(parsed.locality).toBe("Kondapur");
      expect(parsed.bhk).toBe(2);
      expect(parsed.maxPrice).toBe(25000);
    });
  });

  describe("Knowledge Document Retrieval", () => {
    it("retrieves dynamic context snippets for listing and brokerage queries", () => {
      const listingContext = retrieveDynamicContext("How to post my flat?");
      expect(listingContext).toContain("Guided Listing Wizard");

      const doc = retrieveKnowledgeDocuments("What is the fee or commission?");
      expect(doc).toContain("Zero Brokerage");
    });

    it("retrieves Trust & Verification policy", () => {
      const doc = retrieveKnowledgeDocuments("Tell me about verified owner badges");
      expect(doc).toContain("Trust, Badging & Verification Framework");
    });

    it("retrieves Visit Scheduling rules", () => {
      const doc = retrieveKnowledgeDocuments("Can I schedule an in-person tour?");
      expect(doc).toContain("Tenant Scheduling & Walkthrough Policy");
    });
  });

  describe("Structured Database Retrieval & Privacy Guarantees", () => {
    it("queries structured properties and never exposes owner private phone/email in summary", async () => {
      const filters = classifyAndExtractIntent("2 BHK in Hyderabad under 50000");
      const result = await retrieveStructuredProperties(filters);

      expect(result.text).toBeDefined();
      expect(result.text).not.toContain("owner_phone");
      expect(result.text).not.toContain("owner_email");
      expect(result.text).not.toContain("latitude");
    });

    it("handles zero-match queries honestly without fabricating false listings", async () => {
      const result = await retrieveStructuredProperties({
        intent: "PROPERTY_SEARCH",
        locality: "NonExistentAreaXYZ",
        city: "NonExistentCity",
        bhk: 4,
        maxPrice: 100,
      });

      expect(result.count).toBe(0);
      expect(result.text).toContain("No matching live properties found");
    });
  });

  describe("End-to-End AI Interaction & Grounding", () => {
    it("answers listing inquiries with grounded owner guidance", async () => {
      const response = await askSeedhaAI("How do I list my apartment for rent?");
      expect(response.length).toBeGreaterThan(20);
      expect(
        response.toLowerCase().includes("list") ||
          response.toLowerCase().includes("seedha") ||
          response.toLowerCase().includes("brokerage"),
      ).toBe(true);
    });

    it("answers zero-brokerage questions clearly", async () => {
      const response = await askSeedhaAI("Is there any brokerage or commission fee?");
      expect(
        response.toLowerCase().includes("0%") ||
          response.toLowerCase().includes("brokerage") ||
          response.toLowerCase().includes("commission") ||
          response.toLowerCase().includes("zero"),
      ).toBe(true);
    });
  });
});
