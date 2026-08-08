import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "sonner";
import { Heart } from "lucide-react";
import { BrandMark } from "@/shared/components/BrandMark";
import { BRAND } from "@/config/platform";
import {
  APP_NAME,
  APP_DESCRIPTION,
  APP_COPYRIGHT,
  getCanonicalUrl,
  getOgImageUrl,
  APP_URL,
} from "@/config/app";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { HeaderProfileMenu } from "@/app/layouts/HeaderProfileMenu";
import { DemoModeSwitcher } from "@/app/layouts/DemoModeSwitcher";
import { CustomErrorBoundary } from "@/shared/components/feedback/CustomErrorBoundary";
import { ExpansionWaitlistModal } from "@/shared/components/dialogs/ExpansionWaitlistModal";
import { HomeServicesModal } from "@/shared/components/dialogs/HomeServicesModal";

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
    const canonicalUrl = getCanonicalUrl("/");
    const ogImage = getOgImageUrl();
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: `${APP_NAME} — India's Premier Real Estate Platform` },
        { name: "description", content: APP_DESCRIPTION },
        { property: "og:title", content: `${APP_NAME} — India's Premier Real Estate Platform` },
        { property: "og:description", content: APP_DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: APP_NAME },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${APP_NAME} — India's Premier Real Estate Platform` },
        { name: "twitter:description", content: APP_DESCRIPTION },
        { name: "twitter:image", content: ogImage },
      ],
      links: [
        { rel: "canonical", href: canonicalUrl },
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap",
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
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: APP_NAME,
    url: APP_URL,
    logo: `${APP_URL}/favicon.ico`,
    description: APP_DESCRIPTION,
    areaServed: "India",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
    sameAs: [
      "https://www.instagram.com/urbanproperties.in",
      "https://www.linkedin.com/company/urbanproperties",
    ],
  };

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
        <DemoModeSwitcher />
      </div>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}

function SiteHeader() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [waitlistCategory, setWaitlistCategory] = useState<string | null>(null);
  const [servicesOpen, setServicesOpen] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSignedIn(Boolean(data.session));
        setUser(data.session?.user ?? null);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      setUser(session?.user ?? null);
    });

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      active = false;
      data.subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md transition-all duration-300 ${scrolled ? "py-2 shadow-md bg-background/95" : "py-3.5"}`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label={`${BRAND.name} home`} className="flex items-center">
            <BrandMark responsiveName />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
            <Link
              to="/"
              className="rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-secondary hover:text-foreground"
            >
              Home
            </Link>
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
              className="rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-secondary hover:text-foreground"
            >
              Rent
            </Link>

            <Link
              to="/buy"
              className="relative inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-secondary hover:text-foreground"
            >
              Buy
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">
                New
              </span>
            </Link>

            <Link
              to="/commercial"
              className="relative inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-secondary hover:text-foreground"
            >
              Commercial
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">
                New
              </span>
            </Link>

            <Link
              to="/home-services"
              className="relative inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-secondary hover:text-foreground"
            >
              Services
              <span className="rounded-full bg-emerald-600/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                Live
              </span>
            </Link>

            <a
              href="#why-us"
              className="rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-secondary hover:text-foreground"
            >
              About
            </a>
            <a
              href="#contact"
              className="rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-secondary hover:text-foreground"
            >
              Contact
            </a>
          </nav>

          {/* User Actions & CTAs */}
          <div className="flex items-center gap-2">
            <Link
              to="/favorites"
              aria-label="Saved Properties"
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition"
            >
              <Heart className="h-4 w-4" />
            </Link>

            <HeaderProfileMenu user={user} />

            <Link
              to="/auth"
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-emerald-500"
            >
              List Property FREE
            </Link>
          </div>
        </div>
      </header>

      {/* Interactive Expansion & Services Modals */}
      <ExpansionWaitlistModal
        isOpen={Boolean(waitlistCategory)}
        onClose={() => setWaitlistCategory(null)}
        categoryName={waitlistCategory || ""}
      />

      <HomeServicesModal
        isOpen={servicesOpen}
        onClose={() => setServicesOpen(false)}
        initialService="agreement"
      />
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-2">
            <BrandMark size="sm" />
            <p className="mt-3 max-w-xs text-xs text-muted-foreground leading-relaxed">
              {BRAND.tagline} — India's 0% brokerage real estate platform.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://instagram.com/urbanproperties.in"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary transition"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/urbanproperties"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary transition"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
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
                <Link to="/buy" className="hover:text-foreground transition">
                  Buy Homes
                </Link>
              </li>
              <li>
                <Link to="/commercial" className="hover:text-foreground transition">
                  Commercial Spaces
                </Link>
              </li>
              <li>
                <Link to="/villas" className="hover:text-foreground transition">
                  Luxury Villas
                </Link>
              </li>
              <li>
                <Link to="/plots" className="hover:text-foreground transition">
                  Plots &amp; Land
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
                <Link to="/home-services" className="hover:text-foreground transition">
                  Home Services
                </Link>
              </li>
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
                <Link to="/profile" className="hover:text-foreground transition">
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-foreground transition">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-foreground transition">
                  List Property FREE
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-foreground mb-3">
              Legal
            </h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a href="/privacy-policy" className="hover:text-foreground transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms-of-service" className="hover:text-foreground transition">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/cookie-policy" className="hover:text-foreground transition">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="/refund-policy" className="hover:text-foreground transition">
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">{APP_COPYRIGHT}</p>
          <p className="text-xs text-muted-foreground">
            Made with ❤️ in Hyderabad, India · RERA Compliant
          </p>
        </div>
      </div>
    </footer>
  );
}
