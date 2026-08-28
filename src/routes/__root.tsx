import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { RazorpayCheckoutHandler } from "@/components/RazorpayCheckoutHandler";
import { Heart } from "lucide-react";
import { BrandMark } from "@/components/branding/BrandMark";
import { BRAND } from "@/config/platform";
import {
  APP_NAME,
  APP_DESCRIPTION,
  APP_COPYRIGHT,
  getCanonicalUrl,
  getOgImageUrl,
  APP_URL,
} from "@/config/app";
import { HeaderProfileMenu } from "@/app/layouts/HeaderProfileMenu";
import { CustomErrorBoundary } from "@/components/feedback/CustomErrorBoundary";
import { ExpansionWaitlistModal } from "@/components/dialogs/ExpansionWaitlistModal";
import { AuthProvider } from "@/modules/authentication/context/AuthContext";
import { ConsentBanner } from "@/modules/legal/components/ConsentBanner";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import i18n from "@/lib/i18n/index";
import { I18nextProvider } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/** Bump when the files in public/ that hold the brand icon change. */
const ICON_VERSION = "4";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <BrandMark size="md" className="justify-center" />
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

// CustomErrorBoundary handles all root-level React error boundaries gracefully.

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => {
    const ogImage = "https://seedhaproperties.com/logo.png";
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#0F766E" },
        { title: `${APP_NAME} — Verified Direct-Owner Real Estate Marketplace Across India` },
        { name: "description", content: APP_DESCRIPTION },
        {
          property: "og:title",
          content: `${APP_NAME} — Verified Direct-Owner Real Estate Across India`,
        },
        { property: "og:description", content: APP_DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: APP_NAME },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: `${APP_NAME} — Verified Direct-Owner Real Estate Across India`,
        },
        { name: "twitter:description", content: APP_DESCRIPTION },
        { name: "twitter:image", content: ogImage },
      ],
      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "icon", href: `/favicon.ico?v=${ICON_VERSION}` },
        {
          rel: "icon",
          href: `/favicon-32.png?v=${ICON_VERSION}`,
          type: "image/png",
          sizes: "32x32",
        },
        {
          rel: "icon",
          href: `/favicon-16.png?v=${ICON_VERSION}`,
          type: "image/png",
          sizes: "16x16",
        },
        {
          rel: "icon",
          href: `/favicon.png?v=${ICON_VERSION}`,
          type: "image/png",
        },
        {
          rel: "apple-touch-icon",
          href: `/apple-touch-icon.png?v=${ICON_VERSION}`,
          sizes: "180x180",
        },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap",
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Seedha Properties",
            url: "https://seedhaproperties.com",
            logo: "https://seedhaproperties.com/logo.png",
            sameAs: ["https://www.linkedin.com/in/srinivasa-rao-9520943a3/"],
            description: "Direct-owner real estate marketplace across India with 0% brokerage.",
          }),
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: CustomErrorBoundary,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        <RazorpayCheckoutHandler />
      </body>
    </html>
  );
}

