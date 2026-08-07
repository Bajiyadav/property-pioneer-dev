import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchProperties } from "@/lib/properties";
import { APP_NAME, APP_DESCRIPTION, getCanonicalUrl, getOgImageUrl } from "@/config/app";

import { HeroSection } from "@/components/home/HeroSection";
import { QuoteBanner } from "@/components/home/QuoteBanner";
import { PropertyCategories } from "@/components/home/PropertyCategories";
import { FeaturedProperties } from "@/components/home/FeaturedProperties";
import { ComingSoonBadges } from "@/components/home/ComingSoonBadges";
import { PopularCities } from "@/components/home/PopularCities";
import { WhyUrbanProperties } from "@/components/home/WhyUrbanProperties";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Services } from "@/components/home/Services";
import { IndiaMapSection } from "@/components/home/IndiaMapSection";
import { NearbyPlaces } from "@/components/home/NearbyPlaces";
import { Testimonials } from "@/components/home/Testimonials";
import { OwnerCTA } from "@/components/home/OwnerCTA";
import { FAQSection } from "@/components/home/FAQSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { AppSection } from "@/components/home/AppSection";
import { FooterLinks } from "@/components/home/FooterLinks";

import { CategoryModal, type CategoryModalData } from "@/components/modals/CategoryModal";
import { ServiceDetailModal, type ServiceModalData } from "@/components/modals/ServiceDetailModal";
import { CityExpansionModal, type CityModalData } from "@/components/modals/CityExpansionModal";
import { OwnerOnboardingModal } from "@/components/modals/OwnerOnboardingModal";

import { UrbanAISearch } from "@/components/home/UrbanAISearch";

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
  const [activeService, setActiveService] = useState<ServiceModalData | null>(null);
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

      {/* 5. Product Roadmap (Interactive Coming Soon Cards) */}
      <ComingSoonBadges
        onSelectUpcoming={(item) =>
          setActiveCategory({ id: item.title.toLowerCase(), title: item.title, isLive: false })
        }
      />

      {/* 6. Popular Cities & Expansion Hubs (Interactive City Roadmap Modal) */}
      <PopularCities onSelectCity={(city) => setActiveCity(city)} />

      {/* 7. Why Urban Properties (Benefits) */}
      <div id="why-us">
        <WhyUrbanProperties />
      </div>

      {/* 8. Dual-tab How It Works Workflow */}
      <HowItWorks />

      {/* 9. Services Ecosystem (Interactive Service Detail & Booking Modal) */}
      <div id="services">
        <Services onSelectService={(s) => setActiveService(s)} />
      </div>

      {/* 10. Interactive India Map & Expansion */}
      <IndiaMapSection />

      {/* 11. Nearby Landmarks Explorer */}
      <NearbyPlaces />

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

      {/* 17. Startup Footer */}
      <FooterLinks />

      {/* ======================================= */}
      {/* INTERACTIVE MODALS & DRAWERS            */}
      {/* ======================================= */}
      <CategoryModal data={activeCategory} onClose={() => setActiveCategory(null)} />
      <ServiceDetailModal data={activeService} onClose={() => setActiveService(null)} />
      <CityExpansionModal data={activeCity} onClose={() => setActiveCity(null)} />
      <OwnerOnboardingModal isOpen={showOwnerWizard} onClose={() => setShowOwnerWizard(false)} />
    </div>
  );
}
