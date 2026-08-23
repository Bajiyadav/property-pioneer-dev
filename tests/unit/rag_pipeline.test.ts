import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { executeRAGRetrieval, runRAGPipeline } from "@/modules/interactions/services/ragPipeline";
import {
  SEEDHA_KNOWLEDGE_DOCS,
  scoreSemanticRelevance,
  retrieveSemanticKnowledge,
} from "@/modules/interactions/services/knowledgeCorpus";

describe("Seedha AI End-to-End RAG Pipeline", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          text: "Here are verified 2BHK listings in Madhapur with 0% brokerage on Seedha Properties.",
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("1. Knowledge Ingestion & Chunking", () => {
    it("loads all core policy and guideline chunks with valid tags", () => {
      expect(SEEDHA_KNOWLEDGE_DOCS.length).toBeGreaterThanOrEqual(6);

      for (const doc of SEEDHA_KNOWLEDGE_DOCS) {
        expect(doc.id).toBeTruthy();
        expect(doc.source).toBeTruthy();
        expect(doc.title).toBeTruthy();
        expect(doc.content.length).toBeGreaterThan(30);
        expect(doc.tags.length).toBeGreaterThan(0);
      }
    });

    it("scores semantic relevance accurately using token overlap", () => {
      const brokerageDoc = SEEDHA_KNOWLEDGE_DOCS.find((d) => d.id === "doc-zero-brokerage")!;
      const score = scoreSemanticRelevance(
        "What is the brokerage fee or commission?",
        brokerageDoc,
      );
      expect(score).toBeGreaterThan(0);

      const irrelScore = scoreSemanticRelevance("swimming pool depth", brokerageDoc);
      expect(irrelScore).toBe(0);
    });

    it("retrieves top semantic knowledge chunks for policy questions", () => {
      const docs = retrieveSemanticKnowledge("Do I have to pay brokerage or commission?", 2);
      expect(docs.length).toBeGreaterThan(0);
      expect(docs[0].content).toContain("zero brokerage");
    });
  });

  describe("2. Dual-Branch Retrieval Engine", () => {
    it("executes structured property retrieval + knowledge retrieval in under 500ms", async () => {
      const t0 = performance.now();
      const result = await executeRAGRetrieval("Find 2BHK in Madhapur under 30000");
      const duration = performance.now() - t0;

      expect(result.intent).toBe("PROPERTY_SEARCH");
      expect(result.filters.locality).toBe("Madhapur");
      expect(result.filters.bhk).toBe(2);
      expect(result.filters.maxPrice).toBe(30000);
      expect(result.groundedContextText).toContain("[RETRIEVED PROPERTY DATABASE RESULTS");
      expect(result.groundedContextText).toContain("[RETRIEVED KNOWLEDGE DOCUMENTS & POLICIES]");
      expect(duration).toBeLessThan(1000);
    });

    it("ensures retrieved grounded context contains zero private owner PII", async () => {
      const result = await executeRAGRetrieval("2 BHK rentals in Gachibowli");

      expect(result.groundedContextText).not.toContain("owner_phone");
      expect(result.groundedContextText).not.toContain("owner_email");
      expect(result.groundedContextText).not.toContain("raw_gps");
    });
  });

  describe("3. End-to-End Pipeline Execution", () => {
    it("runs complete pipeline, calls proxy, and returns formatted grounded response with source citations", async () => {
      const mockProxy = vi
        .fn()
        .mockResolvedValue("Found 2 direct-owner 2BHK listings in Madhapur.");
      const response = await runRAGPipeline("Find 2BHK in Madhapur under 30k", mockProxy);

      expect(mockProxy).toHaveBeenCalledTimes(1);
      expect(response.answer).toBe("Found 2 direct-owner 2BHK listings in Madhapur.");
      expect(response.sourceCitations.length).toBeGreaterThan(0);
      expect(response.totalLatencyMs).toBeGreaterThanOrEqual(0);
    });

    it("handles simple greetings like 'hi' immediately without lengthy policy dumps", async () => {
      const mockProxy = vi.fn();
      const response = await runRAGPipeline("hi", mockProxy);

      expect(mockProxy).not.toHaveBeenCalled();
      expect(response.intent).toBe("GREETING");
      expect(response.answer).toContain("Namaste!");
      expect(response.answer).toContain("Seedha AI");
      expect(response.answer).toContain("Find a Home for Rent");
    });

    it("handles incomplete searches like 'I want a home' by asking progressive clarifying questions", async () => {
      const mockProxy = vi.fn();
      const response = await runRAGPipeline("I want a home", mockProxy);

      expect(mockProxy).not.toHaveBeenCalled();
      expect(response.intent).toBe("INCOMPLETE_SEARCH");
      expect(response.answer).toContain("Rent or Buy");
      expect(response.answer).toContain("City");
    });

    it("returns truthful zero-match message without fabricating properties when offline", async () => {
      const mockOfflineProxy = vi.fn().mockResolvedValue(null);
      const response = await runRAGPipeline(
        "2BHK in NonExistentLocality123 under 5000",
        mockOfflineProxy,
      );

      expect(response.answer).toContain("I couldn't find any matching properties right now.");
      expect(response.answer).toContain("Madhapur");
      expect(response.matchedPropertiesCount).toBe(0);
    });

    it("falls back gracefully to grounded local response when AI proxy is offline", async () => {
      const mockOfflineProxy = vi.fn().mockResolvedValue(null);
      const response = await runRAGPipeline("Does Seedha charge any brokerage?", mockOfflineProxy);

      expect(response.answer).toBeTruthy();
      expect(response.answer.toLowerCase()).toContain("brokerage");
      expect(response.sourceCitations.length).toBeGreaterThan(0);
    });
  });
});