import { SeedhaAIAssistant } from "@/modules/interactions/components/ai/SeedhaAIAssistant";
import { MobileBottomNav } from "@/app/layouts/MobileBottomNav";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  // Track visitor for admin dashboard
  useVisitorTracking();

  const isWizardRoute = router.state.location.pathname.startsWith("/list-property/wizard");

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OfflineBanner />
          <div className="flex min-h-screen flex-col pb-16 md:pb-0">
            {!isWizardRoute && <SiteHeader />}
            <main className="flex-1">
              <Outlet />
            </main>
            {!isWizardRoute && <SiteFooter />}
            {!isWizardRoute && <MobileBottomNav />}
          </div>
          <SeedhaAIAssistant />
          <Toaster position="top-center" richColors />
          <ConsentBanner />
        </AuthProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [waitlistCategory, setWaitlistCategory] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass-nav border-b border-border/80 py-2 sm:py-2.5 shadow-[var(--shadow-card)]"
            : "border-b border-border/40 bg-background/90 backdrop-blur-md py-2.5 sm:py-3.5"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-1 sm:gap-4 px-2 sm:px-6">
          <Link
            to="/"
            aria-label={`${BRAND.name} home`}
            className="flex shrink-0 items-center group min-w-0"
          >
            <BrandMark responsiveName />
          </Link>

          {/*
            User Actions & CTAs
          */}
          <div className="flex min-w-0 shrink items-center gap-0.5 sm:gap-2.5">
            <Link
              to="/favorites"
              aria-label="Saved Properties"
              className="hidden sm:flex p-1.5 sm:p-2.5 rounded-full text-muted-foreground hover:text-primary hover:bg-secondary/80 border border-transparent hover:border-border/60 transition-all active:scale-95"
            >
              <Heart className="h-4 w-4" />
            </Link>

            <HeaderProfileMenu />

            <Link
              to="/list-property"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-extrabold text-white shadow-sm transition-all hover:brightness-105 hover:shadow-md active:scale-95 ring-1 ring-emerald-400/30"
            >
              <span className="whitespace-nowrap">Post Property</span>
              <span className="inline-block rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase text-white backdrop-blur-xs">
                FREE
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Interactive Expansion & Services Modals */}
      <ExpansionWaitlistModal
        isOpen={Boolean(waitlistCategory)}
        categoryName={waitlistCategory || ""}
        onClose={() => setWaitlistCategory(null)}
      />
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/80 bg-gradient-to-b from-secondary/30 via-secondary/60 to-secondary">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-6">
          {/* Brand & Mission */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-2">
            <BrandMark size="sm" />
            <p className="mt-3.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
              <strong>{BRAND.tagline}</strong> — Connect directly with genuine property owners
              across India. No platform commission, no middlemen, and every listing moderated before
              it goes live.
            </p>

            {/* Verified Trust Badges */}
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 bg-card/80 border border-border/60 rounded-full px-3 py-1 shadow-2xs text-foreground">
                🛡️ Direct Owner Contact
              </span>
              <span className="inline-flex items-center gap-1.5 bg-card/80 border border-border/60 rounded-full px-3 py-1 shadow-2xs text-foreground">
                ⚡ No Platform Commission
              </span>
              <span className="inline-flex items-center gap-1.5 bg-card/80 border border-border/60 rounded-full px-3 py-1 shadow-2xs text-foreground">
                ✓ Moderated Listings
              </span>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-foreground mb-3">
              Explore
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link
                  to="/properties"
                  search={{
                    q: "",
                    city: "Hyderabad",
                    listing: "rent",
                    minPrice: 0,
                    maxPrice: 0,
                    beds: 0,
                  }}
                  className="hover:text-foreground transition"
                >
                  Rent in Hyderabad
                </Link>
              </li>
              <li>
                <Link
                  to="/properties"
                  search={{ listing: "sale" }}
                  className="hover:text-foreground transition"
                >
                  Buy Homes
                </Link>
              </li>
              <li>
                <Link
                  to="/properties"
                  search={{ type: "commercial" }}
                  className="hover:text-foreground transition"
                >
                  Commercial Spaces
                </Link>
              </li>
              <li>
                <Link to="/rental-agreement" className="hover:text-foreground transition">
                  Rental Agreement
                </Link>
              </li>
              <li>
                <Link to="/home-loans" className="hover:text-foreground transition">
                  Home Loans &amp; EMI
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-foreground mb-3">
              Platform
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/favorites" className="hover:text-foreground transition">
                  Saved Properties
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-foreground transition">
                  Blog &amp; Insights
                </Link>
              </li>
              <li>
                <Link to="/notifications" className="hover:text-foreground transition">
                  Notifications
                </Link>
              </li>
              <li>
                <Link to="/my-agreements" className="hover:text-foreground transition font-medium">
                  My Agreements
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-foreground transition">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Hubs */}
          <div>
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-foreground mb-3">
              Major Cities
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link
                  to="/properties"
                  search={{
                    q: "",
                    city: "Bengaluru",
                    listing: "rent",
                    minPrice: 0,
                    maxPrice: 0,
                    beds: 0,
                  }}
                  className="hover:text-foreground transition"
                >
                  Bengaluru
                </Link>
              </li>
              <li>
                <Link
                  to="/properties"
                  search={{
                    q: "",
                    city: "Mumbai",
                    listing: "rent",
                    minPrice: 0,
                    maxPrice: 0,
                    beds: 0,
                  }}
                  className="hover:text-foreground transition"
                >
                  Mumbai
                </Link>
              </li>
              <li>
                <Link
                  to="/properties"
                  search={{
                    q: "",
                    city: "Delhi NCR",
                    listing: "rent",
                    minPrice: 0,
                    maxPrice: 0,
                    beds: 0,
                  }}
                  className="hover:text-foreground transition"
                >
                  Delhi NCR
                </Link>
              </li>
              <li>
                <Link
                  to="/properties"
                  search={{
                    q: "",
                    city: "Hyderabad",
                    listing: "rent",
                    minPrice: 0,
                    maxPrice: 0,
                    beds: 0,
                  }}
                  className="hover:text-foreground transition"
                >
                  Hyderabad
                </Link>
              </li>
              <li>
                <Link
                  to="/properties"
                  search={{
                    q: "",
                    city: "Pune",
                    listing: "rent",
                    minPrice: 0,
                    maxPrice: 0,
                    beds: 0,
                  }}
                  className="hover:text-foreground transition"
                >
                  Pune
                </Link>
              </li>
              <li>
                <Link
                  to="/properties"
                  search={{
                    q: "",
                    city: "Chennai",
                    listing: "rent",
                    minPrice: 0,
                    maxPrice: 0,
                    beds: 0,
                  }}
                  className="hover:text-foreground transition"
                >
                  Chennai
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div>
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-foreground mb-3">
              Trust &amp; Legal
            </h3>
            {/*
              These point at the real policy pages. They previously all resolved
              to /help — a "Privacy Policy" link that opens a help article is not
              a privacy policy, and the four policy URLs themselves returned 404
              in production, which is a compliance gap as well as a broken link.
            */}
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/privacy-policy" className="hover:text-foreground transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-foreground transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="hover:text-foreground transition">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-foreground transition">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-foreground transition">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-foreground transition">
                  Moderation Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">{APP_COPYRIGHT}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
            <span>✨ 100% Free for Direct Owners</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
