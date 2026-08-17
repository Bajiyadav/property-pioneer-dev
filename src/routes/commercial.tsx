import { createFileRoute } from "@tanstack/react-router";
import { Building2, ShieldCheck, Zap, Compass } from "lucide-react";
import { CategoryLandingPage } from "@/modules/marketing/category/CategoryLandingPage";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/commercial")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/commercial");
    const ogImage = getOgImageUrl();
    const title = `Commercial Real Estate & Office Spaces in Hyderabad — ${APP_NAME}`;
    const description = `Explore Grade-A office spaces, tech park suites, retail storefronts, and commercial properties for rent and sale in Hitech City, Financial District, and Gachibowli.`;
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
  component: CommercialPage,
});

function CommercialPage() {
  return (
    <CategoryLandingPage
      slug="commercial"
      badge="Commercial Real Estate"
      badgeColor="border-blue-500/30 bg-blue-500/10 text-blue-500"
      heroGradient="bg-gradient-to-br from-blue-950/20 via-background to-background"
      title="Office & Commercial Space"
      titleHighlight="in Cyberabad"
      subline="Discover Grade-A office spaces, retail storefronts, tech park suites, and commercial property listings in Hyderabad's prime business hubs."
      searchListingType="all"
      filterPredicate={(p) =>
        p.property_type?.toLowerCase() === "commercial" ||
        p.title?.toLowerCase().includes("commercial") ||
        p.description?.toLowerCase().includes("office")
      }
      hotspots={[
        {
          name: "Hitech City",
          priceRange: "₹75 - ₹120 / sqft/mo",
          highlight: "Prime IT park towers, high footfall retail, and seamless metro access.",
        },
        {
          name: "Financial District",
          priceRange: "₹80 - ₹130 / sqft/mo",
          highlight: "Corporate headquarters, MNC suites, and modern LEED-certified towers.",
        },
        {
          name: "Madhapur",
          priceRange: "₹65 - ₹100 / sqft/mo",
          highlight: "Boutique office spaces, tech studios, and vibrant commercial streets.",
        },
        {
          name: "Gachibowli",
          priceRange: "₹60 - ₹95 / sqft/mo",
          highlight: "Strategic ORR access connecting Western commercial zones.",
        },
        {
          name: "Begumpet & Somajiguda",
          priceRange: "₹50 - ₹85 / sqft/mo",
          highlight: "Central business district legacy hubs with established commercial density.",
        },
        {
          name: "Uppal & Pocharam",
          priceRange: "₹35 - ₹60 / sqft/mo",
          highlight: "Emerging IT parks and commercial corridors in Eastern Hyderabad.",
        },
      ]}
      features={[
        {
          icon: Building2,
          title: "Verified Commercial Specs",
          desc: "Clear metrics on power backup, floor loading, lift capacity, and parking ratios.",
        },
        {
          icon: ShieldCheck,
          title: "Direct Landlord Connect",
          desc: "Engage directly with commercial property owners and building facility managers.",
        },
        {
          icon: Zap,
          title: "Zero Platform Markup",
          desc: "No platform commission added to lease terms or commercial sale listings.",
        },
        {
          icon: Compass,
          title: "Strategic Corridor Guidance",
          desc: "Filter by proximity to metro stations, ORR interchanges, and tech campuses.",
        },
      ]}
      faqs={[
        {
          q: "What types of commercial spaces are available on Seedha Properties?",
          a: "Our catalogue supports Grade-A office floors, plug-and-play IT office spaces, retail storefronts, bare-shell commercial units, and independent commercial buildings.",
        },
        {
          q: "How are commercial lease negotiations structured?",
          a: "Commercial leases, lock-in periods, security deposits, escalation clauses, and maintenance agreements are negotiated directly between tenant and commercial property owner.",
        },
        {
          q: "Are commercial properties listed here for rent or sale?",
          a: "Both rental office spaces and commercial properties for outright purchase can be listed by owners.",
        },
        {
          q: "How do I schedule a walk-through of a commercial building?",
          a: "Select your desired commercial listing and click 'Schedule Visit' to request a physical tour directly with the property owner or facility team.",
        },
      ]}
    />
  );
}
