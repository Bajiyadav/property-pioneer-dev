/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import {
  type KnowledgeChunk,
  retrieveSemanticKnowledge,
  SEEDHA_KNOWLEDGE_DOCS,
} from "./knowledgeCorpus";
import {
  type RAGResponse,
  type RAGRetrievalResult,
  runRAGPipeline,
  executeRAGRetrieval,
} from "./ragPipeline";

export interface AIMessage {
  role: "user" | "model" | "system";
  text: string;
}

export interface ExtractedTenantPreferences {
  city?: string;
  locality?: string;
  budget_min?: number;
  budget_max?: number;
  bhk?: string;
  phone?: string;
}

export type AIIntent =
  | "GREETING"
  | "INCOMPLETE_SEARCH"
  | "PROPERTY_SEARCH"
  | "PROPERTY_DETAIL"
  | "SEEDHA_KNOWLEDGE"
  | "GENERAL"
  | "MIXED";

export interface ExtractedPropertyFilters {
  intent: AIIntent;
  locality?: string;
  city?: string;
  bhk?: number;
  maxPrice?: number;
  minPrice?: number;
  listingType?: "rent" | "sale";
  furnishing?: string;
  amenities?: string[];
}

export const TENANT_SYSTEM_PROMPT = `
You are Seedha AI, helping tenants find rental properties.

TENANT CONVERSATION GOALS:
1. Identify city/locality (REQUIRED)
2. Get budget range (REQUIRED)
3. Ask preferred BHK (REQUIRED)
4. Get phone number (REQUIRED)
5. Optional: Furnishing, amenities, move-in date

CONVERSATION STYLE:
- Friendly, conversational (not form-like)
- Ask one thing at a time
- Confirm understanding: "So 2BHK in Madhapur, ₹25K. Right?"
- When all required data collected: Extract & confirm
- Suggest properties once profile complete

EXTRACTION RULES:
- Extract: city, locality, budget_min, budget_max, bhk, phone
- From: "I want 2bhk in madhapur around 25k"
  Extract: { "city": "Hyderabad", "locality": "Madhapur", "bhk": "2BHK", "budget_max": 25000 }
- Ask confirmation before showing results

PROPERTY RECOMMENDATIONS:
- Show top matches first with match score.
- Include: Price, BHK, Location, Commute time (if available).
- One-tap inquiry: "Interested? Share your phone to contact owner"

AVOID:
- Don't ask all questions at once
- Don't ask company, salary, personal details upfront
- Don't show properties before location is set
- Don't force profile completion
`;

