import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, UserCheck, Calendar, Sparkles } from "lucide-react";
import { CategoryLandingPage } from "@/modules/marketing/category/CategoryLandingPage";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/rent/")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/rent");
    const ogImage = getOgImageUrl();
    const title = `Verified Rental Homes & Flats in Hyderabad — ${APP_NAME}`;
    const description = `Explore verified 1, 2, 3 BHK flats and houses for rent in Hyderabad's top localities with zero brokerage and direct owner contact.`;
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
  component: RentPage,
});

function RentPage() {
  return (
    <CategoryLandingPage
      slug="rent"
      badge="Homes for Rent"
      badgeColor="border-amber-500/30 bg-amber-500/10 text-amber-500"
      heroGradient="bg-gradient-to-br from-amber-950/20 via-background to-background"
      title="Verified Rental Homes"
      titleHighlight="in Hyderabad"
      subline="Browse verified 1, 2, 3 BHK flats, apartments, and independent homes for rent directly from verified landlords with 0% brokerage."
      searchListingType="rent"
      filterPredicate={(p) => p.listing_type === "rent"}
      hotspots={[
        {
          name: "Gachibowli",
          priceRange: "₹20,000 - ₹55,000 / mo",
          highlight: "Prime IT hub location close to Financial District and outer ring road.",
        },
        {
          name: "Madhapur",
          priceRange: "₹18,000 - ₹48,000 / mo",
          highlight: "Vibrant tech hotspot with metro connectivity, dining, and shopping hubs.",
        },
        {
          name: "Kondapur",
          priceRange: "₹22,000 - ₹50,000 / mo",
          highlight: "Family-friendly gated societies near Botanical Garden and schools.",
        },
        {
          name: "Financial District & Nanakramguda",
          priceRange: "₹28,000 - ₹75,000 / mo",
          highlight: "High-rise luxury gated communities next to corporate tech headquarters.",
        },
        {
          name: "Hitec City",
          priceRange: "₹25,000 - ₹60,000 / mo",
          highlight: "Walking distance to major IT parks and Cyber Towers metro station.",
        },
        {
          name: "Tellapur",
          priceRange: "₹18,000 - ₹42,000 / mo",
          highlight: "Peaceful residential township with modern clubhouse amenities.",
        },
      ]}
      features={[
        {
          icon: UserCheck,
          title: "Direct Landlord Connect",
          desc: "Connect directly with verified homeowners without paying hefty broker commissions.",
        },
        {
          icon: ShieldCheck,
          title: "Zero Brokerage",
          desc: "Save 1 to 2 months rent in brokerage fees on every rental property.",
        },
        {
          icon: Calendar,
          title: "Schedule Site Visits",
          desc: "Book convenient in-person or live video walkthroughs directly with owners.",
        },
        {
          icon: Sparkles,
          title: "Online Rental Agreements",
          desc: "Draft and manage legally valid digital rental agreements in under 10 minutes.",
        },
      ]}
      faqs={[
        {
          q: "Is there any brokerage fee to rent a house on Seedha Properties?",
          a: "No. Seedha Properties is a 100% direct-owner platform. Tenants pay 0% brokerage.",
        },
        {
          q: "How do I contact the property owner?",
          a: "Click 'Contact Owner' or 'Schedule Visit' on any property listing to get in touch with the landlord directly.",
        },
        {
          q: "Can I draft a digital rental agreement?",
          a: "Yes! Use our integrated 'Rental Agreement' tool to create, customize, and print your rental contract.",
        },
        {
          q: "Are the property photos authentic?",
          a: "All photos uploaded by owners are verified and moderated to ensure accurate representations of listed properties.",
        },
      ]}
    />
  );
}
