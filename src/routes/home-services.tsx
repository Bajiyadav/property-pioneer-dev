import { createFileRoute } from "@tanstack/react-router";
import { ProductHero } from "@/modules/marketing/landing/ProductHero";
import { FeatureGrid } from "@/modules/marketing/landing/FeatureGrid";
import { ComparisonTable } from "@/modules/marketing/landing/ComparisonTable";
import { LaunchProgress } from "@/modules/marketing/landing/LaunchProgress";
import { ProductFaq } from "@/modules/marketing/landing/ProductFaq";

import { HomeServicesCalculator } from "@/modules/marketing/services/HomeServicesCalculator";
import { ServiceProcessTimeline } from "@/modules/marketing/services/ServiceProcessTimeline";
import { CoverageCityMap } from "@/modules/marketing/services/CoverageCityMap";
import { RichServiceBookingForm } from "@/modules/marketing/services/RichServiceBookingForm";

import { getCanonicalUrl, getOgImageUrl, APP_NAME } from "@/config/app";

export const Route = createFileRoute("/home-services")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/home-services");
    const ogImage = getOgImageUrl();
    return {
      meta: [
        { title: `Home Services & Digital Agreements — ${APP_NAME}` },
        {
          name: "description",
          content:
            "Instant Digital E-Stamp Rental Agreements, Wall Painting, Legal Title Verification, Tenant Verification & Pre-Approved Home Loans in Hyderabad & India.",
        },
        { property: "og:title", content: `Home Services & Digital Agreements — ${APP_NAME}` },
        {
          property: "og:description",
          content:
            "Get state-stamped digital rental agreements and verified home services at guaranteed lowest rates.",
        },
        { property: "og:image", content: ogImage },
        { property: "og:url", content: canonicalUrl },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: HomeServicesLandingPage,
});

const SERVICES_FAQS = [
  {
    q: "Is the Digital Rental Agreement legally valid in Telangana?",
    a: "Yes! Every agreement includes official State E-Stamp paper, biometric e-signatures, and instant PDF download accepted by IT companies & banks.",
  },
  {
    q: "How quickly is a service professional assigned?",
    a: "Your service partner is confirmed within 15 minutes of booking with a 100% price lock guarantee.",
  },
  {
    q: "What is included in Legal Title Verification?",
    a: "Encumbrance certificate checks, title deed chain verification, approval-plan validation, and a written legal opinion from a partner advocate.",
  },
  {
    q: "When do I need to pay for the service?",
    a: "Pay zero advance! You pay via UPI or card only after 100% service completion and supervisor inspection.",
  },
];

function HomeServicesLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground space-y-12">
      <ProductHero
        badge="Tenant & Owner Services Engine"
        title="Complete Home Services & Legal Agreements Platform"
        subtitle="Get instant state-stamped digital rental agreements, legal title verification, tenant background checks, wall painting, and pre-approved home loans."
        productType="Home Services"
        bgGradient="from-teal-900/20 via-background to-background"
      />

      {/* Interactive Price Calculator */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <HomeServicesCalculator />
      </section>

      {/* 8-Stage Process Timeline */}
      <ServiceProcessTimeline />

      {/* Coverage Map */}
      <CoverageCityMap />

      <FeatureGrid />
      <ComparisonTable />
      <LaunchProgress />

      {/* Rich 10-Field Booking Form */}
      <RichServiceBookingForm />

      <ProductFaq faqs={SERVICES_FAQS} />
    </div>
  );
}
