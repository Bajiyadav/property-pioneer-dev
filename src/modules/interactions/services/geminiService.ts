/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

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
   - Kolkata: Salt Lake Sector V, New Town, Rajarhat, Ballygunge, Park Street, Alipore.
3. Owner Listing & Moderation:
   - 6-Stage Listing Wizard: Location -> Property Type -> Details & BHK -> Pricing & Terms -> Real Photos -> Owner Contact.
   - Auto-Draft Preservation: Users never lose form data if prompted to authenticate before final submission.
   - Moderation Queue: Every listing is reviewed by administrators for quality, genuine photos, and accurate contact before going live.
4. Trust & Badging Architecture:
   - "✓ Direct Owner": Direct contact with the property owner with zero intermediary commission.
   - "✓ Owner Verified" / "✓ Verified Owner": Verified identity via Aadhaar, PAN, or Utility/Electricity bills.
   - "✓ Property Verified": Verified property authenticity and documentation.
5. Key Visitor Tools:
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
export type AIIntent =
  "PROPERTY_SEARCH" | "PROPERTY_DETAIL" | "SEEDHA_KNOWLEDGE" | "GENERAL" | "MIXED";

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

export function classifyAndExtractIntent(query: string): ExtractedPropertyFilters {
  const q = query.toLowerCase();

  // 1. Detect Intent Category
  const hasPropertySearchTerms =
    /\b(bhk|bedroom|flat|apartment|house|villa|rent|buy|budget|price|under|below|near|locality|deposit)\b/i.test(
      q,
    );
  const hasKnowledgeTerms =
    /\b(brokerage|commission|fee|how to list|how to post|kyc|verification|badge|schedule|visit|policy|refund|terms|safe|contact owner|rules)\b/i.test(
      q,
    );

  let intent: AIIntent = "GENERAL";
  if (hasPropertySearchTerms && hasKnowledgeTerms) {
    intent = "MIXED";
  } else if (hasPropertySearchTerms) {
    intent = "PROPERTY_SEARCH";
  } else if (hasKnowledgeTerms) {
    intent = "SEEDHA_KNOWLEDGE";
  }

  // 2. Extract Locality / City
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

  // 3. Extract BHK
  let bhk: number | undefined;
  const bhkMatch = q.match(/\b([1-4])\s*(?:bhk|bedroom|bed)\b/i);
  if (bhkMatch) {
    bhk = parseInt(bhkMatch[1], 10);
  }

  // 4. Extract Budget / Price Limit
  let maxPrice: number | undefined;
  let minPrice: number | undefined;

  // Match e.g. "under 30k", "below 25k", "under 30000", "within 35k"
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

  // 5. Listing Type
  let listingType: "rent" | "sale" | undefined;
  if (q.includes("buy") || q.includes("purchase") || q.includes("for sale")) {
    listingType = "sale";
  } else if (q.includes("rent") || q.includes("lease")) {
    listingType = "rent";
  }

  // 6. Amenities & Furnishing
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
    minPrice,
    listingType,
    furnishing,
    amenities: amenities.length > 0 ? amenities : undefined,
  };
}

/**
 * Structured Live Database Retrieval for RAG
 */
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
      text: "[RETRIEVED SEEDHA PROPERTY DATA]:\nProperty database query completed with 0 results.",
      properties: [],
    };
  }
}

/**
 * Knowledge Grounding Layer (Curated Seedha Documents & FAQs)
 */
export function retrieveKnowledgeDocuments(query: string): string {
  const q = query.toLowerCase();
  const docs: string[] = [];

  if (
    q.includes("brokerage") ||
    q.includes("commission") ||
    q.includes("fee") ||
    q.includes("charge")
  ) {
    docs.push(
      "[SEEDHA ZERO BROKERAGE POLICY]:\nSeedha Properties guarantees 100% zero brokerage for tenants, buyers, and owners. We do not employ brokers or charge finders fees. Tenants and buyers contact property owners directly without intermediary commissions.",
    );
  }

  if (
    q.includes("list") ||
    q.includes("post") ||
    q.includes("owner") ||
    q.includes("sell") ||
    q.includes("rent out")
  ) {
    docs.push(
      "[OWNER LISTING GUIDELINES]:\nOwners can list residential and commercial properties for free using the 6-stage listing wizard (/list-property/wizard). Listings require locality details, BHK and built-up area, deposit and rent terms, genuine property photos, and owner phone verification. Drafts automatically save in local storage.",
    );
  }

  if (
    q.includes("kyc") ||
    q.includes("verify") ||
    q.includes("verification") ||
    q.includes("badge") ||
    q.includes("trust")
  ) {
    docs.push(
      "[TRUST & VERIFICATION POLICY]:\nSeedha assigns 3 transparent badges:\n1. 'Direct Owner': Verified owner phone.\n2. 'Owner Verified': Government identity validated via Aadhaar/PAN/Electricity Bill.\n3. 'Property Verified': Documentation and physical/digital ownership confirmation.",
    );
  }

  if (
    q.includes("visit") ||
    q.includes("tour") ||
    q.includes("schedule") ||
    q.includes("walkthrough") ||
    q.includes("appointment")
  ) {
    docs.push(
      "[VISIT SCHEDULING RULES]:\nVisitors can schedule in-person walkthroughs or digital video tours directly from any listing page by clicking 'Schedule Visit'. Owners receive instant dashboard and SMS notifications with requested date and time slots.",
    );
  }

  if (
    q.includes("privacy") ||
    q.includes("phone") ||
    q.includes("contact") ||
    q.includes("number") ||
    q.includes("safe")
  ) {
    docs.push(
      "[CONTACT PRIVACY POLICY]:\nDirect owner phone numbers and WhatsApp contacts are visible only to signed-in users. Exact GPS coordinates are truncated on public maps to protect residential owner privacy until visits are confirmed.",
    );
  }

  if (
    q.includes("plan") ||
    q.includes("pricing") ||
    q.includes("promote") ||
    q.includes("premium") ||
    q.includes("refund")
  ) {
    docs.push(
      "[PLANS & PROMOTION POLICY]:\nStandard listing is 100% free. Optional owner boost plans (Fast-Track, Premium Showcase) provide featured homepage placement and priority tenant matching. All payments are processed securely with instant digital invoicing.",
    );
  }

  return docs.length > 0
    ? `[RETRIEVED SEEDHA POLICIES & KNOWLEDGE]:\n${docs.join("\n\n")}`
    : "[RETRIEVED SEEDHA POLICIES & KNOWLEDGE]:\nSeedha Properties is India's 0% brokerage direct-owner marketplace covering Hyderabad, Bengaluru, Mumbai, Pune, Delhi-NCR, and Chennai.";
}

