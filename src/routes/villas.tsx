import { createFileRoute } from "@tanstack/react-router";
import { ProductHero } from "@/modules/marketing/landing/ProductHero";
import { ExpansionRoadmap } from "@/modules/marketing/landing/ExpansionRoadmap";
import { FeatureGrid } from "@/modules/marketing/landing/FeatureGrid";
import { ComparisonTable } from "@/modules/marketing/landing/ComparisonTable";
import { LaunchProgress } from "@/modules/marketing/landing/LaunchProgress";
import { RichPriorityWaitlistForm } from "@/modules/marketing/landing/RichPriorityWaitlistForm";
import { ProductFaq } from "@/modules/marketing/landing/ProductFaq";
import { LivePlatformStats } from "@/modules/marketing/landing/LivePlatformStats";
import { DocumentationCenter } from "@/modules/marketing/landing/DocumentationCenter";
import { MobileAppPreview } from "@/modules/marketing/landing/MobileAppPreview";
import { RelatedServicesSection } from "@/modules/marketing/landing/RelatedServicesSection";
import { CoverageCityMap } from "@/modules/marketing/services/CoverageCityMap";
import { getCanonicalUrl, getOgImageUrl, APP_NAME } from "@/config/app";

export const Route = createFileRoute("/villas")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/villas");
    const ogImage = getOgImageUrl();
    return {
      meta: [
        { title: `Luxury Gated Villas — ${APP_NAME}` },
        {
          name: "description",
          content:
            "Explore luxury 3, 4, & 5 BHK gated community villas in Jubilee Hills, Gachibowli, Kokapet, Manikonda, & Gandipet with private pools and 0% brokerage.",
        },
        { property: "og:title", content: `Luxury Gated Villas — ${APP_NAME}` },
        {
          property: "og:description",
          content: "Explore luxury gated villas in Hyderabad premier residential enclaves.",
        },
        { property: "og:image", content: ogImage },
        { property: "og:url", content: canonicalUrl },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: VillasLandingPage,
});

const VILLAS_FAQS = [
  {
    q: "Which villa communities in Hyderabad are featured?",
    a: "We feature luxury gated villas in Jubilee Hills, Kokapet, Gandipet, Financial District, Tellapur, and Mokila.",
  },
  {
    q: "Do these villas include private pools and clubhouses?",
    a: "Yes, featured luxury villas include private swimming pools, landscaped gardens, 50,000 sq.ft clubhouses, and 3-tier security.",
  },
  {
    q: "Are villa rental agreements available?",
    a: "Yes, both luxury villa rentals and outright purchases are supported with zero broker fees.",
  },
];

function VillasLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground space-y-12">
      <ProductHero
        badge="Luxury Estates Engine"
        title="Experience Elite Gated Villa Living"
        subtitle="Discover luxury 3, 4 & 5 BHK independent duplex villas, private pool estates, and ultra-premium gated communities across Hyderabad."
        productType="Luxury Villas"
        bgGradient="from-purple-900/20 via-background to-background"
      />

      <LivePlatformStats />
      <ExpansionRoadmap />
      <FeatureGrid />
      <ComparisonTable />
      <CoverageCityMap />
      <LaunchProgress />
      <DocumentationCenter productTitle="Luxury Villas Engine" />
      <MobileAppPreview />
      <RichPriorityWaitlistForm defaultCategory="Luxury Gated Villas" />
      <RelatedServicesSection />
      <ProductFaq faqs={VILLAS_FAQS} />
    </div>
  );
}
