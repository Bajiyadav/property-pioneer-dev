import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
import { HowItWorks } from "@/modules/marketing/home/HowItWorks";
import { OwnerCTA } from "@/modules/marketing/home/OwnerCTA";
import { FAQSection } from "@/modules/marketing/home/FAQSection";
import { FeedbackSection } from "@/modules/feedback/components/FeedbackSection";
import { ValueAddedServices } from "@/modules/marketing/home/ValueAddedServices";
import { CityExpansionModal, type CityModalData } from "@/components/dialogs/CityExpansionModal";
import { BrandMark } from "@/components/branding/BrandMark";
import { ServerCrash, RefreshCw, Home, ArrowRight, Terminal } from "lucide-react";

import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => {
    return {
      meta: [
        { title: "505 HTTP Version Not Supported" },
        {
          name: "description",
          content:
            "505 HTTP Version Not Supported — The server does not support the HTTP protocol version used in the request.",
        },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  component: Index,
});

function Http505View() {
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    setTimestamp(new Date().toISOString());
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-12 text-center overflow-y-auto">
      <div className="w-full max-w-xl space-y-6">
        <BrandMark responsiveName className="justify-center" />

        <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-rose-500/10 text-rose-500 ring-8 ring-rose-500/5 shadow-inner">
          <ServerCrash className="h-12 w-12" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-4 py-1 text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            HTTP 505 · Protocol Error
          </span>
          <h1 className="mt-4 text-7xl font-black tracking-tight text-foreground sm:text-9xl">
            505
          </h1>
          <h2 className="mt-2 text-xl font-bold text-foreground sm:text-3xl">
            HTTP Version Not Supported
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            The server does not support, or refuses to support, the HTTP protocol version that was
            used in the request message.
          </p>
        </div>

        {/* Diagnostics & Technical Details */}
        <div className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 text-left font-mono text-xs space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-rose-500" /> Protocol Diagnostics
            </span>
            <span className="text-[10px] text-muted-foreground">
              {timestamp || "2026-11-01T00:00:00.000Z"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-muted-foreground">Status: </span>
              <span className="font-semibold text-rose-500">505 HTTP Version Not Supported</span>
            </div>
            <div>
              <span className="text-muted-foreground">Reference: </span>
              <span className="font-semibold text-foreground">ERR-505-PROT-VER</span>
            </div>
            <div>
              <span className="text-muted-foreground">Supported Protocols: </span>
              <span className="font-semibold text-foreground">HTTP/1.1, HTTP/2</span>
            </div>
            <div>
              <span className="text-muted-foreground">Gateway: </span>
              <span className="font-semibold text-foreground">Seedha Edge Gateway v2</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition hover:brightness-110 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" /> Retry Connection
          </button>

          <a
            href="/properties"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/80 px-4 py-2.5 text-xs font-bold text-foreground transition hover:bg-secondary active:scale-95"
          >
            Browse Properties <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <p className="pt-4 text-xs text-muted-foreground/80">
          © 2026 Seedha Properties. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}

function Index() {
  return <Http505View />;
}

// Preserved full normal homepage component ready to be re-enabled whenever needed

function NormalHomePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Restore saved location in useEffect to ensure 100% hydration match between SSR and Client
  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem("seedha_selected_state");
      const savedCity = sessionStorage.getItem("seedha_selected_city");
      if (savedState) setSelectedState(savedState);
      if (savedCity) setSelectedCity(savedCity);
    } catch {
      // Storage unavailable in restricted iframe/private mode
    }
  }, []);

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    if (typeof window !== "undefined") {
      try {
        if (state) {
          sessionStorage.setItem("seedha_selected_state", state);
        } else {
          sessionStorage.removeItem("seedha_selected_state");
          sessionStorage.removeItem("seedha_selected_city");
        }
      } catch {
        // Storage unavailable in restricted iframe/private mode
      }
    }
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    if (typeof window !== "undefined") {
      try {
        if (city) {
          sessionStorage.setItem("seedha_selected_city", city);
        } else {
          sessionStorage.removeItem("seedha_selected_city");
        }
      } catch {
        // Storage unavailable in restricted iframe/private mode
      }
    }
  };

  // Interactive Modal States
  const [activeCity, setActiveCity] = useState<CityModalData | null>(null);

  const isLocationConfirmed = Boolean(selectedState && selectedCity);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties", selectedCity],
    queryFn: () => fetchProperties({ city: selectedCity || undefined }),
    staleTime: 5 * 60 * 1000,
    enabled: isLocationConfirmed,
  });

  const featured = properties.filter((p) => p.is_featured);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLocationConfirmed) {
      toast.info("Please select your location to continue.");
      return;
    }
    navigate({
      to: "/properties",
      search: {
        q,
        state: selectedState,
        city: selectedCity,
        listing: "rent",
        minPrice: 0,
        maxPrice: 0,
        beds: 0,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. Hero Section */}
      <HeroSection
        query={q}
        onQueryChange={setQ}
        selectedState={selectedState}
        setSelectedState={handleStateChange}
        selectedCity={selectedCity}
        setSelectedCity={handleCityChange}
        onSearch={handleSearchSubmit}
      />

      {isLocationConfirmed && (
        <>
          {/* 2. Real Estate Quote Banner */}
          <QuoteBanner />

          {/* 4. Featured Rentals */}
          <FeaturedProperties
            properties={featured.length > 0 ? featured : properties}
            isLoading={isLoading}
          />

          {/* 6. Payments & Rent Rewards Banner */}
          <PaymentsAndRewardsBanner />

          {/* 6. Live market + expansion roadmap (Interactive City Modal) */}
          <PopularCities onSelectCity={(city) => setActiveCity(city)} />

          {/* 7. Dual-tab How It Works Workflow */}
          <HowItWorks />

          {/* 8. Owner CTA Banner (Triggers Multi-Step Wizard) */}
          <OwnerCTA onOpenWizard={() => navigate({ to: "/list-property" })} />

          {/* 9. Value Added Services (Property Management, Home Loans, Rental Agreements) */}
          <ValueAddedServices />

          {/* 10. We Value Your Feedback Section (Studio Shodwe + Radiant Thank You) */}
          <FeedbackSection />

          {/* 11. Support FAQ Accordion */}
          <div id="contact">
            <FAQSection />
          </div>
        </>
      )}

      {!isLocationConfirmed && (
        /* Value Added Services for unselected location */
        <ValueAddedServices />
      )}

      {/* ======================================= */}
      {/* INTERACTIVE MODALS                      */}
      {/* ======================================= */}
      <CityExpansionModal data={activeCity} onClose={() => setActiveCity(null)} />
    </div>
  );
}
