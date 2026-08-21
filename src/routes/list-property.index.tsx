import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  Home,
  CheckCircle2,
  Eye,
  Calculator,
  UploadCloud,
  Megaphone,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { StartNowForm } from "@/shared/components/listing/StartNowForm";

export const Route = createFileRoute("/list-property/")({
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

function ListPropertyLandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: `How to post a property on ${APP_NAME}?`,
      a: "You can simply select your property category, enter your contact or continue with Google, and follow our 6-step listing wizard to add your details, pricing, and photos.",
    },
    {
      q: "Can I post a property for free?",
      a: "Yes, posting a property as an owner is completely free. Zero listing fees, zero broker commission.",
    },
    {
      q: "What type of property can I post for selling/renting?",
      a: "You can post residential properties (apartments, villas, independent houses) and commercial properties (offices, shops, co-working spaces).",
    },
    {
      q: "What are the benefits of posting a property with us?",
      a: "You get access to verified buyers and tenants, maximum visibility across top Indian metros, and direct WhatsApp contact.",
    },
    {
      q: "When do I start getting enquiries on my property?",
      a: "Most listings start receiving direct tenant enquiries within hours of verification by our moderation team.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Center-Aligned Premium Focus */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F766E]/20 via-[#0F766E]/5 to-background pt-24 pb-16 md:pt-32 md:pb-24 border-b border-border/40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-20 w-[600px] h-[600px] bg-[#14B8A6]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-4 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Location-First
              Direct Listing • 100% Free Owner Ad
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground font-[family-name:var(--font-display)] leading-tight max-w-3xl mx-auto">
              Sell or rent your home faster with{" "}
              <span className="text-[#0F766E] dark:text-[#14B8A6]">{APP_NAME}</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Direct owner contact with verified tenants &amp; buyers across India. Zero commission,
              zero listing fees, and instant WhatsApp inquiries.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-xs font-bold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Post as an Owner Free
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-xs font-bold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Verified Buyers &amp; Tenants
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-xs font-bold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Direct WhatsApp Inquiry
              </span>
            </div>
          </div>

          {/* Prominent Centered Form Card */}
          <div className="max-w-xl mx-auto pt-2">
            <StartNowForm className="shadow-2xl border border-emerald-500/30 backdrop-blur-md" />
          </div>
        </div>
      </div>

      {/* Feature Highlights Section */}
      <div className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-[family-name:var(--font-display)]">
              Why should you list with us?
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              We connect owners directly with high-intent tenants and buyers without middleman fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4 font-bold text-xl">
                ⚡
              </div>
              <h3 className="text-base font-bold text-foreground">Zero Brokerage Fees</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                100% free listings for all property owners. Keep all your rental earnings and sale
                value.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4 font-bold text-xl">
                💬
              </div>
              <h3 className="text-base font-bold text-foreground">Instant WhatsApp Leads</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Receive direct WhatsApp inquiries from verified tenants and buyers without waiting
                for callbacks.
              </p>
            </div>

            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4 font-bold text-xl">
                🛡️
              </div>
              <h3 className="text-base font-bold text-foreground">Verified Tenant Profiles</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                All inquiries are screened and verified to ensure high-intent genuine tenants and
                buyers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="py-16 bg-background border-t border-border/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8 font-[family-name:var(--font-display)]">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-card overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-4 text-left font-bold text-sm text-foreground flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${activeFaq === idx ? "rotate-180" : ""}`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
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
