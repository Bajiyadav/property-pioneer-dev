import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchProperties } from "@/modules/property/services/propertyQueries";
import { APP_NAME, APP_DESCRIPTION, getCanonicalUrl, getOgImageUrl } from "@/config/app";

import { HeroSection } from "@/modules/marketing/home/HeroSection";
import { QuoteBanner } from "@/modules/marketing/home/QuoteBanner";
import { PropertyCategories } from "@/modules/marketing/home/PropertyCategories";
import { FeaturedProperties } from "@/modules/marketing/home/FeaturedProperties";
import { PopularCities } from "@/modules/marketing/home/PopularCities";
import { WhyUrbanProperties } from "@/modules/marketing/home/WhyUrbanProperties";
import { HowItWorks } from "@/modules/marketing/home/HowItWorks";
import { IndiaMapSection } from "@/modules/marketing/home/IndiaMapSection";
import { Testimonials } from "@/modules/marketing/home/Testimonials";
import { OwnerCTA } from "@/modules/marketing/home/OwnerCTA";
import { FAQSection } from "@/modules/marketing/home/FAQSection";
import { NewsletterSection } from "@/modules/marketing/home/NewsletterSection";
import { AppSection } from "@/modules/marketing/home/AppSection";

import { CategoryModal, type CategoryModalData } from "@/shared/components/dialogs/CategoryModal";
import {
  CityExpansionModal,
  type CityModalData,
} from "@/shared/components/dialogs/CityExpansionModal";
import { OwnerOnboardingModal } from "@/shared/components/dialogs/OwnerOnboardingModal";

import { UrbanAISearch } from "@/modules/marketing/home/UrbanAISearch";

export const Route = createFileRoute("/")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/");
    const ogImage = getOgImageUrl();
    return {
      meta: [
        { title: `${APP_NAME} — Hyderabad Premier Real Estate Platform` },
        { name: "description", content: APP_DESCRIPTION },
        { property: "og:title", content: `${APP_NAME} — Hyderabad Premier Real Estate Platform` },
        { property: "og:description", content: APP_DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: APP_NAME },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${APP_NAME} — Hyderabad Premier Real Estate Platform` },
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

  // Interactive Modal States
  const [activeCategory, setActiveCategory] = useState<CategoryModalData | null>(null);
  const [activeCity, setActiveCity] = useState<CityModalData | null>(null);
  const [showOwnerWizard, setShowOwnerWizard] = useState(false);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  const featured = properties.filter((p) => p.is_featured);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/properties",
      search: { q, city: "Hyderabad", listing: "rent", minPrice: 0, maxPrice: 0, beds: 0 },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. Hero Section (Hyderabad Focus) */}
      <HeroSection
        query={q}
        onQueryChange={setQ}
        onSearch={handleSearchSubmit}
        onOpenOwnerWizard={() => setShowOwnerWizard(true)}
      />

      {/* 2. Real Estate Quote Banner */}
      <QuoteBanner />

      {/* 2.5 Urban AI Natural Language Search */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <UrbanAISearch />
      </div>

      {/* 3. Property Categories Grid (Interactive Category Modal) */}
      <PropertyCategories onSelectCategory={(cat) => setActiveCategory(cat)} />

      {/* 4. Featured Rentals (Hyderabad Focus) */}
      <FeaturedProperties
        properties={featured.length > 0 ? featured : properties}
        isLoading={isLoading}
      />

      {/* 6. Popular Cities & Expansion Hubs (Interactive City Roadmap Modal) */}
      <PopularCities onSelectCity={(city) => setActiveCity(city)} />

      {/* 7. Why Urban Properties (Benefits) */}
      <div id="why-us">
        <WhyUrbanProperties />
      </div>

      {/* 8. Dual-tab How It Works Workflow */}
      <HowItWorks />

      {/* 10. Interactive India Map & Expansion */}
      <IndiaMapSection />

      {/* 12. Verified Customer & Owner Stories */}
      <Testimonials />

      {/* 13. Owner CTA Banner (Triggers Multi-Step Wizard) */}
      <OwnerCTA onOpenWizard={() => setShowOwnerWizard(true)} />

      {/* 14. Support FAQ Accordion */}
      <div id="contact">
        <FAQSection />
      </div>

      {/* 15. Newsletter Subscription */}
      <NewsletterSection />

      {/* 16. Mobile App Banner */}
      <AppSection />

      {/* ======================================= */}
      {/* INTERACTIVE MODALS & DRAWERS            */}
      {/* ======================================= */}
      <CategoryModal data={activeCategory} onClose={() => setActiveCategory(null)} />
      <CityExpansionModal data={activeCity} onClose={() => setActiveCity(null)} />
      <OwnerOnboardingModal isOpen={showOwnerWizard} onClose={() => setShowOwnerWizard(false)} />
    </div>
  );
}
