import { describe, it, expect } from "vitest";
import {
  SEEDHA_SYSTEM_PROMPT,
  retrieveDynamicContext,
  askSeedhaAI,
} from "@/modules/interactions/services/geminiService";

describe("Seedha Gemini AI Assistant (System Instructions + RAG)", () => {
  it("includes 0% brokerage and direct-owner domain knowledge in system prompt", () => {
    expect(SEEDHA_SYSTEM_PROMPT).toContain("0% Brokerage");
    expect(SEEDHA_SYSTEM_PROMPT).toContain("Direct-Owner");
    expect(SEEDHA_SYSTEM_PROMPT).toContain("Hyderabad");
    expect(SEEDHA_SYSTEM_PROMPT).toContain("Bengaluru");
    expect(SEEDHA_SYSTEM_PROMPT).toContain("Verified Owner");
  });

  it("retrieves accurate dynamic context snippets based on user queries", () => {
    const listingContext = retrieveDynamicContext("How to post my flat?");
    expect(listingContext).toContain("Listing Guide Context");

    const kycContext = retrieveDynamicContext("Tell me about verified badge");
    expect(kycContext).toContain("KYC Trust Context");

    const brokerageContext = retrieveDynamicContext("What is the fee or commission?");
    expect(brokerageContext).toContain("Brokerage Policy Context");
  });

  it("handles listing inquiries with direct owner guidance", { timeout: 30000 }, async () => {
    const response = await askSeedhaAI("How do I list my apartment for rent?");
    expect(response.length).toBeGreaterThan(20);
    expect(
      response.toLowerCase().includes("list") ||
        response.toLowerCase().includes("seedha") ||
        response.toLowerCase().includes("owner") ||
        response.toLowerCase().includes("brokerage"),
    ).toBe(true);
  });

  it("answers zero-brokerage questions clearly", { timeout: 30000 }, async () => {
    const response = await askSeedhaAI("Is there any brokerage or commission fee?");
    expect(
      response.toLowerCase().includes("0%") ||
        response.toLowerCase().includes("brokerage") ||
        response.toLowerCase().includes("commission") ||
        response.toLowerCase().includes("zero"),
    ).toBe(true);
  });
});
