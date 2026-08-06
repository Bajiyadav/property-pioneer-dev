import { createFileRoute } from "@tanstack/react-router";
import { ProductHero } from "@/components/landing/ProductHero";
import { ExpansionRoadmap } from "@/components/landing/ExpansionRoadmap";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { LaunchProgress } from "@/components/landing/LaunchProgress";
import { RichPriorityWaitlistForm } from "@/components/landing/RichPriorityWaitlistForm";
import { ProductFaq } from "@/components/landing/ProductFaq";
import { getCanonicalUrl, getOgImageUrl, APP_NAME } from "@/config/app";

export const Route = createFileRoute("/pg-hostels")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/pg-hostels");
    const ogImage = getOgImageUrl();
    return {
      meta: [
        { title: `PG & Co-Living Spaces — ${APP_NAME}` },
        { name: "description", content: "Book premium luxury PGs, executive co-living spaces, and student hostels in Gachibowli, Madhapur, & Hitech City with 3 meals, AC, and Wi-Fi." },
        { property: "og:title", content: `PG & Co-Living Spaces — ${APP_NAME}` },
        { property: "og:description", content: "Book premium PGs & Co-Living in Hyderabad IT Corridor with 0% deposit hassle." },
        { property: "og:image", content: ogImage },
        { property: "og:url", content: canonicalUrl },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: PgHostelsLandingPage,
});

const PG_FAQS = [
  { q: "What amenities are included in luxury PG rooms?", a: "High-speed Wi-Fi, 3 daily meals, daily housekeeping, AC, bi-weekly linen change, 24/7 security, and washing machine access." },
  { q: "Are single, double, and triple sharing rooms available?", a: "Yes, we list private single occupancy rooms as well as budget double and triple sharing options." },
  { q: "What is the minimum lock-in period for PGs?", a: "Flexibility starts from 1-month stays up to annual stays with 0% brokerage fees." },
];

function PgHostelsLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ProductHero
        badge="Co-Living & PG Engine"
        title="Modern Co-Living & Executive PGs for Techies & Students"
        subtitle="Book fully managed luxury PGs and co-living spaces near Cyber Towers, DLF Cybercity, & Mindspace IT Park with 3 meals, high-speed Wi-Fi, and 24/7 security."
        productType="PG & Co-Living"
        bgGradient="from-indigo-900/20 via-background to-background"
      />

      <ExpansionRoadmap />
      <FeatureGrid />
      <ComparisonTable />
      <LaunchProgress />

      <RichPriorityWaitlistForm defaultCategory="PG & Co-Living Spaces" />

      <ProductFaq faqs={PG_FAQS} />
    </div>
  );
}
