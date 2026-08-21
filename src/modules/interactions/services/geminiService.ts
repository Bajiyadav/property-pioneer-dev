/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

export interface AIMessage {
  role: "user" | "model" | "system";
  text: string;
}

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
 * Dynamic Knowledge Grounding (RAG Context Retriever)
 */
export function retrieveDynamicContext(query: string): string {
  const q = query.toLowerCase();
  const contexts: string[] = [];

  if (
    q.includes("list") ||
    q.includes("post") ||
    q.includes("owner") ||
    q.includes("sell") ||
    q.includes("rent out")
  ) {
    contexts.push(
      "[Listing Guide Context]: Owners list properties 100% free with 0% brokerage via the 6-step guided wizard (/list-property/wizard). Steps cover Locality, Property Type, BHK & Area, Pricing & Deposit, Photo Uploads (up to 5MB), and Contact verification. Drafts are automatically saved in local storage so no data is lost during login.",
    );
  }

  if (
    q.includes("kyc") ||
    q.includes("badge") ||
    q.includes("verify") ||
    q.includes("verification") ||
    q.includes("trust") ||
    q.includes("fake") ||
    q.includes("genuine")
  ) {
    contexts.push(
      "[KYC Trust Context]: Seedha Properties assigns three levels of trust badges: '✓ Direct Owner' (verified phone), '✓ Owner Verified' (identity validated via Aadhaar/PAN/Electricity Bill), and '✓ Property Verified' (inspected documentation). Verified listings receive up to 3.5x higher inquiries.",
    );
  }

  if (
    q.includes("brokerage") ||
    q.includes("fee") ||
    q.includes("commission") ||
    q.includes("charge") ||
    q.includes("hidden")
  ) {
    contexts.push(
      "[Brokerage Policy Context]: Seedha Properties strictly enforces a 0% Brokerage model. Direct owners, renters, and buyers communicate directly without paying any middleman commission or finders fee.",
    );
  }

  if (
    q.includes("visit") ||
    q.includes("tour") ||
    q.includes("schedule") ||
    q.includes("walkthrough") ||
    q.includes("appointment") ||
    q.includes("see the flat")
  ) {
    contexts.push(
      "[Scheduled Visit Context]: Visitors can schedule in-person walkthroughs or video tours by clicking 'Schedule Visit' on any property detail page, picking a preferred future date and time slot. The owner receives immediate notification on their dashboard.",
    );
  }

  return contexts.length > 0
    ? contexts.join("\n")
    : "[General Context]: Seedha Properties is India's premier 0% brokerage direct-owner PropTech discovery marketplace.";
}

/**
 * Live Database Lookup for AI Queries
 */