export const SEEDHA_SYSTEM_PROMPT = `
You are "Seedha AI", the official, expert, and friendly AI real estate concierge for SEEDHA PROPERTIES (seedhaproperties.com).
Your mission is to empower tenants, buyers, and property owners across India with 100% transparency, verified listings, and 0% brokerage.

CORE PLATFORM PRINCIPLES:
1. 0% Brokerage & Direct-Owner Guarantee: We connect seekers directly with verified property owners. Neither renters nor buyers ever pay brokerage or commission fees.
2. Pan-India Metros Covered:
   - Hyderabad: Madhapur, HITEC City, Gachibowli, Kondapur, Financial District, Jubilee Hills, Banjara Hills, Manikonda, Kukatpally, Tellapur, Nanakramguda, Kokapet.
   - Bengaluru: Whitefield, Indiranagar, HSR Layout, Koramangala, Electronic City, Bellandur, Sarjapur Road, Manyata Tech Park, Marathahalli, Hebbal.
   - Mumbai: Bandra-Kurla Complex (BKC), Powai, Andheri East/West, Lower Parel, Thane, Navi Mumbai, Juhu, Worli.
   - Delhi-NCR: Cyber City Gurgaon, Golf Course Road, Sector 62 Noida, Greater Noida, South Extension, Dwarka.
   - Chennai: OMR (Old Mahabalipuram Road), Guindy, Velachery, Anna Nagar, T. Nagar, ECR.
   - Pune: Hinjewadi Phase 1/2/3, Kharadi, Viman Nagar, Baner, Wakad, Kothrud, Magarpatta.
3. Owner Listing & Moderation:
   - 6-Stage Listing Wizard: Location -> Property Type -> Details & BHK -> Pricing & Terms -> Real Photos -> Owner Contact.
   - Auto-Draft Preservation: Users never lose form data if prompted to authenticate before final submission.
   - Moderation Queue: Every listing is reviewed by administrators for quality, genuine photos, and accurate contact before going live.
4. Trust & Badging Architecture:
   - "✓ Direct Owner": Direct contact with the property owner with zero intermediary commission.
   - "✓ Owner Verified" / "✓ Verified Owner": Verified identity via Aadhaar, PAN, or Utility/Electricity bills.
   - "✓ Property Verified": Verified property authenticity and documentation.
5. Key Visitor Tools & Services:
   - Online Rental Agreements (/rental-agreement): 4-step guided rental agreement creation, customizable tenancy terms & standard clauses, instant document preview, PDF download, and browser printing.
   - Schedule Visit: Book in-person walkthroughs or digital video tours directly on any property page.
   - Direct Contact / WhatsApp: Instant connect with property owners without middleman delays.
   - Commute Estimator: Real-time drive times to major tech parks & employment hubs.
   - EMI & Rent Calculator: Transparent monthly breakdown of rent, deposit, and maintenance.

COMMUNICATION STYLE:
- Helpful, conversational, clear, and professional.
- Avoid repetitive or generic template answers; address the user's specific locality, budget, or question directly.
- Use clean formatting, bullet points, and rupee symbol (₹) for pricing.
`;

/**
 * Intent classification and structured filter extraction for Seedha AI Hybrid RAG.
 */
