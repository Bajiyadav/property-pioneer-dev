import { createFileRoute } from "@tanstack/react-router";
import { ProductHero } from "@/components/landing/ProductHero";
import { ExpansionRoadmap } from "@/components/landing/ExpansionRoadmap";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { LaunchProgress } from "@/components/landing/LaunchProgress";
import { RichPriorityWaitlistForm } from "@/components/landing/RichPriorityWaitlistForm";
import { ProductFaq } from "@/components/landing/ProductFaq";
import { getCanonicalUrl, getOgImageUrl, APP_NAME } from "@/config/app";

export const Route = createFileRoute("/commercial")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/commercial");
    const ogImage = getOgImageUrl();
    return {
      meta: [
        { title: `Commercial & Office Spaces — ${APP_NAME}` },
        { name: "description", content: "Lease or buy verified tech park offices, retail shops, co-working spaces, and commercial buildings in Hyderabad & India with zero brokerage." },
        { property: "og:title", content: `Commercial & Office Spaces — ${APP_NAME}` },
        { property: "og:description", content: "Find verified office spaces and retail shops in Hitech City, Madhapur, & Financial District." },
        { property: "og:image", content: ogImage },
        { property: "og:url", content: canonicalUrl },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: CommercialLandingPage,
});

const COMMERCIAL_FAQS = [
  { q: "Which commercial areas in Hyderabad are covered?", a: "We focus on Mindspace IT Park, Financial District, Hitech City, Gachibowli, Jubilee Hills, and Banjara Hills commercial hubs." },
  { q: "Can tech startups book plug-and-play furnished offices?", a: "Yes! We list fully furnished plug-and-play offices with workstations, conference rooms, high-speed fiber internet, and 100% DG power backup." },
  { q: "Is commercial legal title verification provided?", a: "Every commercial building listing includes occupancy certificates (OC), fire safety NOC, zoning permissions, and title deed verification." },
  { q: "What is the typical lock-in and lease agreement period?", a: "Lease structures range from 3-year to 9-year terms with standard 3-year escalation clauses." },
];

function CommercialLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ProductHero
        badge="Commercial Real Estate Engine"
        title="Scale Your Business in Prime IT & Commercial Hubs"
        subtitle="Lease or buy verified office spaces, retail showrooms, co-working centers, and commercial buildings directly from property owners in Hyderabad and India."
        productType="Commercial Properties"
        bgGradient="from-blue-900/20 via-background to-background"
      />

      <ExpansionRoadmap />
      <FeatureGrid />
      <ComparisonTable />
      <LaunchProgress />

      <RichPriorityWaitlistForm defaultCategory="Commercial Office & Retail" />

      <ProductFaq faqs={COMMERCIAL_FAQS} />
    </div>
  );
}