async function fetchLiveDbPropertyContext(userQuery: string): Promise<string> {
  try {
    const q = userQuery.toLowerCase();
    const areas = [
      "kondapur",
      "madhapur",
      "gachibowli",
      "hitec",
      "jubilee",
      "banjara",
      "manikonda",
      "kukatpally",
      "tellapur",
      "nanakramguda",
      "kokapet",
    ];

    const matchedArea = areas.find((a) => q.includes(a));
    const searchTerm = matchedArea || (q.length >= 4 ? q.split(" ")[0] : "");

    if (!searchTerm) return "";

    const { data: props } = await (supabase.from as any)("properties")
      .select("title, locality, price, rent_amount, bhk_type, image_urls, is_featured")
      .or(`locality.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .limit(5);

    if (props && props.length > 0) {
      const summary = props
        .map(
          (p: any) =>
            `• ${p.title} (${p.bhk_type || "2 BHK"}) in ${p.locality} - ₹${(p.rent_amount || p.price || 0).toLocaleString("en-IN")}/mo [${p.image_urls?.length || 0} photos]`,
        )
        .join("\n");
      return `\n[LIVE SUPABASE DATABASE LISTINGS IN '${searchTerm.toUpperCase()}']:\nFound ${props.length} active 0% brokerage listings:\n${summary}\n`;
    }
  } catch {
    // Fail safe
  }
  return "";
}

/**
 * Trained Local Response Generator
 */
async function generateTrainedLocalResponse(query: string): Promise<string> {
  const q = query.toLowerCase().trim();
  const liveDbCtx = await fetchLiveDbPropertyContext(query);

  if (liveDbCtx) {
    return (
      `**Live Database Results for your search:** 🏡\n\n` +
      liveDbCtx +
      `\n\nTo view photos, videos, and contact property owners directly with 0% brokerage, search **'${query}'** in our top search bar!`
    );
  }

  // BHK & Property Search Intent Parsing
  if (
    q.includes("bhk") ||
    q.includes("room") ||
    q.includes("flat") ||
    q.includes("house") ||
    q.includes("apartment") ||
    q.includes("villa") ||
    q.includes("rent") ||
    q.includes("buy")
  ) {
    const bhkMatch = q.match(/\b([1-4])\s*bhk\b/i);
    const bhkType = bhkMatch ? `${bhkMatch[1]} BHK` : "verified 1BHK/2BHK/3BHK";

    return (
      `**Looking for ${bhkType} options in Hyderabad?** 🏡\n\n` +
      `We have verified 0% brokerage ${bhkType} listings across top tech corridors:\n` +
      `• **Kondapur & Madhapur:** Starting from ₹24,000/month with modular kitchen & 24/7 security.\n` +
      `• **Gachibowli & HITEC City:** Starting from ₹28,000/month near major IT hubs.\n\n` +
      `👉 Tap **'Rent'** or **'Buy'** in the top navigation bar or type an area like **'Kondapur'** to view photos, video tours, and direct owner WhatsApp contact numbers!`
    );
  }

  // Locality default fallbacks
  if (
    q.includes("kondapur") ||
    q.includes("madhapur") ||
    q.includes("gachibowli") ||
    q.includes("hitec")
  ) {
    return (
      "**Available Properties & Rooms in " +
      (q.includes("kondapur") ? "Kondapur" : "Madhapur") +
      ":** 🏙️\n\n" +
      "We have active 1BHK, 2BHK, 3BHK, and PG/Co-living listings with 0% brokerage!\n\n" +
      "• **Kondapur:** 2 BHK average rent: ₹24,000 - ₹38,000/mo near Raghavendra Colony and Botanical Garden Road.\n" +
      "• **Madhapur & HITEC City:** 2 BHK average rent: ₹28,000 - ₹45,000/mo near Cyber Towers and Inorbit Mall.\n\n" +
      "👉 Tap on **'Rent'** or **'Buy'** in the top navigation bar to view full photos, videos, and direct owner WhatsApp contact numbers!"
    );
  }

  if (q.includes("brokerage") || q.includes("commission") || q.includes("fee")) {
    return (
      "**Seedha Properties is 100% Direct-Owner with 0% Brokerage!** 🎉\n\n" +
      "• **For Tenants & Buyers:** Zero brokerage, zero agent commission.\n" +
      "• **For Property Owners:** Listing your home is 100% free."
    );
  }

  return (
    `**Namaste! I am Seedha AI, your 24/7 Real Estate Assistant.** 🏡\n\n` +
    `I can help you find verified 1BHK/2BHK/3BHK homes in **Kondapur**, **Madhapur**, **Gachibowli**, or any locality in Hyderabad with **0% brokerage**!\n\n` +
    `Try asking me: *"Find 3BHK in Kondapur"* or *"How to list my property?"*`
  );
}

/**
 * Main AI Prompt Dispatcher (Gemini API with Trained Fallback)
 */
export async function askSeedhaAI(userQuery: string, history: AIMessage[] = []): Promise<string> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env
      ?.VITE_GEMINI_API_KEY ||
    "";

  const liveDbCtx = await fetchLiveDbPropertyContext(userQuery);

  if (!apiKey || apiKey.trim().length === 0) {
    return generateTrainedLocalResponse(userQuery);
  }

  const dynamicContext = retrieveDynamicContext(userQuery) + liveDbCtx;

  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `${SEEDHA_SYSTEM_PROMPT}\n\n[RELEVANT REAL ESTATE CONTEXT RETRIEVED]:\n${dynamicContext}\n\n[USER QUESTION]:\n${userQuery}`,
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
        data.candidates?.[0]?.content?.parts?.[0]?.text || generateTrainedLocalResponse(userQuery)
      );
    }

    const data = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text || generateTrainedLocalResponse(userQuery)
    );
  } catch (error) {
    console.warn("[geminiService] Error calling Gemini API, using local AI engine:", error);
    return generateTrainedLocalResponse(userQuery);
  }
}
