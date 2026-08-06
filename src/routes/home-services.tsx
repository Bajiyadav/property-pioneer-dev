import { createFileRoute } from "@tanstack/react-router";
import { ProductHero } from "@/components/landing/ProductHero";
import { ExpansionRoadmap } from "@/components/landing/ExpansionRoadmap";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { LaunchProgress } from "@/components/landing/LaunchProgress";
import { RichPriorityWaitlistForm } from "@/components/landing/RichPriorityWaitlistForm";
import { ProductFaq } from "@/components/landing/ProductFaq";
import { getCanonicalUrl, getOgImageUrl, APP_NAME } from "@/config/app";

export const Route = createFileRoute("/home-services")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/home-services");
    const ogImage = getOgImageUrl();
    return {
      meta: [
        { title: `Home Services & Rental Agreements — ${APP_NAME}` },
        { name: "description", content: "Instant Digital E-Stamp Rental Agreements, Packers & Movers, Deep House Cleaning, Painting, & Home Loan Pre-Approvals in Hyderabad & India." },
        { property: "og:title", content: `Home Services & Rental Agreements — ${APP_NAME}` },
        { property: "og:description", content: "Get state-stamped digital rental agreements and verified home services at guaranteed lowest rates." },
        { property: "og:image", content: ogImage },
        { property: "og:url", content: canonicalUrl },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: HomeServicesLandingPage,
});

const SERVICES_FAQS = [
  { q: "Is the Digital Rental Agreement legally valid in Telangana?", a: "Yes! Every agreement includes official State E-Stamp paper, biometric e-signatures, and instant PDF download accepted by IT companies & banks." },
  { q: "How quickly are Packers & Movers assigned?", a: "Movers are confirmed within 15 minutes of booking with 100% price lock guarantee." },
  { q: "What is included in Deep House Cleaning?", a: "Full floor machine scrubbing, bathroom descaling, kitchen degreasing, sofa shampooing, and balcony sanitization." },
];

function HomeServicesLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ProductHero
        badge="Tenant & Owner Services Suite"
        title="Complete Home Services & Legal Agreements Platform"
        subtitle="Get instant state-stamped digital rental agreements, verified packers & movers, deep home cleaning, wall painting, and pre-approved home loans."
        productType="Home Services"
        bgGradient="from-teal-900/20 via-background to-background"
      />

      <ExpansionRoadmap />
      <FeatureGrid />
      <ComparisonTable />
      <LaunchProgress />

      <RichPriorityWaitlistForm defaultCategory="Home Services & Agreements" />

      <ProductFaq faqs={SERVICES_FAQS} />
    </div>
  );
}
