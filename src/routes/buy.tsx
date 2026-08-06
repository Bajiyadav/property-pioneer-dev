import { createFileRoute } from "@tanstack/react-router";
import { ProductHero } from "@/components/landing/ProductHero";
import { ExpansionRoadmap } from "@/components/landing/ExpansionRoadmap";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { LaunchProgress } from "@/components/landing/LaunchProgress";
import { RichPriorityWaitlistForm } from "@/components/landing/RichPriorityWaitlistForm";
import { ProductFaq } from "@/components/landing/ProductFaq";
import { getCanonicalUrl, getOgImageUrl, APP_NAME } from "@/config/app";

export const Route = createFileRoute("/buy")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/buy");
    const ogImage = getOgImageUrl();
    return {
      meta: [
        { title: `Buy Residential Homes — ${APP_NAME}` },
        { name: "description", content: "Buy verified residential apartments, villas, and independent houses in Hyderabad & India with zero brokerage, pre-approved bank loans, and legal title verification." },
        { property: "og:title", content: `Buy Residential Homes — ${APP_NAME}` },
        { property: "og:description", content: "Buy verified residential apartments, villas, and independent houses in Hyderabad with 0% brokerage." },
        { property: "og:image", content: ogImage },
        { property: "og:url", content: canonicalUrl },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: BuyLandingPage,
});

const BUY_FAQS = [
  { q: "When will the Buy portal launch fully in Hyderabad?", a: "The Buy portal is currently onboarding verified property owners in Madhapur, Gachibowli, Kondapur, and Hitech City. Early access members get priority 48-hour alerts before public listings." },
  { q: "Are pre-approved bank loans available?", a: "Yes, we partner directly with SBI, HDFC, ICICI, and Axis Bank to provide pre-approved home loans starting at 8.35% p.a. interest with zero processing fee margins." },
  { q: "Will legal title deed verification be included?", a: "Every listed property includes a 100% verified legal title report, encumbrance certificate audit, and HMDA/DTCP approval checks." },
  { q: "How does 0% brokerage work for home buyers?", a: "Buyers connect directly with verified property owners or builder reps without paying traditional 2% to 3% broker commissions." },
  { q: "Can I schedule in-person site visits before public launch?", a: "Yes! Priority Access Members can request private walkthrough site visits with verified owners." },
];

function BuyLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ProductHero
        badge="Residential Sales Engine"
        title="Own Your Dream Property With 100% Confidence"
        subtitle="Urban Properties is building India's most trusted home buying platform with verified sellers, legal title deed audits, bank loan pre-approvals, and AI fair market pricing."
        productType="Residential Homes"
        bgGradient="from-emerald-900/20 via-background to-background"
      />

      <ExpansionRoadmap />
      <FeatureGrid />
      <ComparisonTable />
      <LaunchProgress />
      
      <RichPriorityWaitlistForm defaultCategory="Residential Homes (Buy)" />

      <ProductFaq faqs={BUY_FAQS} />
    </div>
  );
}
