import { createFileRoute } from "@tanstack/react-router";
import { Compass, ShieldCheck, TrendingUp, MapPin } from "lucide-react";
import { CategoryLandingPage } from "@/modules/marketing/category/CategoryLandingPage";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/plots")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/plots");
    const ogImage = getOgImageUrl();
    const title = `Open Plots & Land for Sale in Hyderabad — ${APP_NAME}`;
    const description = `Discover residential open plots, layout plots, and land for sale in Tellapur, Kollur, Maheshwaram, Shankarpally, and Bachupally growth corridors.`;
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
  component: PlotsPage,
});

function PlotsPage() {
  return (
    <CategoryLandingPage
      slug="plots"
      badge="Open Plots & Land"
      badgeColor="border-amber-500/30 bg-amber-500/10 text-amber-500"
      heroGradient="bg-gradient-to-br from-amber-950/20 via-background to-background"
      title="Open Plots & Layout Land"
      titleHighlight="in Growth Corridors"
      subline="Find residential open plots, layout land, and plot parcels for custom villa construction in Hyderabad's fastest expanding urban corridors."
      searchListingType="sale"
      filterPredicate={(p) =>
        p.property_type?.toLowerCase() === "plot" || p.title?.toLowerCase().includes("plot")
      }
      hotspots={[
        {
          name: "Tellapur & Kollur",
          priceRange: "₹35,000 - ₹65,000 / sqyd",
          highlight: "Prime residential plot corridor right off Outer Ring Road (ORR) Exit 2.",
        },
        {
          name: "Bachupally & Miyapur",
          priceRange: "₹28,000 - ₹50,000 / sqyd",
          highlight: "Established North-Western growth hub with top educational institutions.",
        },
        {
          name: "Maheshwaram & Srisailam Highway",
          priceRange: "₹15,000 - ₹32,000 / sqyd",
          highlight: "High-appreciation zone near Airport and Hardware Park.",
        },
        {
          name: "Shankarpally",
          priceRange: "₹12,000 - ₹25,000 / sqyd",
          highlight: "Green residential corridor popular for villa plots and country homes.",
        },
        {
          name: "Shadnagar",
          priceRange: "₹8,000 - ₹18,000 / sqyd",
          highlight: "Rapidly expanding residential and industrial growth belt on NH-44.",
        },
        {
          name: "Medchal & Kompally",
          priceRange: "₹22,000 - ₹45,000 / sqyd",
          highlight: "Well-connected Northern layout plots with established social infrastructure.",
        },
      ]}
      features={[
        {
          icon: Compass,
          title: "Clear Plot Dimensions",
          desc: "Accurate details on square yardage, facing direction, and approach road width.",
        },
        {
          icon: TrendingUp,
          title: "High Growth Potential",
          desc: "Target high-yield land parcels situated near upcoming infrastructure developments.",
        },
        {
          icon: ShieldCheck,
          title: "Direct Landowner Connect",
          desc: "Speak directly with landowners or layout sellers without broker commission.",
        },
        {
          icon: MapPin,
          title: "ORR Corridor Coverage",
          desc: "Explore plot listings across Outer Ring Road interchanges and suburban hubs.",
        },
      ]}
      faqs={[
        {
          q: "How is plot size measured in Hyderabad?",
          a: "Plot sizes in Telangana are measured in Square Yards (Sq Yds), where 1 Sq Yd = 9 Sq Ft (e.g., 200 Sq Yds = 1,800 Sq Ft).",
        },
        {
          q: "What documentation should I check when buying land?",
          a: "Always verify link deeds, encumbrance certificates (EC), layout approvals, and boundary measurements with qualified legal consultants before making a deposit.",
        },
        {
          q: "Is listing an open plot free on Urban Properties?",
          a: "Yes. Property owners can list residential plots or land parcels for free.",
        },
      ]}
    />
  );
}
