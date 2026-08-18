import { describe, it, expect } from "vitest";
import { SEEDHA_SYSTEM_PROMPT, askSeedhaAI } from "@/modules/interactions/services/geminiService";

describe("Seedha Gemini AI Assistant", () => {
  it("includes 0% brokerage and direct-owner domain knowledge in system prompt", () => {
    expect(SEEDHA_SYSTEM_PROMPT).toContain("0% Brokerage");
    expect(SEEDHA_SYSTEM_PROMPT).toContain("Direct-Owner");
    expect(SEEDHA_SYSTEM_PROMPT).toContain("Hyderabad");
    expect(SEEDHA_SYSTEM_PROMPT).toContain("Bengaluru");
    expect(SEEDHA_SYSTEM_PROMPT).toContain("Verified Owner");
  });

  it("handles listing inquiries with direct owner guidance", { timeout: 15000 }, async () => {
    const response = await askSeedhaAI("How do I list my apartment for rent?");
    expect(response.length).toBeGreaterThan(20);
    expect(
      response.toLowerCase().includes("list") ||
        response.toLowerCase().includes("seedha") ||
        response.toLowerCase().includes("owner") ||
        response.toLowerCase().includes("brokerage"),
    ).toBe(true);
  });

  it("answers zero-brokerage questions clearly", { timeout: 15000 }, async () => {
    const response = await askSeedhaAI("Is there any brokerage or commission fee?");
    expect(
      response.toLowerCase().includes("0%") ||
        response.toLowerCase().includes("brokerage") ||
        response.toLowerCase().includes("commission") ||
        response.toLowerCase().includes("zero"),
    ).toBe(true);
  });
});