export function classifyAndExtractIntent(query: string): ExtractedPropertyFilters {
  const q = query.toLowerCase();
  const trimmed = q.trim();
  const isGreeting =
    /^(hi|hello|hey|namaste|helo|hii|hiii|good morning|good afternoon|good evening|start|help|who are you)\b/i.test(
      trimmed,
    ) && trimmed.split(/\s+/).length <= 4;

  const hasPropertySearchTerms =
    /\b(bhk|bedroom|flat|apartment|house|villa|rent|buy|budget|price|under|below|near|locality|deposit|home|room)\b/i.test(
      q,
    );
  const hasKnowledgeTerms =
    /\b(brokerage|commission|fee|how to list|how to post|kyc|verification|badge|schedule|visit|policy|refund|terms|safe|contact owner|rules|documents|agreement|rental agreement|rent agreement|stamp duty|e-stamp|esign|aadhaar)\b/i.test(
      q,
    );

  let intent: AIIntent = "GENERAL";
  if (isGreeting) {
    intent = "GREETING";
  } else if (hasPropertySearchTerms && hasKnowledgeTerms) {
    intent = "MIXED";
  } else if (hasPropertySearchTerms) {
    intent = "PROPERTY_SEARCH";
  } else if (hasKnowledgeTerms) {
    intent = "SEEDHA_KNOWLEDGE";
  }

  const knownLocalities: Record<string, string> = {
    madhapur: "Hyderabad",
    gachibowli: "Hyderabad",
    kondapur: "Hyderabad",
    "hitec city": "Hyderabad",
    hitec: "Hyderabad",
    "jubilee hills": "Hyderabad",
    jubilee: "Hyderabad",
    "banjara hills": "Hyderabad",
    banjara: "Hyderabad",
    manikonda: "Hyderabad",
    kukatpally: "Hyderabad",
    tellapur: "Hyderabad",
    nanakramguda: "Hyderabad",
    kokapet: "Hyderabad",
    whitefield: "Bengaluru",
    indiranagar: "Bengaluru",
    "hsr layout": "Bengaluru",
    hsr: "Bengaluru",
    koramangala: "Bengaluru",
    "electronic city": "Bengaluru",
    bellandur: "Bengaluru",
    sarjapur: "Bengaluru",
    bkc: "Mumbai",
    bandra: "Mumbai",
    powai: "Mumbai",
    andheri: "Mumbai",
    hinjewadi: "Pune",
    kharadi: "Pune",
    wakad: "Pune",
    baner: "Pune",
  };

  let locality: string | undefined;
  let city: string | undefined;

  for (const [loc, locCity] of Object.entries(knownLocalities)) {
    if (q.includes(loc)) {
      locality = loc.charAt(0).toUpperCase() + loc.slice(1);
      city = locCity;
      break;
    }
  }

  if (!city) {
    if (q.includes("hyderabad")) city = "Hyderabad";
    else if (q.includes("bengaluru") || q.includes("bangalore")) city = "Bengaluru";
    else if (q.includes("mumbai")) city = "Mumbai";
    else if (q.includes("pune")) city = "Pune";
    else if (
      q.includes("delhi") ||
      q.includes("ncr") ||
      q.includes("gurgaon") ||
      q.includes("noida")
    )
      city = "Delhi NCR";
    else if (q.includes("chennai")) city = "Chennai";
  }

  let bhk: number | undefined;
  const bhkMatch = q.match(/\b([1-4])\s*(?:bhk|bedroom|bed)\b/i);
  if (bhkMatch) {
    bhk = parseInt(bhkMatch[1], 10);
  }

  let maxPrice: number | undefined;
  const maxPriceKMatch = q.match(
    /(?:under|below|within|upto|up to|max(?:imum)?)\s*(?:₹|rs\.?)?\s*(\d+)\s*k\b/i,
  );
  if (maxPriceKMatch) {
    maxPrice = parseInt(maxPriceKMatch[1], 10) * 1000;
  } else {
    const maxPriceNumMatch = q.match(
      /(?:under|below|within|upto|up to|max(?:imum)?)\s*(?:₹|rs\.?)?\s*(\d{4,7})\b/i,
    );
    if (maxPriceNumMatch) {
      maxPrice = parseInt(maxPriceNumMatch[1], 10);
    }
  }

  let listingType: "rent" | "sale" | undefined;
  if (q.includes("buy") || q.includes("purchase") || q.includes("for sale")) {
    listingType = "sale";
  } else if (q.includes("rent") || q.includes("lease")) {
    listingType = "rent";
  }

  const amenities: string[] = [];
  if (q.includes("parking") || q.includes("car park")) amenities.push("Parking");
  if (q.includes("gym") || q.includes("fitness")) amenities.push("Gym");
  if (q.includes("lift") || q.includes("elevator")) amenities.push("Lift");
  if (q.includes("pool") || q.includes("swimming")) amenities.push("Pool");

  let furnishing: string | undefined;
  if (q.includes("fully furnished") || q.includes("furnished")) furnishing = "Full";
  else if (q.includes("semi furnished") || q.includes("semi-furnished")) furnishing = "Semi";
  else if (q.includes("unfurnished")) furnishing = "None";

  return {
    intent,
    locality,
    city,
    bhk,
    maxPrice,
    minPrice: undefined,
    listingType,
    furnishing,
    amenities: amenities.length > 0 ? amenities : undefined,
  };
}

export function retrieveDynamicContext(query: string): string {
  const docs = retrieveSemanticKnowledge(query, 3);
  return docs.map((d) => `[${d.title}]: ${d.content}`).join("\n\n");
}

export function retrieveKnowledgeDocuments(query: string): string {
  const docs = retrieveSemanticKnowledge(query, 3);
  return (
    `[RETRIEVED SEEDHA POLICIES & KNOWLEDGE]:\n` +
    docs.map((d) => `• [${d.source}]: ${d.content}`).join("\n\n")
  );
}

