import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Building2,
  Home,
  Phone,
  CheckCircle2,
  Eye,
  Calculator,
  UploadCloud,
  Megaphone,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { useAuth } from "@/modules/authentication/context/AuthContext";
import { GoogleSignInButton } from "@/shared/components/auth/GoogleSignInButton";
import { UserCheck, LogIn } from "lucide-react";

export const Route = createFileRoute("/list-property")({
  /*
   * This page had no metadata at all, so it inherited the root's generic title
   * and description. It is the platform's main acquisition page — an owner
   * searching "post property for rent Hyderabad free" should land here — and
   * without a title of its own it could not compete for that query.
   *
   * The description states the two things that are actually true and
   * differentiating: listing is free, and there is no commission. Neither is a
   * claim we cannot back.
   */
  head: () => {
    const canonicalUrl = getCanonicalUrl("/list-property");
    const title = `Post Your Property Free — ${APP_NAME}`;
    const description =
      "List your flat, house or commercial space in Hyderabad for free. No listing fee and no platform commission — tenants and buyers contact you directly on WhatsApp.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: getOgImageUrl() },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: ListPropertyLandingPage,
});

/**
 * Where the owner's number is handed to the wizard. sessionStorage rather than a
 * search param, so personal data never enters a URL, browser history or a log.
 * Exported so the wizard reads the same key instead of duplicating the string.
 */
export const LISTING_PHONE_KEY = "sp_listing_phone";

function ListPropertyLandingPage() {
  const navigate = useNavigate();
  const { status, user } = useAuth();
  const [propertyType, setPropertyType] = useState<"Residential" | "Commercial">("Residential");
  const [intent, setIntent] = useState<"Rent" | "Sell" | "PG/Co-living">("Rent");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!phone) {
      const existingPhone = user?.phone || (user?.user_metadata?.phone as string | undefined);
      if (existingPhone) {
        setPhone(existingPhone);
      }
    }
  }, [user, phone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const digits = phone.replace(/[^0-9+]/g, "");
    const pureDigits = digits.replace(/\D/g, "");
    if (pureDigits.length < 7 || pureDigits.length > 15) {
      setPhoneError(
        pureDigits.length === 0
          ? "Enter your mobile number so buyers and tenants can reach you."
          : "Please enter a valid phone number (7 to 15 digits).",
      );
      return;
    }

    setPhoneError(null);
    try {
      sessionStorage.setItem(LISTING_PHONE_KEY, digits);
    } catch {
      // Private browsing fallback
    }
    navigate({ to: "/list-property/wizard", search: { propertyType, intent } });
  };

  const faqs = [
    {
      q: `How to post a property on ${APP_NAME}?`,
      a: "You can simply select your property type above, enter your phone number, and follow our 6-step listing wizard to add your details, pricing, and photos.",
    },
    {
      q: "Can I post a property for free?",
      a: "Yes, posting a property as an owner is completely free. We also offer premium packages for higher visibility.",
    },
    {
      q: "What type of property can I post for selling/renting?",
      a: "You can post residential properties (apartments, villas, independent houses) and commercial properties (offices, shops, co-working spaces).",
    },
    {
      q: "What are the benefits of posting a property with us?",
      a: "You get access to thousands of verified buyers and tenants, maximum visibility across the platform, and tools like our price calculator to help you get the best deal.",
    },
    {
      q: "When do I start getting enquiries on my property?",
      a: "Most listings start receiving enquiries within 2-4 hours of approval by our moderation team.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Luxury Teal Gradient & Mesh Glow */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F766E]/15 via-[#0F766E]/5 to-background pt-24 pb-16 md:pt-32 md:pb-24 border-b border-border/40">
        <div className="absolute top-0 right-1/4 -mt-20 w-96 h-96 bg-[#14B8A6]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 -ml-20 w-80 h-80 bg-[#0F766E]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 max-w-6xl grid md:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          <div className="md:col-span-7 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> 100% Free Owner
              Listing • 0% Brokerage
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground font-[family-name:var(--font-display)] leading-tight">
              Sell or rent your home faster with{" "}
              <span className="text-[#0F766E] dark:text-[#14B8A6]">{APP_NAME}</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto md:mx-0 leading-relaxed">
              Direct owner contact with verified tenants & buyers across India. Zero commission,
              zero listing fees, and instant WhatsApp inquiries.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-sm text-foreground/90 font-semibold max-w-lg mx-auto md:mx-0">
              <li className="flex items-center gap-2 bg-card/60 p-2.5 rounded-xl border border-border/60">
                <CheckCircle2 className="text-emerald-500 h-5 w-5 shrink-0" /> Post Free
              </li>
              <li className="flex items-center gap-2 bg-card/60 p-2.5 rounded-xl border border-border/60">
                <CheckCircle2 className="text-emerald-500 h-5 w-5 shrink-0" /> Verified Leads
              </li>
              <li className="flex items-center gap-2 bg-card/60 p-2.5 rounded-xl border border-border/60">
                <CheckCircle2 className="text-emerald-500 h-5 w-5 shrink-0" /> Direct WhatsApp
              </li>
            </ul>
          </div>

          <div className="md:col-span-5 w-full max-w-md mx-auto">
            <Card className="shadow-2xl border border-border/80 bg-card/95 backdrop-blur-xl rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#0F766E] to-[#115E59] p-4 text-center text-white">
                <p className="text-xs uppercase tracking-widest font-bold text-emerald-200">
                  Start Your Listing
                </p>
                <h3 className="text-lg font-extrabold text-white mt-0.5">Post as an Owner Free</h3>
              </div>

              <CardContent className="p-5 sm:p-7">
                {/* Account Status Notification */}
                {status === "authenticated" ? (
                  <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <UserCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div className="truncate">
                      Signed in as <span className="font-bold">{user?.email}</span> (Listing will be
                      saved directly to your owner account).
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 rounded-xl bg-secondary/50 border border-border/70 p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">Have an account?</span>
                      <span className="text-[10px] uppercase font-bold text-primary">
                        Fast Track
                      </span>
                    </div>
                    <GoogleSignInButton
                      redirect="/list-property/wizard"
                      label="Continue with Google (1-Click)"
                      className="h-10 text-xs shadow-xs"
                    />
                    <p className="text-[10px] text-muted-foreground text-center">
                      Or fill your number below to continue directly as guest.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" action="#" method="POST">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 block">
                      Property Category
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPropertyType("Residential")}
                        className={`flex min-h-[48px] items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                          propertyType === "Residential"
                            ? "bg-[#0F766E]/10 border-[#0F766E] text-[#0F766E] dark:text-[#14B8A6] shadow-xs"
                            : "bg-background border-border text-muted-foreground hover:border-border/80"
                        }`}
                      >
                        <Home className="h-4 w-4" /> Residential
                      </button>
                      <button
                        type="button"
                        onClick={() => setPropertyType("Commercial")}
                        className={`flex min-h-[48px] items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                          propertyType === "Commercial"
                            ? "bg-[#0F766E]/10 border-[#0F766E] text-[#0F766E] dark:text-[#14B8A6] shadow-xs"
                            : "bg-background border-border text-muted-foreground hover:border-border/80"
                        }`}
                      >
                        <Building2 className="h-4 w-4" /> Commercial
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 block">
                      I want to...
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Rent", "Sell", "PG/Co-living"].map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setIntent(i as "Rent" | "Sell" | "PG/Co-living")}
                          className={`min-h-[44px] rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            intent === i
                              ? "bg-[#0F766E] border-[#0F766E] text-white shadow-md"
                              : "bg-background border-border text-foreground hover:bg-secondary"
                          }`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="listing-phone"
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block"
                    >
                      Your Mobile Number
                    </label>
                    <Input
                      id="listing-phone"
                      name="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      required
                      maxLength={18}
                      placeholder="+91 98765 43210"
                      className="h-12 min-h-[48px] rounded-xl text-base font-semibold px-4 cursor-text"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/[^0-9+\s-]/g, "").slice(0, 18));
                        if (phoneError) setPhoneError(null);
                      }}
                      aria-invalid={phoneError ? true : undefined}
                      aria-describedby={phoneError ? "listing-phone-error" : undefined}
                    />
                    {phoneError ? (
                      <p
                        id="listing-phone-error"
                        role="alert"
                        className="mt-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400"
                      >
                        {phoneError}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Tenants & buyers connect directly with you on WhatsApp.
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      id="start-now-submit-button"
                      aria-label="Start property listing now"
                      className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0F766E] via-[#115E59] to-[#0D9488] px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-teal-950/20 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <span>START NOW — FREE</span>
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/*
        The testimonials section that stood here was removed. It presented two
        invented people — "Anil Kumar" and "Utkarsh Pratap Singh" — as verified
        owners, complete with a green tick, under the heading "Loved by thousands
        of property owners".

        Every part of it was false. The names and quotes were written as filler.
        The cities, Delhi and Pune, are not places this platform operates in; it
        serves Hyderabad. The tick implied a verification that never happened. One
        quote credited a "relationship manager" assigned "immediately", which is
        not a service that exists here; the other credited a "premium package"
        outcome.

        Fabricated reviews are not placeholder copy — they are a representation to
        consumers. India's Consumer Protection Act and the CCPA guidance on fake
        reviews treat invented testimonials as an unfair trade practice, and the
        "verified" tick makes that worse rather than better.

        Restore this section only with quotes real owners have actually given and
        agreed to publish, and only claim a verification the platform performs.
      */}

      {/* Benefits */}
      <div className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold font-[family-name:var(--font-display)] mb-4">
              Why should you list with us?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join India's fastest growing property network to find the right buyers and tenants for
              your home.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Eye className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">17 Lacs+ seekers</h3>
              <p className="text-muted-foreground">
                We bring serious buyers & tenants directly to you.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Megaphone className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Maximum visibility</h3>
              <p className="text-muted-foreground">
                Showcase your property to thousands of seekers every single day.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                <Calculator className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Price calculator</h3>
              <p className="text-muted-foreground">
                Get estimated market price of your property, making it easy to sell or rent.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold font-[family-name:var(--font-display)] mb-4">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground">Upload your property in 3 quick steps.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-border -z-10"></div>

            <div className="relative text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center text-xl font-bold shadow-lg">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Upload your property</h3>
                <p className="text-sm text-muted-foreground">
                  Tell us basic details about your property, add pricing & upload photos.
                </p>
              </div>
            </div>

            <div className="relative text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center text-xl font-bold shadow-lg">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Property reaches seekers</h3>
                <p className="text-sm text-muted-foreground">
                  Your property will reach maximum buyers/tenants online through our network.
                </p>
              </div>
            </div>

            <div className="relative text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center text-xl font-bold shadow-lg">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Start getting enquiries</h3>
                <p className="text-sm text-muted-foreground">
                  You will start getting enquiries from interested buyers as soon as it goes live.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-extrabold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-border rounded-xl bg-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-lg hover:bg-secondary/50 transition-colors"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                >
                  {faq.q}
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform ${activeFaq === idx ? "rotate-180" : ""}`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="p-5 pt-0 text-muted-foreground leading-relaxed border-t border-border">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
