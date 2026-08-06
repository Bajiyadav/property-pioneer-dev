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
import { Heart, LayoutDashboard, LogIn } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { BRAND } from "@/config/platform";
import { APP_NAME, APP_DESCRIPTION, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { supabase } from "@/integrations/supabase/client";
import { HeaderProfileMenu } from "@/components/navigation/HeaderProfileMenu";
import { DemoModeSwitcher } from "@/components/demo/DemoModeSwitcher";
import { CustomErrorBoundary } from "@/components/errors/CustomErrorBoundary";

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
  const [user, setUser] = useState<any>(null);
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
      <header className={`sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md transition-all duration-300 ${scrolled ? "py-2 shadow-md bg-background/95" : "py-3.5"}`}>
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
              search={{ q: "", city: "Hyderabad", listing: "rent", minPrice: 0, maxPrice: 0, beds: 0 }}
              className="rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-secondary hover:text-foreground"
            >
              Rent
            </Link>

            <Link
              to="/buy"
              className="relative inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-secondary hover:text-foreground"
            >
              Buy
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">New</span>
            </Link>

            <Link
              to="/commercial"
              className="relative inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-secondary hover:text-foreground"
            >
              Commercial
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">New</span>
            </Link>

            <Link
              to="/home-services"
              className="relative inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-secondary hover:text-foreground"
            >
              Services
              <span className="rounded-full bg-emerald-600/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Live</span>
            </Link>

            <a href="#why-us" className="rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-secondary hover:text-foreground">
              About
            </a>
            <a href="#contact" className="rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-secondary hover:text-foreground">
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
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <BrandMark size="sm" />
        <p>{BRAND.tagline}</p>
        <p>© 2022&nbsp;{BRAND.name}</p>
      </div>
    </footer>
  );
}
