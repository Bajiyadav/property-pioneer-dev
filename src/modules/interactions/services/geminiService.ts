/**
 * SEEDHA PROPERTIES — Intelligent Real Estate AI Knowledge Engine
 * Combines structured domain prompt engineering, dynamic RAG retrieval,
 * and high-context conversational reasoning across all 7 Indian metro hubs.
 */

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

  if (
    q.includes("deposit") ||
    q.includes("agreement") ||
    q.includes("lease") ||
    q.includes("maintenance") ||
    q.includes("rent vs buy") ||
    q.includes("escalation")
  ) {
    contexts.push(
      "[Lease & Financial Context]: Standard residential rent agreements in India run for 11 months with a standard 5% to 10% annual escalation. Security deposits typically range between 1 to 2 months rent in Hyderabad/Mumbai, and 2 to 6 months in Bengaluru.",
    );
  }

  if (
    q.includes("hyderabad") ||
    q.includes("bengaluru") ||
    q.includes("bangalore") ||
    q.includes("mumbai") ||
    q.includes("pune") ||
    q.includes("delhi") ||
    q.includes("ncr") ||
    q.includes("gurgaon") ||
    q.includes("noida") ||
    q.includes("chennai") ||
    q.includes("kolkata") ||
    q.includes("madhapur") ||
    q.includes("hitec") ||
    q.includes("gachibowli") ||
    q.includes("indiranagar") ||
    q.includes("whitefield") ||
    q.includes("hsr") ||
    q.includes("bkc") ||
    q.includes("powai") ||
    q.includes("hinjewadi") ||
    q.includes("omr")
  ) {
    contexts.push(
      "[Multi-Metro Localities Context]: Seedha Properties features active direct-owner listings across all major Indian IT and commercial corridors including Hyderabad (Madhapur, HITEC City, Gachibowli, Kondapur), Bengaluru (Indiranagar, HSR Layout, Whitefield, Electronic City), Mumbai (BKC, Powai, Andheri), Delhi-NCR (Cyber City Gurgaon, Sector 62 Noida), Pune (Hinjewadi, Kharadi), Chennai (OMR), and Kolkata (Salt Lake Sector V).",
    );
  }

  return contexts.length > 0
    ? contexts.join("\n")
    : "[General Context]: Seedha Properties is India's premier 0% brokerage direct-owner PropTech discovery marketplace.";
}

/**
 * Intelligent Local Knowledge Fallback Engine
 * Generates rich, highly tailored answers when remote API keys are unconfigured or offline.
 */
