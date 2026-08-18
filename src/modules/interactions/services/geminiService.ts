/**
 * SEEDHA PROPERTIES — Gemini AI Assistant Engine (Prompt Engineering + RAG)
 * Combines structured system instructions with dynamic context retrieval
 * (FAQs, live listing guidelines, pricing, and metro hubs) for 100% accurate grounding.
 */

export interface AIMessage {
  role: "user" | "model" | "system";
  text: string;
}

export const SEEDHA_SYSTEM_PROMPT = `
You are "Seedha AI", the official, expert, and friendly AI assistant for SEEDHA PROPERTIES (seedhaproperties.com).
Your mission is to guide tenants, buyers, and property owners across India with 100% transparency and 0% brokerage.

KEY PLATFORM FACTS:
1. Brand Promise: India's premier 0% Brokerage Direct-Owner PropTech Platform. No commission or middleman charges for tenants or owners.
2. Top Hubs:
   - Hyderabad: Madhapur, HITEC City, Gachibowli, Financial District, Kondapur, Jubilee Hills, Banjara Hills, Manikonda, Kukatpally.
   - Bengaluru: Whitefield, Electronic City, Manyata Tech Park, Indiranagar, HSR Layout, Koramangala, Bellandur.
   - Mumbai / Pune / Delhi NCR: BKC, Powai, Andheri, Hinjewadi, Kharadi, Gurgaon, Noida.
3. Key Features:
   - 6-Stage Listing Wizard with auto-draft preservation (never lose input when signing up).
   - Gold "Verified Owner" Trust Badge with encrypted KYC document verification (Aadhaar, PAN, Electricity Bill).
   - Real-time in-app chat & instant WhatsApp lead notifications.
   - Live Commute Calculator estimating drive times to IT corridors using open-source OSRM routing.
4. Rules:
   - Be concise, professional, and friendly (use bullet points when listing steps).
   - Never invent fees or brokerage; we are always 0% brokerage.
   - If unsure about specific private account details, advise contacting support@seedhaproperties.com.
`;

/**
 * Dynamic Knowledge Grounding (RAG Context Retriever)
 */
export function retrieveDynamicContext(query: string): string {
  const q = query.toLowerCase();
  const contexts: string[] = [];

  if (q.includes("list") || q.includes("owner") || q.includes("sell") || q.includes("post")) {
    contexts.push(
      "[Listing Guide Context]: Owners can list properties 100% free with 0% brokerage by tapping 'List Property'. Features include 6-step guided wizard, photo uploads, amenities selection, and auto-saved draft recovery.",
    );
  }

  if (q.includes("kyc") || q.includes("badge") || q.includes("verify") || q.includes("trust")) {
    contexts.push(
      "[KYC Trust Context]: Owners can get the Gold 'Verified Owner' Badge by submitting Aadhaar, PAN, Electricity Bill, or Property Tax receipts in Owner Dashboard > KYC. Verified properties get 3.5x higher inquiries.",
    );
  }

  if (
    q.includes("brokerage") ||
    q.includes("fee") ||
    q.includes("commission") ||
    q.includes("price")
  ) {
    contexts.push(
      "[Brokerage Policy Context]: Seedha Properties charges 0% brokerage. Direct owners and seekers connect directly without paying any commission.",
    );
  }

  if (
    q.includes("commute") ||
    q.includes("distance") ||
    q.includes("time") ||
    q.includes("hitec") ||
    q.includes("bkc")
  ) {
    contexts.push(
      "[Commute Routing Context]: We provide live drive times using OSRM to major IT Parks (Cyber Towers, Madhapur, Manyata Tech Park, Electronic City, BKC).",
    );
  }

  return contexts.length > 0
    ? contexts.join("\n")
    : "[General Context]: Real-time verified direct-owner PropTech marketplace.";
}

/**
 * Sends a query to Google Gemini API with System Prompt + Dynamic RAG Context.
 */
export async function askSeedhaAI(userQuery: string, history: AIMessage[] = []): Promise<string> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env
      ?.VITE_GEMINI_API_KEY ||
    "";

  const dynamicContext = retrieveDynamicContext(userQuery);

  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `${SEEDHA_SYSTEM_PROMPT}\n\n[RELEVANT WEBSITE CONTEXT RETRIEVED]:\n${dynamicContext}\n\n[USER QUESTION]:\n${userQuery}`,
        },
      ],
    },
  ];

  // Append recent conversational context
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

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      },
    );

    if (!response.ok) {
      // Fallback try gemini-flash-latest endpoint
      const fallbackRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents }),
        },
      );

      if (!fallbackRes.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data = await fallbackRes.json();
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Hello! I am Seedha AI. You can explore direct-owner properties or list your home with 0% brokerage!"
      );
    }

    const data = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Hello! I am Seedha AI. You can explore direct-owner properties or list your home with 0% brokerage!"
    );
  } catch (error) {
    console.warn("[geminiService] Error calling Gemini, using smart fallback:", error);
    // Intelligent local fallback responding with Seedha domain knowledge
    const q = userQuery.toLowerCase();
    if (q.includes("list") || q.includes("owner") || q.includes("sell") || q.includes("rent out")) {
      return "To list your property on Seedha Properties with 0% brokerage, click the 'List Property' button in the top navigation or use our 6-step listing wizard. You can save drafts, upload photos, and get verified leads directly on WhatsApp!";
    }
    if (q.includes("brokerage") || q.includes("fee") || q.includes("commission")) {
      return "Seedha Properties is 100% direct-owner with 0% brokerage! Neither tenants nor owners pay any commission or middleman charges.";
    }
    if (
      q.includes("hyderabad") ||
      q.includes("madhapur") ||
      q.includes("bengaluru") ||
      q.includes("bangalore")
    ) {
      return "We have hundreds of verified direct-owner listings across major IT corridors including Madhapur, HITEC City, Gachibowli in Hyderabad, and Whitefield, Electronic City, Manyata in Bengaluru. Use our search filters to find your ideal home!";
    }
    return "Hello! I am your Seedha Properties AI Assistant. I can help you search properties, calculate commute times, list your home with 0% brokerage, or get verified owner trust status. How can I help you today?";
  }
}
