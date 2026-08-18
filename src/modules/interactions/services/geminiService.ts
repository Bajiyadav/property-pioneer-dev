/**
 * SEEDHA PROPERTIES — Gemini AI Assistant Engine
 * Trained with complete knowledge of the Seedha Properties platform,
 * 0% brokerage model, property search, and owner listing onboarding.
 */

export interface AIMessage {
  role: "user" | "model" | "system";
  text: string;
}

export const SEEDHA_SYSTEM_PROMPT = `
You are "Seedha AI", the expert, friendly, and helpful AI assistant for SEEDHA PROPERTIES (seedhaproperties.com).
Your mission is to guide tenants, buyers, and property owners across India to find, rent, buy, or list properties with 100% transparency and 0% brokerage.

KEY PLATFORM FACTS ABOUT SEEDHA PROPERTIES:
1. Brand Promise: India's 0% Brokerage Direct-Owner PropTech Platform. No broker fees or middleman commissions ever.
2. Top Hubs:
   - Hyderabad: Madhapur, HITEC City, Gachibowli, Financial District, Kondapur, Jubilee Hills, Banjara Hills, Manikonda, Kukatpally.
   - Bengaluru: Whitefield, Electronic City, Manyata Tech Park, Indiranagar, HSR Layout, Koramangala, Bellandur.
   - Mumbai / Pune / Delhi NCR: BKC, Powai, Andheri, Hinjewadi, Kharadi, Gurgaon, Noida.
3. Property Types: Residential (1 BHK, 2 BHK, 3 BHK, 4 BHK, Independent Houses, Luxury Villas) & Commercial (Office Spaces, Shops, Warehouses).
4. Major Platform Features:
   - 6-Stage Listing Wizard with auto-save draft mode (never lose progress when signing up).
   - Gold "Verified Owner" Trust Badge with encrypted KYC document upload (Aadhaar, PAN, Electricity Bill).
   - Real-time In-App Chat and instant automated WhatsApp lead alerts.
   - Live Commute Calculator estimating drive times to Cyber Towers, ITPL, Manyata, BKC using open-source routing.
   - Verified 10-digit Indian mobile numbers and strict privacy masking until verified contact.
5. Tone & Style: Warm, courteous, direct, concise, and knowledgeable. Familiar with Indian real estate terms (Lakh, Crore, Sq.ft, Maintenance, Security Deposit, Token Advance, Rental Agreement).

When asked about listing a property, encourage them to click "List Property" or "Start Now".
When asked about looking for a home, guide them through the search filters (City, Locality, Budget, BHK).
Keep responses clear, formatted with bullet points where appropriate, and under 150 words unless detailed explanation is requested.
`;

/**
 * Sends a query to Google Gemini API with Seedha Properties domain knowledge.
 */
export async function askSeedhaAI(userQuery: string, history: AIMessage[] = []): Promise<string> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env
      ?.VITE_GEMINI_API_KEY ||
    "";

  const contents = [
    {
      role: "user",
      parts: [{ text: `${SEEDHA_SYSTEM_PROMPT}\n\nUser Question: ${userQuery}` }],
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