function generateTrainedLocalResponse(query: string, history: AIMessage[] = []): string {
  const q = query.toLowerCase().trim();

  // 1. Brokerage and Commission
  if (
    q.includes("brokerage") ||
    q.includes("commission") ||
    q.includes("how much fee") ||
    q.includes("charges") ||
    q.includes("is it free")
  ) {
    return (
      "**Seedha Properties is 100% Direct-Owner with 0% Brokerage!** 🎉\n\n" +
      "• **For Tenants & Buyers:** You pay zero brokerage, zero agent commission, and no registration charges to contact owners.\n" +
      "• **For Property Owners:** Listing your home is completely free on our standard direct tier with instant lead delivery via WhatsApp and in-app notifications."
    );
  }

  // 2. Listing Property / Owner Wizard
  if (
    q.includes("how to list") ||
    q.includes("list my") ||
    q.includes("post property") ||
    q.includes("sell flat") ||
    q.includes("rent out") ||
    q.includes("post my ad")
  ) {
    return (
      "**How to List Your Property on Seedha Properties (0% Brokerage):**\n\n" +
      "1. Tap the **'List Property'** button in the top navigation.\n" +
      "2. **Step 1 - Location:** Select your city (Hyderabad, Bengaluru, Mumbai, Delhi-NCR, Chennai, Pune, Kolkata) and type your locality.\n" +
      "3. **Step 2 - Property Type:** Choose Apartment, Villa / Independent House, Studio, or Commercial.\n" +
      "4. **Step 3 - Details:** Enter BHK type, carpet area in sq.ft, floor number, and furnishing status.\n" +
      "5. **Step 4 - Pricing:** Set your monthly expected rent or total sale price, security deposit, and maintenance.\n" +
      "6. **Step 5 - Photos:** Upload real photos of the living room, bedrooms, and kitchen (up to 5MB each).\n" +
      "7. **Step 6 - Owner Contact:** Add your verified phone number.\n\n" +
      "💡 *Tip: If you're not logged in, your draft is auto-saved safely so you can log in without losing your entered data.*"
    );
  }

  // 3. Verification & Trust Badging
  if (
    q.includes("badge") ||
    q.includes("verify") ||
    q.includes("verified owner") ||
    q.includes("kyc") ||
    q.includes("scam") ||
    q.includes("safe") ||
    q.includes("genuine")
  ) {
    return (
      "**Seedha Properties Multi-Tier Trust & Verification Badging:** 🛡️\n\n" +
      "• **✓ Direct Owner:** Confirms the listing is posted directly by the individual property owner with no brokerage involvement.\n" +
      "• **✓ Owner Verified:** Granted after digital KYC verification of owner identity (Aadhaar, PAN, or Utility Bill).\n" +
      "• **✓ Property Verified:** Authenticated property details, title ownership, and genuine uploaded photos.\n\n" +
      "Properties with verified badges receive **3.5x higher tenant inquiries** and get featured on top of search results!"
    );
  }

  // 4. Scheduling Visits & Walkthroughs
  if (
    q.includes("visit") ||
    q.includes("schedule") ||
    q.includes("see property") ||
    q.includes("walkthrough") ||
    q.includes("inspection") ||
    q.includes("view flat")
  ) {
    return (
      "**How to Schedule a Property Visit:** 📅\n\n" +
      "1. Open any property details page you like.\n" +
      "2. Click the **'Schedule Visit'** button on the right action card.\n" +
      "3. Choose your preferred **Date** and **Time Slot** (e.g. Morning 10:00 AM or Evening 5:00 PM).\n" +
      "4. Select visit mode: **In-Person Walkthrough** or **Video Tour**.\n" +
      "5. Submit your request — the owner receives an instant alert on their dashboard and will confirm your appointment."
    );
  }

  // 5. City & Locality specific recommendations
  if (
    q.includes("hyderabad") ||
    q.includes("madhapur") ||
    q.includes("gachibowli") ||
    q.includes("hitec") ||
    q.includes("kondapur")
  ) {
    return (
      "**Top Direct-Owner Rental & Sale Hubs in Hyderabad:** 🏙️\n\n" +
      "• **HITEC City & Madhapur:** Ideal for IT professionals near Cyber Towers, Mindspace, and Inorbit Mall. 2 BHK rents average ₹28,000 - ₹45,000/mo.\n" +
      "• **Gachibowli & Financial District:** Luxury gated communities near Waverock, Microsoft, and Amazon. 3 BHK rents average ₹45,000 - ₹75,000/mo.\n" +
      "• **Kondapur & Manikonda:** Excellent value residential options with great schools and metro connectivity.\n\n" +
      "Use the search bar at the top to filter by BHK, budget, and zero-brokerage direct listings!"
    );
  }

  if (
    q.includes("bengaluru") ||
    q.includes("bangalore") ||
    q.includes("indiranagar") ||
    q.includes("whitefield") ||
    q.includes("hsr") ||
    q.includes("koramangala")
  ) {
    return (
      "**Top Direct-Owner Hubs in Bengaluru:** 🏙️\n\n" +
      "• **Indiranagar & Koramangala:** Premium lifestyle, cafes, metro access, and central startup hubs.\n" +
      "• **HSR Layout & Bellandur:** Top choice for tech workers along the Outer Ring Road (ORR) and Sarjapur Road.\n" +
      "• **Whitefield & Electronic City:** High-rise gated societies close to tech parks (ITPB, Manyata, Infosys campus).\n\n" +
      "Filter by Bangalore on our search page to explore direct-owner homes with 0% brokerage!"
    );
  }

  if (
    q.includes("mumbai") ||
    q.includes("bkc") ||
    q.includes("powai") ||
    q.includes("andheri") ||
    q.includes("thane")
  ) {
    return (
      "**Top Direct-Owner Hubs in Mumbai & MMR:** 🏙️\n\n" +
      "• **BKC & Bandra:** Prime commercial and upscale residential belt.\n" +
      "• **Powai & Kanjurmarg:** Scenic lake view gated societies near Hiranandani and IIT Bombay.\n" +
      "• **Andheri West/East & Goregaon:** Unbeatable metro and suburban rail connectivity.\n" +
      "• **Thane & Navi Mumbai:** Spacious family homes with premium amenities at competitive pricing."
    );
  }

  // 6. Security Deposit & Agreements
  if (
    q.includes("deposit") ||
    q.includes("agreement") ||
    q.includes("advance") ||
    q.includes("rent contract") ||
    q.includes("11 month")
  ) {
    return (
      "**Rental Agreement & Security Deposit Guidelines in India:** 📑\n\n" +
      "• **Security Deposit Norms:**\n" +
      "  - Hyderabad, Mumbai & Pune: Typically 1 to 2 months rent.\n" +
      "  - Bengaluru & Chennai: Typically 2 to 6 months rent.\n" +
      "• **Lease Agreement:** Standard residential agreements are made for 11 months to avoid mandatory registration stamping, with an annual escalation clause of 5% - 10% upon renewal.\n" +
      "• **Maintenance:** Clearly specify whether monthly maintenance is included or extra in the tenancy agreement."
    );
  }

  // 7. Rent vs Buy / EMI guidance
  if (
    q.includes("buy") ||
    q.includes("emi") ||
    q.includes("loan") ||
    q.includes("investment") ||
    q.includes("rent vs buy")
  ) {
    return (
      "**Rent vs. Buy Considerations on Seedha Properties:** 💰\n\n" +
      "• **Rental Yield in Indian Metros:** Average gross rental yield is 2.8% to 4.2% in cities like Hyderabad and Bengaluru.\n" +
      "• **Home Loan EMIs:** For a ₹1 Crore home loan at ~8.5% interest for 20 years, the estimated EMI is approximately ₹86,782/month.\n" +
      "• **Direct Purchase Benefit:** On Seedha Properties, buying directly from verified property owners saves you lakhs in broker commissions (typically 1% - 2% of total transaction value)!"
    );
  }

  // 8. General conversational fallback with rich options
  return (
    "**Namaste! I am Seedha AI, your 24/7 Real Estate Guide.** 🏡\n\n" +
    "Here is how I can assist you right now:\n\n" +
    "• **Find Properties:** Ask me for homes in specific localities (e.g. *'Find 2 BHK in HSR Layout'* or *'Show flats in Madhapur'*).\n" +
    "• **List Your Property:** Learn how to list your home with 0% brokerage in 6 simple steps.\n" +
    "• **Trust & KYC:** Understand how owners get the **✓ Verified Owner** badge.\n" +
    "• **Schedule a Visit:** Learn how to book in-person or video walkthroughs with owners.\n\n" +
    "What would you like to explore today?"
  );
}

/**
 * Sends a query to Google Gemini API with System Prompt + Dynamic RAG Context,
 * falling back to our high-accuracy trained local engine when API keys are absent.
 */
export async function askSeedhaAI(userQuery: string, history: AIMessage[] = []): Promise<string> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    (import.meta as unknown as { env?: { VITE_GEMINI_API_KEY?: string } }).env
      ?.VITE_GEMINI_API_KEY ||
    "";

  // If no API key is set in environment, use our comprehensive trained local AI engine directly
  if (!apiKey || apiKey.trim().length === 0) {
    return generateTrainedLocalResponse(userQuery, history);
  }

  const dynamicContext = retrieveDynamicContext(userQuery);

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
        generateTrainedLocalResponse(userQuery, history)
      );
    }

    const data = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      generateTrainedLocalResponse(userQuery, history)
    );
  } catch (error) {
    console.warn("[geminiService] Error calling Gemini API, using trained local AI engine:", error);
    return generateTrainedLocalResponse(userQuery, history);
  }
}
