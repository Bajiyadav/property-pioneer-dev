import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, UserCheck, Calendar, Sparkles } from "lucide-react";
import { CategoryLandingPage } from "@/modules/marketing/category/CategoryLandingPage";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/buy/")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/buy");
    const ogImage = getOgImageUrl();
    const title = `Buy Residential Properties in Hyderabad — ${APP_NAME}`;
    const description = `Explore verified homes, apartments, and villas for sale in Hyderabad's premier localities including Gachibowli, Madhapur, Financial District, and Kokapet with zero platform commission.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: APP_NAME },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
        { name: "robots", content: "index, follow" },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: BuyPage,
});

function BuyPage() {
  return (
    <CategoryLandingPage
      slug="buy"
      badge="Homes for Sale"
      badgeColor="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
      heroGradient="bg-gradient-to-br from-emerald-950/20 via-background to-background"
      title="Find Your Dream Home"
      titleHighlight="in Hyderabad"
      subline="Browse verified residential properties for sale across Hyderabad's top IT corridors, gated communities, and luxury residential projects with zero platform commission."
      searchListingType="sale"
      filterPredicate={(p) => p.listing_type === "sale"}
      hotspots={[
        {
          name: "Gachibowli",
          priceRange: "₹7,500 - ₹12,000 / sqft",
          highlight: "Premier IT hub corridor near Financial District with high resale liquidity.",
        },
        {
          name: "Madhapur",
          priceRange: "₹8,000 - ₹13,500 / sqft",
          highlight:
            "Heart of Cyberabad with unmatched metro connectivity and lifestyle infrastructure.",
        },
        {
          name: "Financial District",
          priceRange: "₹8,500 - ₹14,000 / sqft",
          highlight: "Ultra-modern skyline with luxury high-rises and walk-to-work culture.",
        },
        {
          name: "Tellapur",
          priceRange: "₹6,000 - ₹9,500 / sqft",
          highlight:
            "Rapidly expanding township zone with top international schools and green belts.",
        },
        {
          name: "Kokapet",
          priceRange: "₹9,000 - ₹16,000 / sqft",
          highlight: "High-end Neopolis growth corridor right next to the Outer Ring Road (ORR).",
        },
        {
          name: "Kondapur",
          priceRange: "₹7,000 - ₹11,000 / sqft",
          highlight:
            "Family-friendly residential area adjacent to Botanical Garden and tech parks.",
        },
      ]}
      features={[
        {
          icon: UserCheck,
          title: "Direct Owner Connect",
          desc: "Interact straight with property owners without pushy third-party sales agents.",
        },
        {
          icon: ShieldCheck,
          title: "Zero Platform Brokerage",
          desc: "Seedha Properties charges no platform commission on home sales.",
        },
        {
          icon: Calendar,
          title: "Instant Visit Requests",
          desc: "Book physical site tours directly with owners at a time convenient to you.",
        },
        {
          icon: Sparkles,
          title: "Transparent Specifications",
          desc: "Accurate details on carpet areas, floor numbers, age of property, and amenities.",
        },
      ]}
      faqs={[
        {
          q: "How do I buy a home directly from an owner on Seedha Properties?",
          a: "Browse the live sale catalogue, select your desired property, and click 'Schedule Visit' or 'Contact Owner'. You can connect directly with the owner to view the home and discuss terms.",
        },
        {
          q: "Does Seedha Properties charge any transaction fee to buyers?",
          a: "No. Seedha Properties adds zero platform commission or hidden buyer fees to property listings.",
        },
        {
          q: "Can I apply for a home loan for properties listed on the platform?",
          a: "Yes. Once you finalise a property with the owner, you can apply for home loans through any bank of your choice. We recommend getting a pre-sanction letter from your preferred financial institution.",
        },
        {
          q: "What due diligence should I conduct before purchasing?",
          a: "Always verify document originals (link deeds, approved building plans, encumbrance certificates) with qualified legal advisors prior to executing sale agreements.",
        },
      ]}
    />
  );
}