export async function retrieveStructuredProperties(
  filters: ExtractedPropertyFilters,
): Promise<{ count: number; text: string; properties: any[] }> {
  try {
    let queryBuilder = (supabase.from as any)("properties")
      .select(
        "id, title, locality, city, price, rent_amount, bedrooms, bathrooms, property_type, furnishing, is_featured, image_urls",
      )
      .limit(5);

    if (filters.city) {
      queryBuilder = queryBuilder.ilike("city", `%${filters.city}%`);
    }

    if (filters.locality) {
      queryBuilder = queryBuilder.or(
        `locality.ilike.%${filters.locality}%,address.ilike.%${filters.locality}%`,
      );
    }

    if (filters.bhk) {
      queryBuilder = queryBuilder.eq("bedrooms", filters.bhk);
    }

    if (filters.maxPrice) {
      queryBuilder = queryBuilder.lte("price", filters.maxPrice);
    }

    if (filters.listingType) {
      queryBuilder = queryBuilder.eq("listing_type", filters.listingType);
    }

    const { data: properties, error } = await queryBuilder;

    if (error || !properties || properties.length === 0) {
      return {
        count: 0,
        text: `[RETRIEVED SEEDHA PROPERTY DATA]:\nNo matching live properties found in database for the specified criteria (${filters.locality || filters.city || "requested area"}, ${filters.bhk ? `${filters.bhk} BHK` : "any BHK"}, ${filters.maxPrice ? `max ₹${filters.maxPrice.toLocaleString("en-IN")}` : "any budget"}).`,
        properties: [],
      };
    }

    const summary = properties
      .map((p: any) => {
        const cost = (p.rent_amount || p.price || 0).toLocaleString("en-IN");
        return `• [ID: ${p.id}] ${p.title} (${p.bedrooms || 2} BHK ${p.property_type || "Apartment"}) in ${p.locality || p.city} - ₹${cost}/month. Photos: ${p.image_urls?.length || 0}. URL: /properties/${p.id}`;
      })
      .join("\n");

    return {
      count: properties.length,
      text: `[RETRIEVED SEEDHA PROPERTY DATA (${properties.length} MATCHING LISTINGS)]:\n${summary}`,
      properties,
    };
  } catch (err) {
    return {
      count: 0,
      text: "[RETRIEVED SEEDHA PROPERTY DATA]:\nNo matching live properties found in database for the specified criteria (query completed with 0 results).",
      properties: [],
    };
  }
}

async function callAiProxy(
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
): Promise<string | null> {
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string; unconfigured?: boolean };
    if (data.unconfigured) return null;
    return data.text ?? null;
  } catch (error) {
    console.warn("[geminiService] AI proxy unreachable:", error);
    return null;
  }
}

export async function askSeedhaAI(
  userQuery: string,
  history: AIMessage[] = [],
  mode: "general" | "tenant" = "general",
): Promise<string> {
  const result: RAGResponse = await runRAGPipeline(userQuery, callAiProxy);
  return result.answer;
}

export async function extractTenantPreferences(
  history: AIMessage[],
): Promise<ExtractedTenantPreferences> {
  const prompt = `
Extract the tenant preferences from this conversation.
Return a valid JSON object with the following optional string/number fields (do not wrap in markdown tags):
- city (e.g. Hyderabad, Bengaluru)
- locality (e.g. Madhapur, HSR Layout)
- budget_min (number)
- budget_max (number)
- bhk (e.g. "2 BHK")
- phone (e.g. "+91 9876543210")

Conversation:
${history.map((m) => m.role + ": " + m.text).join("\n")}
  `;

  const text = await callAiProxy([{ role: "user", parts: [{ text: prompt }] }]);
  if (!text) return {};
  try {
    return JSON.parse(text) as ExtractedTenantPreferences;
  } catch {
    return {};
  }
}

export {
  runRAGPipeline,
  executeRAGRetrieval,
  retrieveSemanticKnowledge,
  SEEDHA_KNOWLEDGE_DOCS,
  type KnowledgeChunk,
  type RAGResponse,
  type RAGRetrievalResult,
};
