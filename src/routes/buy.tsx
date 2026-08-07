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

export const Route = createFileRoute("/buy")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/buy");
    const ogImage = getOgImageUrl();
    return {
      meta: [
        { title: `Buy Residential Homes & Flats — ${APP_NAME}` },
        {
          name: "description",
          content:
            "Buy 100% verified 2, 3 & 4 BHK apartments, gated community villas, and independent houses in Hyderabad with pre-approved bank loans and zero brokerage.",
        },
        { property: "og:title", content: `Buy Residential Homes — ${APP_NAME}` },
        {
          property: "og:description",
          content: "Buy verified homes directly from property owners with zero broker commission.",
        },
        { property: "og:image", content: ogImage },
        { property: "og:url", content: canonicalUrl },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: BuyLandingPage,
});

const BUY_FAQS = [
  {
    q: "How are properties on the Buy module verified for legal title clearance?",
    a: "Every listed residential home undergoes legal title deed audits, HMDA/GHMC municipal plan check, and RERA registration validation.",
  },
  {
    q: "Are pre-approved bank loans available for listed homes?",
    a: "Yes, our banking partners (SBI, HDFC, ICICI, Axis) provide instant home loan eligibility up to 80% with digital pre-approval letters.",
  },
  {
    q: "Do I have to pay any brokerage fees to Urban Properties?",
    a: "No! Urban Properties operates on a 100% zero brokerage model for buyers. You interact directly with verified property owners.",
  },
  {
    q: "Which areas in Hyderabad have active residential listings?",
    a: "Active listings cover Madhapur, Hitech City, Gachibowli, Kondapur, Financial District, Jubilee Hills, Manikonda, and Tellapur.",
  },
];

function BuyLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground space-y-12">
      <ProductHero
        badge="Buy Residential Homes Engine"
        title="Buy Verified Homes Directly from Property Owners"
        subtitle="Explore 100% title-cleared 2, 3 & 4 BHK apartments, gated community villas, and independent houses across Hyderabad and Tier-1 growth hubs."
        productType="Buy Residential Homes"
        bgGradient="from-emerald-900/20 via-background to-background"
      />

      <LivePlatformStats />
      <ExpansionRoadmap />
      <FeatureGrid />
      <ComparisonTable />
      <CoverageCityMap />
      <LaunchProgress />
      <DocumentationCenter productTitle="Residential Buy Engine" />
      <MobileAppPreview />
      <RichPriorityWaitlistForm defaultCategory="Buy Residential Homes" />
      <RelatedServicesSection />
      <ProductFaq faqs={BUY_FAQS} />
    </div>
  );
}
