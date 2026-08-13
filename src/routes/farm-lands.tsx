import { createFileRoute } from "@tanstack/react-router";
import { Trees, ShieldCheck, Sun, Compass } from "lucide-react";
import { CategoryLandingPage } from "@/modules/marketing/category/CategoryLandingPage";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/farm-lands")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/farm-lands");
    const ogImage = getOgImageUrl();
    const title = `Farm Lands & Managed Farmlands in Telangana — ${APP_NAME}`;
    const description = `Explore managed farmlands, agricultural land parcels, and weekend retreat plots in Shankarpally, Chevella, Vikarabad, and Sangareddy.`;
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
  component: FarmLandsPage,
});

function FarmLandsPage() {
  return (
    <CategoryLandingPage
      slug="farm-lands"
      badge="Farm Lands & Retreats"
      badgeColor="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
      heroGradient="bg-gradient-to-br from-emerald-950/30 via-background to-background"
      title="Farm Lands & Farmlands"
      titleHighlight="in Telangana"
      subline="Discover managed farmlands, agricultural land parcels, and weekend retreat plots in Shankarpally, Chevella, Vikarabad, and Sangareddy."
      searchListingType="sale"
      filterPredicate={(p) =>
        p.property_type?.toLowerCase() === "farm land" || p.title?.toLowerCase().includes("farm")
      }
      hotspots={[
        {
          name: "Shankarpally",
          priceRange: "₹2.5 Cr - ₹6.0 Cr / acre",
          highlight:
            "Lush green belt popular for organic farming, fruit orchards, and weekend retreats.",
        },
        {
          name: "Chevella",
          priceRange: "₹1.8 Cr - ₹4.5 Cr / acre",
          highlight: "High-growth agricultural zone along the Bijapur Highway corridor.",
        },
        {
          name: "Vikarabad",
          priceRange: "₹80 L - ₹2.5 Cr / acre",
          highlight: "Scenic forest proximity and hill views, ideal for eco-farms and retreats.",
        },
        {
          name: "Sangareddy & Kandi",
          priceRange: "₹1.5 Cr - ₹4.0 Cr / acre",
          highlight: "Proximity to IIT Hyderabad campus and NH-65 industrial corridor.",
        },
        {
          name: "Zaheerabad",
          priceRange: "₹40 L - ₹1.2 Cr / acre",
          highlight: "Expanding manufacturing NIMZ zone with high land appreciation potential.",
        },
        {
          name: "Moinabad",
          priceRange: "₹3.5 Cr - ₹9.0 Cr / acre",
          highlight: "Premium retreat belt near Gandipet lake ecosystem.",
        },
      ]}
      features={[
        {
          icon: Trees,
          title: "Weekend & Organic Farming",
          desc: "Ideal land parcels for managed fruit orchards, organic cultivation, and weekend family getaways.",
        },
        {
          icon: ShieldCheck,
          title: "Direct Owner Connect",
          desc: "Connect directly with farmland title holders and developers with zero platform commission.",
        },
        {
          icon: Sun,
          title: "Clear Land Metrics",
          desc: "Detailed information on acreage, guntas, soil profile, water source, and road access.",
        },
        {
          icon: Compass,
          title: "Suburban Green Belts",
          desc: "Properties situated within convenient driving distance from Hyderabad's IT hub.",
        },
      ]}
      faqs={[
        {
          q: "How is farm land measured in Telangana?",
          a: "Agricultural land in Telangana is measured in Acres and Guntas. 1 Acre = 40 Guntas (approx. 4,840 Sq Yds).",
        },
        {
          q: "What documentation is required for agricultural land transfers?",
          a: "Transfers are conducted via the Dharani portal. Buyers must verify passbook details, land revenue records, boundary surveys, and encumbrance status.",
        },
        {
          q: "Can I build a weekend farmhouse on agricultural land?",
          a: "Farmhouse construction permissions depend on local zonal guidelines and plot size. Check Gram Panchayat or municipal building norms before planning construction.",
        },
      ]}
    />
  );
}
