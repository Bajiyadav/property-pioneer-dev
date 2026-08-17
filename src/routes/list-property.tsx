import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { Button } from "@/shared/components/ui/button";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { OwnerPlans } from "@/modules/billing/components/OwnerPlans";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

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
  const [propertyType, setPropertyType] = useState<"Residential" | "Commercial">("Residential");
  const [intent, setIntent] = useState<"Rent" | "Sell" | "PG/Co-living">("Rent");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  /**
   * Starts the listing flow.
   *
   * Two things here were wrong before and are worth stating, because both were
   * invisible from the outside:
   *
   * 1. The number was passed as a search param, so it appeared in the URL. A
   *    mobile number is personal data, and a URL is the leakiest place to put
   *    it — it persists in browser history, in server and CDN logs, and is sent
   *    to third parties in the `Referer` header. It also arrived JSON-quoted
   *    (`phone=%229876543210%22`), so the value carried literal quote
   *    characters. It now travels in sessionStorage: same tab only, gone when
   *    the tab closes, never in a URL.
   *
   * 2. The wizard declared `phone` in its props and never read it, so whatever
   *    the owner typed here was discarded. Combined with the wizard never
   *    collecting a number of its own, no listing ever stored `owner_phone` —
   *    which is why every "Get Owner Details" enquiry fell back to a hard-coded
   *    number belonging to nobody. Prefilling the wizard from here is what
   *    closes that chain.
   *
   * Validation is explicit rather than left to the input's `required`
   * attribute. Native validation only checks non-empty, so "1" or "abc" used to
   * pass straight through, and its bubble is easy to miss on a phone.
   */
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
      // Private browsing can refuse storage. The wizard asks for the number
      // again in that case, which is better than blocking the flow here.
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
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-primary/5 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground font-[family-name:var(--font-display)] mb-6">
              Sell or rent your property faster with{" "}
              <span className="text-primary">{APP_NAME}</span>
            </h1>
            <ul className="space-y-4 text-lg text-muted-foreground mb-8">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500 h-6 w-6" /> Post property for free
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500 h-6 w-6" /> Get verified buyers
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500 h-6 w-6" /> Get personalised assistance on
                selling faster
              </li>
            </ul>
          </div>

          <div className="w-full max-w-md mx-auto">
            <Card className="shadow-2xl border-border/50 bg-card/80 backdrop-blur-xl">
              {/*
                The "Broker/Builder" tab next to this one was removed. It had no
                onClick, so it did nothing when pressed — but the deeper problem
                is that it should not exist: this platform's entire proposition
                is direct owner listings with no broker in the middle, and every
                page says so. Offering brokers a signup tab contradicted the
                product and misled anyone who pressed it.
              */}
              <div className="flex border-b border-border/50">
                <div className="flex-1 py-4 text-center font-bold text-primary border-b-2 border-primary bg-primary/5">
                  Listing as an owner
                </div>
              </div>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-foreground mb-3 block">
                      Property Type
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setPropertyType("Residential")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border ${propertyType === "Residential" ? "bg-primary/10 border-primary text-primary font-bold" : "bg-background border-border text-muted-foreground hover:border-border/80"}`}
                      >
                        <Home className="h-4 w-4" /> Residential
                      </button>
                      <button
                        type="button"
                        onClick={() => setPropertyType("Commercial")}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border ${propertyType === "Commercial" ? "bg-primary/10 border-primary text-primary font-bold" : "bg-background border-border text-muted-foreground hover:border-border/80"}`}
                      >
                        <Building2 className="h-4 w-4" /> Commercial
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-foreground mb-3 block">
                      You're looking to...
                    </label>
                    <div className="flex gap-2">
                      {["Rent", "Sell", "PG/Co-living"].map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setIntent(i as "Rent" | "Sell" | "PG/Co-living")}
                          className={`flex-1 py-2 rounded-full border text-xs sm:text-sm transition-all ${intent === i ? "bg-primary border-primary text-primary-foreground font-bold shadow-md" : "bg-background border-border text-foreground hover:bg-secondary"}`}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="listing-phone"
                      className="text-sm font-bold text-foreground mb-3 block"
                    >
                      Phone Number (including country code)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="listing-phone"
                        type="tel"
                        maxLength={18}
                        placeholder="e.g. +91 98765 43210 or +1 555 123 4567"
                        className="h-12 rounded-xl text-lg"
                        value={phone}
                        onChange={(e) => {
                          // Allow digits, spaces, and leading plus
                          setPhone(e.target.value.replace(/[^0-9+\s-]/g, "").slice(0, 18));
                          if (phoneError) setPhoneError(null);
                        }}
                        aria-invalid={phoneError ? true : undefined}
                        aria-describedby={phoneError ? "listing-phone-error" : undefined}
                      />
                    </div>
                    {phoneError ? (
                      // Announced, not just coloured: a message only conveyed by
                      // styling is invisible to a screen reader.
                      <p
                        id="listing-phone-error"
                        role="alert"
                        className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400"
                      >
                        {phoneError}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Buyers and tenants contact you on this number. Include your country code
                        starting with +.
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all uppercase tracking-wider"
                  >
                    START NOW
                  </Button>
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

      {/*
        Optional paid assistance, placed after the free-listing benefits and before
        the FAQ. Order matters here: an owner should have read that listing is free
        before they meet a price list, or the page reads as a bait and switch.
      */}
      <OwnerPlans />

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
