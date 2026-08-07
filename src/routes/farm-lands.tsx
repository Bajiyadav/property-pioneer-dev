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

export const Route = createFileRoute("/farm-lands")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/farm-lands");
    const ogImage = getOgImageUrl();
    return {
      meta: [
        { title: `Agricultural & Managed Farm Lands — ${APP_NAME}` },
        {
          name: "description",
          content:
            "Invest in clear-title agricultural land, organic managed farmland, and Weekend Farmhouses around Hyderabad, Vikarabad, & Chevella.",
        },
        { property: "og:title", content: `Agricultural & Managed Farm Lands — ${APP_NAME}` },
        {
          property: "og:description",
          content:
            "Invest in verified managed farmlands around Hyderabad with 100% Dharani passbook verification.",
        },
        { property: "og:image", content: ogImage },
        { property: "og:url", content: canonicalUrl },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: FarmLandsLandingPage,
});

const FARMLANDS_FAQS = [
  {
    q: "How is agricultural land title verified in Telangana?",
    a: "Every farmland listing undergoes 100% Dharani portal verification, Pahani record checks, and survey number boundary audits.",
  },
  {
    q: "What is managed organic farming?",
    a: "Managed farmland includes professional plantation maintenance (sandalwood, mahogany, fruit orchards) with 24/7 caretaker security.",
  },
  {
    q: "Can non-agriculturalists buy farmlands?",
    a: "Yes, our legal team assists with state-specific land purchase compliance and Dharani passbook issuance.",
  },
];

function FarmLandsLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground space-y-12">
      <ProductHero
        badge="Agricultural Land Engine"
        title="Invest in Managed Organic Farmlands & Country Estates"
        subtitle="Secure high-yield agricultural land, sandalwood plantations, and weekend farmhouses near Vikarabad, Chevella, & Sangareddy with 100% Dharani title clearance."
        productType="Managed Farmlands"
        bgGradient="from-emerald-950/30 via-background to-background"
      />

      <LivePlatformStats />
      <ExpansionRoadmap />
      <FeatureGrid />
      <ComparisonTable />
      <CoverageCityMap />
      <LaunchProgress />
      <DocumentationCenter productTitle="Managed Farmlands Engine" />
      <MobileAppPreview />
      <RichPriorityWaitlistForm defaultCategory="Managed Farm Lands" />
      <RelatedServicesSection />
      <ProductFaq faqs={FARMLANDS_FAQS} />
    </div>
  );
}
