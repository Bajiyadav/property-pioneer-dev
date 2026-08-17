import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Compass,
  BadgeCheck,
  IndianRupee,
  FileCheck2,
  Landmark,
  Scale,
  ShieldCheck,
  UserCheck,
  Home,
} from "lucide-react";

/**
 * Content for the expandable feature cards.
 *
 * Wording rule that governs this whole file: a card may describe what Seedha
 * Properties *does*, never a guarantee it cannot honour. Nothing here claims a
 * document, title, or identity has been government-verified, and nothing
 * promises a loan, a rate, or an absolute zero-brokerage outcome — those
 * workflows do not exist yet. Where a capability is planned rather than live,
 * `availability` says so and the CTA reflects it.
 */

export type Availability = "live" | "in-progress" | "planned";

export interface FeatureDetail {
  id: string;
  icon: LucideIcon;
  title: string;
  /** One-line summary shown on the card face. */
  summary: string;
  /** Longer explanation shown at the top of the detail modal. */
  intro: string;
  availability: Availability;
  /** What the platform provides. */
  provides: string[];
  /** What the customer or owner actually gets. */
  youGet: string[];
  /** Ordered lifecycle, rendered as a numbered timeline. */
  process?: string[];
  /** Shown in a muted callout. Use for anything that limits the claim. */
  disclaimer?: string;
  cta: { label: string; to?: string; search?: Record<string, unknown>; action?: "launch-list" };
}

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  live: "Available now",
  "in-progress": "Being rolled out",
  planned: "Planned",
};

