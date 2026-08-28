import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchProperties } from "@/modules/property/services/propertyQueries";
import {
  APP_NAME,
  APP_DESCRIPTION,
  GLOBAL_TITLE,
  getCanonicalUrl,
  getOgImageUrl,
} from "@/config/app";

import { HeroSection } from "@/modules/marketing/home/HeroSection";
import { QuoteBanner } from "@/modules/marketing/home/QuoteBanner";
import { FeaturedProperties } from "@/modules/marketing/home/FeaturedProperties";
import { PaymentsAndRewardsBanner } from "@/modules/marketing/home/PaymentsAndRewardsBanner";
import { PopularCities } from "@/modules/marketing/home/PopularCities";
import { WhySeedhaProperties } from "@/modules/marketing/home/WhySeedhaProperties";
import { HowItWorks } from "@/modules/marketing/home/HowItWorks";
import { OwnerCTA } from "@/modules/marketing/home/OwnerCTA";
import { FAQSection } from "@/modules/marketing/home/FAQSection";
import { FeedbackSection } from "@/modules/feedback/components/FeedbackSection";

import { ValueAddedServices } from "@/modules/marketing/home/ValueAddedServices";
import { CityExpansionModal, type CityModalData } from "@/components/dialogs/CityExpansionModal";

export const Route = createFileRoute("/")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/");
    const ogImage = getOgImageUrl();
    return {
      meta: [
        { title: GLOBAL_TITLE },
        { name: "description", content: APP_DESCRIPTION },
        { property: "og:title", content: GLOBAL_TITLE },
        { property: "og:description", content: APP_DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: APP_NAME },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: GLOBAL_TITLE },
        { name: "twitter:description", content: APP_DESCRIPTION },
        { name: "twitter:image", content: ogImage },
        { name: "robots", content: "index, follow" },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Interactive Modal States
  const [activeCity, setActiveCity] = useState<CityModalData | null>(null);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: () => fetchProperties(),
    staleTime: 5 * 60 * 1000,
  });

  const featured = properties.filter((p) => p.is_featured);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/properties",
      search: { q, city: "", listing: "rent", minPrice: 0, maxPrice: 0, beds: 0 },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. Hero Section (Hyderabad Focus) */}
      <HeroSection
        query={q}
        onQueryChange={setQ}
        selectedState={selectedState}
        setSelectedState={setSelectedState}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        onSearch={handleSearchSubmit}
      />

      {/* 2. Real Estate Quote Banner */}
      <QuoteBanner />

      {/* 4. Featured Rentals (Hyderabad Focus) */}
      <FeaturedProperties
        properties={featured.length > 0 ? featured : properties}
        isLoading={isLoading}
      />

      {/* 6. Payments & Rent Rewards Banner */}
      <PaymentsAndRewardsBanner />

      {/* 7. What Seedha Properties actually does today */}
      <div id="why-us">
        <WhySeedhaProperties />
      </div>

      {/* 6. Live market + expansion roadmap (Interactive City Modal) */}
      <PopularCities onSelectCity={(city) => setActiveCity(city)} />

      {/* 7. Dual-tab How It Works Workflow */}
      <HowItWorks />

      {/* 8. Owner CTA Banner (Triggers Multi-Step Wizard) */}
      <OwnerCTA onOpenWizard={() => navigate({ to: "/list-property" })} />

      {/* 9. We Value Your Feedback Section (Studio Shodwe + Radiant Thank You) */}
      <FeedbackSection />

      {/* 10. Support FAQ Accordion */}
      <div id="contact">
        <FAQSection />
      </div>

      {/* Value Added Services - Always visible as an attraction at the bottom */}
      <ValueAddedServices />

      {/* ======================================= */}
      {/* INTERACTIVE MODALS                      */}
      {/* ======================================= */}
      <CityExpansionModal data={activeCity} onClose={() => setActiveCity(null)} />
    </div>
  );
}
