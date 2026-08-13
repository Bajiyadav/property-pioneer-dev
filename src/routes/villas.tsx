import { createFileRoute } from "@tanstack/react-router";
import { Castle, ShieldCheck, Trees, Sparkles } from "lucide-react";
import { CategoryLandingPage } from "@/modules/marketing/category/CategoryLandingPage";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/villas")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/villas");
    const ogImage = getOgImageUrl();
    const title = `Luxury Villas & Independent Houses in Hyderabad — ${APP_NAME}`;
    const description = `Explore luxury triplex villas, gated community homes, and independent houses for sale and rent in Kokapet, Manikonda, Mokila, Tellapur, and Jubilee Hills.`;
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
  component: VillasPage,
});

function VillasPage() {
  return (
    <CategoryLandingPage
      slug="villas"
      badge="Luxury Villas & Houses"
      badgeColor="border-purple-500/30 bg-purple-500/10 text-purple-500"
      heroGradient="bg-gradient-to-br from-purple-950/20 via-background to-background"
      title="Luxury Gated Villas"
      titleHighlight="in Hyderabad"
      subline="Explore premium triplex villas, independent houses, and gated villa communities in Manikonda, Kokapet, Mokila, and Tellapur with zero platform commission."
      searchListingType="all"
      filterPredicate={(p) =>
        p.property_type?.toLowerCase() === "villa" || p.title?.toLowerCase().includes("villa")
      }
      hotspots={[
        {
          name: "Kokapet Neopolis",
          priceRange: "₹2.5 Cr - ₹7.5 Cr",
          highlight:
            "Ultra-luxury gated triplex villas with private gardens and high-end clubhouses.",
        },
        {
          name: "Manikonda",
          priceRange: "₹1.8 Cr - ₹4.2 Cr",
          highlight: "Prime IT corridor location with established gated villa communities.",
        },
        {
          name: "Mokila",
          priceRange: "₹1.4 Cr - ₹3.5 Cr",
          highlight: "Serene green enclave near Financial District with rapid price appreciation.",
        },
        {
          name: "Tellapur",
          priceRange: "₹2.0 Cr - ₹5.0 Cr",
          highlight: "Modern township villa developments next to top international schools.",
        },
        {
          name: "Jubilee Hills",
          priceRange: "₹8.0 Cr - ₹25 Cr+",
          highlight:
            "Ultra-exclusive residential neighborhood for luxury estates and private mansions.",
        },
        {
          name: "Gandipet",
          priceRange: "₹3.0 Cr - ₹9.0 Cr",
          highlight: "Lake-view gated villa communities with expansive green landscapes.",
        },
      ]}
      features={[
        {
          icon: Castle,
          title: "Private Living Spaces",
          desc: "Multi-floor triplex layouts with private terrace gardens and multi-car garages.",
        },
        {
          icon: ShieldCheck,
          title: "Gated Security & Privacy",
          desc: "24/7 security perimeters, CCTV coverage, and controlled entry gates.",
        },
        {
          icon: Trees,
          title: "Clubhouse & Greenery",
          desc: "Landscaped parks, swimming pools, tennis courts, and community clubhouses.",
        },
        {
          icon: Sparkles,
          title: "Direct Owner Connect",
          desc: "No platform commission added to villa rentals or outright villa sales.",
        },
      ]}
      faqs={[
        {
          q: "What is the difference between gated villas and independent houses?",
          a: "Gated villas are part of a private residential township with shared security, clubhouses, and maintenance, while independent houses stand on individual plots.",
        },
        {
          q: "Can I schedule a weekend site visit to a villa?",
          a: "Yes. Click 'Schedule Visit' on any villa listing page to choose your preferred date and time for a guided walkthrough with the property owner.",
        },
        {
          q: "Are villa maintenance costs included in rent?",
          a: "For rental villas, maintenance fees may be included or billed separately depending on the owner's agreement. Check property details or clarify directly with the owner.",
        },
      ]}
    />
  );
}
