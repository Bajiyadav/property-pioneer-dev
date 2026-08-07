import { createFileRoute } from "@tanstack/react-router";
import { ProductHero } from "@/components/landing/ProductHero";
import { ExpansionRoadmap } from "@/components/landing/ExpansionRoadmap";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { LaunchProgress } from "@/components/landing/LaunchProgress";
import { RichPriorityWaitlistForm } from "@/components/landing/RichPriorityWaitlistForm";
import { ProductFaq } from "@/components/landing/ProductFaq";
import { LivePlatformStats } from "@/components/landing/LivePlatformStats";
import { DocumentationCenter } from "@/components/landing/DocumentationCenter";
import { MobileAppPreview } from "@/components/landing/MobileAppPreview";
import { RelatedServicesSection } from "@/components/landing/RelatedServicesSection";
import { CoverageCityMap } from "@/components/services/CoverageCityMap";
import { getCanonicalUrl, getOgImageUrl, APP_NAME } from "@/config/app";

export const Route = createFileRoute("/plots")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/plots");
    const ogImage = getOgImageUrl();
    return {
      meta: [
        { title: `HMDA & DTCP Approved Plots — ${APP_NAME}` },
        {
          name: "description",
          content:
            "Buy HMDA, DTCP, and RERA approved residential plot land in Hyderabad, Shankarpally, Mokila, Shadnagar, & ORR growth corridors with 100% legal title clearance.",
        },
        { property: "og:title", content: `HMDA & DTCP Approved Plots — ${APP_NAME}` },
        {
          property: "og:description",
          content:
            "Buy verified residential plots in Hyderabad growth corridors with 0% brokerage.",
        },
        { property: "og:image", content: ogImage },
        { property: "og:url", content: canonicalUrl },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: PlotsLandingPage,
});

const PLOTS_FAQS = [
  {
    q: "Are all listed plots HMDA / DTCP approved?",
    a: "Yes! Every plot listing undergoes strict layout verification for HMDA, DTCP, or RERA approval with clear LP numbers.",
  },
  {
    q: "Which growth corridors in Hyderabad are featured?",
    a: "We feature plots in Mokila, Shankarpally, Tellapur, Patancheru, Shadnagar, Srisailam Highway, and Regional Ring Road (RRR) corridors.",
  },
  {
    q: "Can I get bank plot loans?",
    a: "Yes, our partner banks (SBI, HDFC, ICICI) provide up to 70% plot purchase and construction loan clearance.",
  },
  {
    q: "How are boundary markers verified?",
    a: "Every layout undergoes digital GPS boundary survey verification before listing.",
  },
];

function PlotsLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground space-y-12">
      <ProductHero
        badge="Land & Plots Engine"
        title="Invest in HMDA & DTCP Approved Plot Land"
        subtitle="Secure high-appreciation residential land and gated plot layouts along Hyderabad's ORR and growth corridors with 100% legal title clearance."
        productType="Residential Plots"
        bgGradient="from-amber-900/20 via-background to-background"
      />

      <LivePlatformStats />
      <ExpansionRoadmap />
      <FeatureGrid />
      <ComparisonTable />
      <CoverageCityMap />
      <LaunchProgress />
      <DocumentationCenter productTitle="Plots & Land Engine" />
      <MobileAppPreview />
      <RichPriorityWaitlistForm defaultCategory="Residential Plots & Land" />
      <RelatedServicesSection />
      <ProductFaq faqs={PLOTS_FAQS} />
    </div>
  );
}