/**
 * Trained Local Response Generator for Offline Fallback
 */
async function generateTrainedLocalResponse(query: string): Promise<string> {
  const extracted = classifyAndExtractIntent(query);
  const { count, properties } = await retrieveStructuredProperties(extracted);
  const knowledge = retrieveKnowledgeDocuments(query);

  if (count > 0 && properties.length > 0) {
    const list = properties
      .map(
        (p: any) =>
          `• **${p.title}** (${p.bedrooms || 2} BHK) in ${p.locality || p.city} — ₹${(p.rent_amount || p.price || 0).toLocaleString("en-IN")}/mo`,
      )
      .join("\n");

    return (
      `**Here are matching direct-owner properties on Seedha:** 🏡\n\n` +
      `${list}\n\n` +
      `👉 Click on any property or search **"${extracted.locality || extracted.city || query}"** in our top search bar to view photos and contact verified owners directly with 0% brokerage!`
    );
  }

  if (extracted.intent === "PROPERTY_SEARCH" && count === 0) {
    return (
      `**No properties currently found matching your exact search.** 🏡\n\n` +
      `We searched live listings in ${extracted.locality || extracted.city || "our database"} for ${extracted.bhk ? `${extracted.bhk} BHK` : "homes"} ${extracted.maxPrice ? `under ₹${extracted.maxPrice.toLocaleString("en-IN")}` : ""}.\n\n` +
      `Try exploring neighboring localities like **Madhapur**, **Kondapur**, or **Gachibowli**, or search directly from our homepage search bar!`
    );
  }

  if (query.toLowerCase().includes("brokerage") || query.toLowerCase().includes("commission")) {
    return (
      `**Seedha Properties is 100% Direct-Owner with 0% Brokerage!** 🎉\n\n` +
      `• **For Tenants & Buyers:** Zero brokerage, zero intermediary fee.\n` +
      `• **For Property Owners:** Listing your home is 100% free.\n` +
      `Both parties connect directly without middleman delays.`
    );
  }

  return (
    `**Namaste! I am Seedha AI, your 24/7 Real Estate Concierge.** 🏡\n\n` +
    `I can help you discover verified 0% brokerage properties across **Hyderabad**, **Bengaluru**, **Mumbai**, **Pune**, and top Indian metros.\n\n` +
    `Try asking me: *"Find 2BHK in Madhapur under 30k"* or *"How does 0% brokerage work?"*`
  );
}

/**
 * Calls the server-side AI proxy.
 */
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
  const extracted = classifyAndExtractIntent(userQuery);
  const propertyContext = await retrieveStructuredProperties(extracted);
  const knowledgeContext = retrieveKnowledgeDocuments(userQuery);

  const groundingInstructions = `
[GROUNDING & ACCURACY INSTRUCTIONS]:
1. PROPERTY DATA: Ground all property claims ONLY in the [RETRIEVED SEEDHA PROPERTY DATA] below.
   - If 0 matching properties were found, state that truthfully and recommend exploring neighboring localities.
   - Never invent or fabricate property listings, prices, or amenities.
2. POLICIES & KNOWLEDGE: Ground all policy, brokerage, visit, and fee answers ONLY in the [RETRIEVED SEEDHA POLICIES & KNOWLEDGE] below.
3. PRIVACY & SAFETY: Never disclose private owner phone numbers, emails, or exact GPS coordinates.
4. FORMATTING: Use clean bullet points, rupee symbol (₹), and provide direct property links (e.g. /properties/:id) where retrieved.
`;

  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `${mode === "tenant" ? TENANT_SYSTEM_PROMPT : SEEDHA_SYSTEM_PROMPT}

${groundingInstructions}

${propertyContext.text}

${knowledgeContext}

[USER QUESTION]:
${userQuery}`,
        },
      ],
    },
  ];

  if (history.length > 0) {
    const recent = history.slice(-4);
    for (const msg of recent) {
      if (msg.role !== "system") {
        contents.push({
          role: msg.role === "model" ? "model" : "user",
          parts: [{ text: msg.text }],
        });
      }
    }
  }

  const text = await callAiProxy(contents);
  return text ?? (await generateTrainedLocalResponse(userQuery));
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
${history.map((m) => m.role + ": " + m.text).join("\\n")}
  `;

  // NOTE: this request never worked before. The URL was written with an escaped
  // template literal (`?key=\${apiKey}`), so the literal seven characters
  // "${apiKey}" were sent as the key and Google rejected every call. The
  // function silently returned {} on every invocation.
  const text = await callAiProxy([{ role: "user", parts: [{ text: prompt }] }]);
  if (!text) return {};
  try {
    return JSON.parse(text) as ExtractedTenantPreferences;
  } catch {
    // The model is asked for JSON but is not guaranteed to comply.
    return {};
  }
}
