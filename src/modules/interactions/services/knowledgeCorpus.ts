/**
 * Curated Seedha Knowledge Corpus & Semantic Chunking Engine
 *
 * Provides approved, version-controlled knowledge documents chunked for semantic
 * retrieval and grounded RAG responses.
 */

export interface KnowledgeChunk {
  id: string;
  source: string;
  category: "policy" | "guide" | "faq" | "terms";
  title: string;
  content: string;
  tags: string[];
}

export const SEEDHA_KNOWLEDGE_DOCS: KnowledgeChunk[] = [
  {
    id: "doc-zero-brokerage",
    source: "Seedha Zero Brokerage Charter",
    category: "policy",
    title: "100% Zero Brokerage Policy",
    content:
      "Seedha Properties strictly enforces a 100% zero brokerage model across all listings. Neither tenants nor buyers ever pay brokerage, agency commissions, or finder fees. Property owners list residential and commercial units completely free. Direct communication occurs between owners and seekers without middlemen.",
    tags: ["brokerage", "commission", "fee", "cost", "zero", "free", "charges", "middleman"],
  },
  {
    id: "doc-owner-listing",
    source: "Owner Onboarding & Listing Guide",
    category: "guide",
    title: "6-Stage Guided Listing Wizard",
    content:
      "Property owners can publish listings in minutes via the 6-stage wizard (/list-property/wizard): 1. Locality & City, 2. Property Type & Subtype, 3. BHK, Area, Floor & Age, 4. Rent, Deposit & Maintenance Terms, 5. Real Photographs & Video Tours, 6. Owner Contact & OTP Verification. Drafts are automatically stored locally so progress is never lost.",
    tags: ["list", "post", "owner", "wizard", "steps", "upload", "photos", "draft"],
  },
  {
    id: "doc-trust-kyc",
    source: "Trust, Badging & Verification Framework",
    category: "policy",
    title: "Verification Badges and KYC Framework",
    content:
      "Seedha assigns three distinct trust badges: 1. 'Direct Owner' confirms mobile OTP ownership verification. 2. 'Owner Verified' validates government identity (Aadhaar, PAN, or Utility bill). 3. 'Property Verified' confirms ownership documents and on-site or video audit inspection. Verified listings receive up to 3.5x higher inquiries.",
    tags: ["kyc", "verify", "verification", "badge", "trust", "aadhaar", "pan", "genuine", "fake"],
  },
  {
    id: "doc-visit-scheduling",
    source: "Tenant Scheduling & Walkthrough Policy",
    category: "policy",
    title: "Visit Scheduling and Guided Walkthroughs",
    content:
      "Seekers can schedule direct in-person property walkthroughs or digital video tours by clicking 'Schedule Visit' on any property detail page. Users choose a preferred date and time slot. Property owners receive instant dashboard alerts and notifications to confirm or reschedule visits.",
    tags: ["visit", "tour", "schedule", "walkthrough", "appointment", "time", "date", "slot"],
  },
  {
    id: "doc-privacy-location",
    source: "Privacy & Location Truncation Policy",
    category: "policy",
    title: "Contact Privacy and Location Obfuscation",
    content:
      "To protect homeowner safety and prevent unsolicited spam, direct owner phone numbers and WhatsApp links are unlocked only for authenticated users with active verification. Exact residential GPS coordinates are truncated (~110m radius) on public exploratory maps until visit appointments are confirmed.",
    tags: ["privacy", "phone", "contact", "coordinates", "gps", "safe", "security", "spam"],
  },
  {
    id: "doc-plans-refunds",
    source: "Owner Promotion & Refund Terms",
    category: "terms",
    title: "Promotion Plans, Features, and Invoicing",
    content:
      "Standard listing on Seedha is permanently free. Optional owner boost plans (Fast-Track Promotion, Featured Showcase) provide top search placement, social outreach, and priority matching. Payments are processed securely via verified gateways with instant GST digital invoices. Pro-rated refunds are available within 48 hours if no inquiries were delivered.",
    tags: ["plans", "pricing", "promote", "featured", "payment", "refund", "invoice", "gst"],
  },
  {
    id: "doc-localities-covered",
    source: "Geographical Coverage & Locality Index",
    category: "guide",
    title: "Metropolitan Coverage and Hubs",
    content:
      "Seedha Properties operates across major Indian tech and financial centers: Hyderabad (Madhapur, HITEC City, Gachibowli, Kondapur, Jubilee Hills, Financial District), Bengaluru (Whitefield, Indiranagar, HSR Layout, Koramangala, Electronic City), Mumbai (BKC, Bandra, Powai, Andheri), Pune (Hinjewadi, Kharadi, Wakad, Baner), Delhi-NCR, and Chennai.",
    tags: [
      "hyderabad",
      "bengaluru",
      "mumbai",
      "pune",
      "delhi",
      "chennai",
      "madhapur",
      "kondapur",
      "gachibowli",
    ],
  },
];

/**
 * Calculates a semantic keyword and token overlap similarity score between a query and a chunk.
 */
export function scoreSemanticRelevance(query: string, chunk: KnowledgeChunk): number {
  const qTokens = query.toLowerCase().split(/\W+/).filter(Boolean);
  if (qTokens.length === 0) return 0;

  let score = 0;
  const chunkText = (chunk.title + " " + chunk.content + " " + chunk.tags.join(" ")).toLowerCase();

  for (const token of qTokens) {
    if (token.length <= 2) continue; // skip short stop-words
    if (chunk.tags.includes(token)) {
      score += 3;
    }
    if (chunk.title.toLowerCase().includes(token)) {
      score += 2;
    }
    if (chunkText.includes(token)) {
      score += 1;
    }
  }

  return score;
}

/**
 * Retrieves the top relevant knowledge chunks matching a query.
 */
export function retrieveSemanticKnowledge(query: string, maxChunks = 3): KnowledgeChunk[] {
  const scored = SEEDHA_KNOWLEDGE_DOCS.map((chunk) => ({
    chunk,
    score: scoreSemanticRelevance(query, chunk),
  }));

  const relevant = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map((item) => item.chunk);

  return relevant.length > 0 ? relevant : [SEEDHA_KNOWLEDGE_DOCS[0]];
}