export const FEATURE_DETAILS: Record<string, FeatureDetail> = {
  "it-parks": {
    id: "it-parks",
    icon: Building2,
    title: "IT & Commercial Parks",
    summary: "Homes positioned around Bangalore's employment corridors.",
    intro:
      "Explore homes positioned around Bangalore's major technology and employment corridors, so you can search by the commute that actually matters to you.",
    availability: "in-progress",
    provides: [
      "Live listings in Koramangala and Indiranagar today",
      "Whitefield coverage still being built",
      "Coverage planned for nearby business districts",
      "Commute-oriented property discovery",
      "The same verification-first listing model used in Hyderabad",
    ],
    youGet: [
      "Filter listings by area, price, bedrooms and listing type",
      "Direct enquiry to the listing owner",
      "A saved-properties list you can return to",
    ],
    disclaimer:
      "Bangalore is an early market. Koramangala and Indiranagar have listings today; Whitefield does not yet. Search shows exactly what is available — we never pad results with placeholder listings.",
    cta: { label: "Explore Bangalore Properties", to: "/properties" },
  },

  residential: {
    id: "residential",
    icon: Compass,
    title: "High-Demand Residential",
    summary: "Residential opportunities in Bangalore's sought-after neighbourhoods.",
    intro:
      "Discover residential opportunities in Bangalore's high-demand neighbourhoods as Seedha Properties expands its marketplace.",
    availability: "in-progress",
    provides: [
      "Apartments and independent homes",
      "Family-friendly neighbourhood coverage",
      "Rental inventory at launch",
      "Sale inventory as the market matures",
    ],
    youGet: [
      "Area-level search across target corridors",
      "Listing detail with photos, pricing and location",
      "Enquiry straight to the owner",
    ],
    disclaimer:
      "Bangalore inventory is still thin — a search may return few or no results in a given locality. Join the launch list and we will tell you when your area has listings.",
    cta: { label: "Join the Bangalore launch list", action: "launch-list" },
  },

  "owner-verification": {
    id: "owner-verification",
    icon: BadgeCheck,
    title: "Direct Owner Verification",
    summary: "A verification-first marketplace, reviewed before anything is published.",
    intro:
      "Seedha Properties is building a verification-first property marketplace designed to help customers identify legitimate property listings and owners.",
    availability: "in-progress",
    provides: [
      "Owner identity information captured at signup",
      "Property information reviewed against the listing",
      "Listing content checked before publication",
      "Supporting documents where applicable",
      "Admin review before any listing goes public",
    ],
    youGet: [
      "Listings that a moderator has actually looked at",
      "A visible verification status on each listing",
      "A way to report anything that looks wrong",
    ],
    process: [
      "Owner submits a listing",
      "Listing enters admin review — it is not public at this point",
      "Moderator checks owner and property information",
      "Listing is approved, rejected, or sent back for changes",
      "Approved listings become publicly visible",
    ],
    disclaimer:
      "Document verification is being rolled out as part of the Seedha Properties verification programme. We do not currently verify Aadhaar, PAN, title deeds or government records, and no listing should be read as carrying that assurance.",
    cta: { label: "See verification process", to: "/help" },
  },

  brokerage: {
    id: "brokerage",
    icon: IndianRupee,
    title: "Direct-Owner Listings",
    summary: "Enquire with the owner directly, without a broker in the middle.",
    intro:
      "Seedha Properties connects you directly with the person listing the property. Direct-owner listings may help customers avoid traditional brokerage costs.",
    availability: "live",
    provides: [
      "Listings published by the property owner",
      "Transparent property information on every listing",
      "Clear asking price with no platform commission added",
      "Enquiries delivered directly through the platform",
    ],
    youGet: [
      "A direct line to the owner rather than an agent chain",
      "Pricing you can compare without hidden additions",
      "No charge from Seedha Properties to enquire about a listing",
    ],
    disclaimer:
      "Seedha Properties does not add brokerage to a listing. We cannot guarantee that an individual owner or third party will not levy their own charges — always confirm costs directly before committing.",
    cta: { label: "Browse direct-owner listings", to: "/properties" },
  },

  "verified-documents": {
    id: "verified-documents",
    icon: FileCheck2,
    title: "Verified Documents",
    summary: "A private, access-controlled document review workflow.",
    intro:
      "Seedha Properties is building a document-verification workflow so owners can evidence a listing and customers can see that a review took place.",
    availability: "planned",
    provides: [
      "Identity documents, submitted privately",
      "Ownership and supporting records",
      "Property-related records",
      "Address information",
      "Listing evidence",
    ],
    youGet: [
      "A verification status attached to the listing",
      "Confidence that a moderator reviewed the submission",
      "Your documents kept private and access-controlled at all times",
    ],
    process: [
      "Document submitted",
      "Secure review",
      "Admin verification",
      "Verification status recorded",
      "Approved listing published",
    ],
    disclaimer:
      "Documents are never displayed publicly. Aadhaar numbers, PAN numbers, personal phone numbers and private records are not shown on any listing. This workflow is planned and not yet live — no listing currently carries a document-verified status.",
    cta: { label: "Learn more", to: "/help" },
  },

  "home-loan": {
    id: "home-loan",
    icon: Landmark,
    title: "Home Loan Assistance",
    summary: "Understand the home-loan journey before you commit.",
    intro:
      "Planning to buy a property? Seedha Properties can help customers understand the home-loan journey and connect with relevant financing options as the service becomes available.",
    availability: "planned",
    provides: [
      "An explanation of the steps involved",
      "Guidance on the documentation usually required",
      "Help comparing the options available to you",
      "A route to partner lenders as the programme opens",
    ],
    youGet: [
      "A clear view of the process before you start",
      "Fewer surprises at the documentation stage",
      "Somewhere to register interest so we can contact you",
    ],
    process: [
      "Property selected",
      "Loan requirement submitted",
      "Basic eligibility information gathered",
      "Financing options compared",
      "Documentation prepared",
      "Partner or bank process begins",
      "Application followed up",
    ],
    disclaimer:
      "Seedha Properties is not a lender and does not approve loans. Nothing here is an offer of finance, an interest rate, or a statement of eligibility — any loan is subject to lender eligibility and approval.",
    cta: { label: "Register interest", action: "launch-list" },
  },

  "legal-review": {
    id: "legal-review",
    icon: Scale,
    title: "Legal Document Assistance",
    summary: "Understand the paperwork attached to a property.",
    intro: "Understand the documents associated with a property before making a major decision.",
    availability: "planned",
    provides: [
      "A checklist of the property documents usually involved",
      "Guidance on ownership information",
      "Explanation of supporting records",
      "Help reading agreement documentation",
      "The listing's verification status in context",
    ],
    youGet: ["A clearer picture of what to ask for", "Fewer unknowns before you commit"],
    disclaimer:
      "Seedha Properties does not replace independent legal advice unless a qualified legal professional is explicitly providing the service. We do not certify title or provide legal clearance.",
    cta: { label: "Learn more", to: "/help" },
  },

  "property-verification": {
    id: "property-verification",
    icon: ShieldCheck,
    title: "Property Verification",
    summary: "Every listing passes moderation before the public sees it.",
    intro:
      "No listing reaches the public site without a moderator reviewing it first. This is the single guarantee the platform does enforce today.",
    availability: "live",
    provides: [
      "Listing submission captured against the owner's account",
      "Owner information reviewed",
      "Property information reviewed",
      "Documents where required",
      "An approve, reject, or request-changes decision",
    ],
    youGet: [
      "Only moderated listings in search results",
      "A status you can see on your own listing as an owner",
      "An audit trail behind every moderation decision",
    ],
    process: [
      "Listing submitted",
      "Owner information checked",
      "Property information checked",
      "Documents reviewed if required",
      "Admin review",
      "Approved or rejected",
      "Published",
    ],
    disclaimer:
      "A listing shows a verified status only when the database records that status. We do not display a verification badge the platform has not actually issued.",
    cta: { label: "Browse moderated listings", to: "/properties" },
  },

  "customer-protection": {
    id: "customer-protection",
    icon: UserCheck,
    title: "Customer Protection",
    summary: "Moderation, reporting and secure accounts.",
    intro:
      "Protection on Seedha Properties comes from a small number of things that genuinely work, rather than a badge.",
    availability: "live",
    provides: [
      "Clear listing information on every property",
      "A visible verification status",
      "Report-listing functionality",
      "Enquiry records retained against the listing",
      "Admin moderation before publication",
      "Secure authentication with role-based access",
    ],
    youGet: [
      "A way to flag a listing that looks wrong",
      "Your enquiries kept private to you",
      "An account only you can access",
    ],
    disclaimer:
      "Always view a property in person and confirm details directly with the owner before making any payment. Seedha Properties does not hold funds or act as an escrow.",
    cta: { label: "Report a problem", to: "/help" },
  },

  "owner-benefits": {
    id: "owner-benefits",
    icon: Home,
    title: "Why List With Seedha Properties?",
    summary: "Free listing, direct enquiries, and a dashboard to manage them.",
    intro:
      "List a property, reach people actually searching for it, and manage the responses from one place.",
    availability: "live",
    provides: [
      "Reach serious property seekers",
      "A secure owner account",
      "A property management dashboard",
      "Image uploads",
      "Listing moderation before publication",
      "Enquiry management",
      "Transparent listing status at every stage",
    ],
    youGet: [
      "Your listing published free of charge",
      "Enquiries delivered to your dashboard",
      "Full control to edit or remove a listing",
    ],
    process: [
      "Create an owner account",
      "Add your property details",
      "Upload photographs",
      "Submit for review",
      "Moderator approves",
      "Listing goes live and enquiries start arriving",
    ],
    cta: { label: "List your property", to: "/auth" },
  },
};

/**
 * Target corridors for the Bangalore expansion.
 *
 * `hasListings` reflects the live catalogue. Search is the source of truth —
 * these links always run a real query, and an empty result is shown honestly
 * rather than hidden.
 */
export const BANGALORE_CORRIDORS = [
  { name: "Koramangala", hasListings: true },
  { name: "Indiranagar", hasListings: true },
  { name: "Whitefield", hasListings: false },
] as const;

/** Cards shown inside the city expansion roadmap, in display order. */
export const EXPANSION_FEATURE_IDS = [
  "it-parks",
  "residential",
  "owner-verification",
  "brokerage",
  "verified-documents",
  "property-verification",
  "home-loan",
  "legal-review",
  "customer-protection",
  "owner-benefits",
] as const;
