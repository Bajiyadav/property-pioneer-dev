import { createFileRoute } from "@tanstack/react-router";
import {
  HelpCircle,
  MessageSquare,
  BookOpen,
  Phone,
  Mail,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/help")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/help");
    const ogImage = getOgImageUrl();
    const title = `Help Center — ${APP_NAME}`;
    const description = `Find answers to your questions about buying, renting, listing properties, and using the ${APP_NAME} platform.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: APP_NAME },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: HelpPage,
});

const FAQS = [
  {
    category: "Getting Started",
    items: [
      {
        q: "How do I list my property on Seedha Properties?",
        a: "Click 'List Property FREE' in the navigation bar, complete a quick registration, and follow the onboarding wizard to add your property details, photos, and pricing. Your listing is then submitted for moderation and becomes publicly visible once an admin approves it.",
      },
      {
        q: "Does Seedha Properties charge brokerage?",
        a: "Seedha Properties adds no commission to a listing, and listing a property is free. We cannot control charges levied by an individual owner or third party, so confirm all costs directly before committing.",
      },
    ],
  },
  {
    category: "Renting",
    items: [
      {
        q: "How do I schedule a property visit?",
        a: "On any property listing page, click 'Schedule Visit'. Choose a date and time, and the property owner will confirm within 2 hours. You'll receive a WhatsApp and email confirmation.",
      },
      {
        q: "Does Seedha Properties provide the rental agreement?",
        a: "No. Seedha Properties connects you with the owner and does not draft, sign, stamp or store rental agreements. Arrange the agreement directly with the owner and seek independent legal advice if you need it.",
      },
    ],
  },
  {
    category: "Buying",
    items: [
      {
        q: "Do you verify RERA registration or title deeds?",
        a: "No. Seedha Properties reviews the listing information an owner submits before publishing it, but we do not verify RERA registration, title deeds, or HMDA/GHMC approvals. Please carry out your own due diligence and seek independent legal advice before any transaction.",
      },
      {
        q: "Can I apply for a home loan through Seedha Properties?",
        a: "No. The EMI calculator on a property page is an indicative estimate only. Seedha Properties is not a lender, has no lending partners, and cannot arrange or approve finance — speak to your bank directly.",
      },
    ],
  },
  {
    category: "Account & Security",
    items: [
      {
        q: "How is my personal data protected?",
        a: "All data is stored on ISO 27001-certified servers. Your phone number and email are never shared with property owners without your consent. We comply with India's Digital Personal Data Protection Act, 2023.",
      },
      {
        q: "How do I reset my password?",
        a: "On the Sign In page, click 'Forgot Password' and enter your email. You'll receive a secure reset link within 60 seconds.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-xs font-bold text-foreground leading-relaxed">{q}</span>
        {open ? (
          <ChevronUp className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
        ) : (
          <ChevronDown className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
        )}
      </button>
      {open && <p className="pb-4 text-xs text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  );
}

function HelpPage() {
  const [search, setSearch] = useState("");

  const filteredFaqs = FAQS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        search.trim() === "" ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-sky-900/20 via-background to-background px-6 py-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-800/10 to-transparent" />
        <div className="relative mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-sky-400">
            <HelpCircle className="h-3 w-3" /> Help Center
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            How can we <span className="text-sky-400">help you?</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Search our knowledge base or browse by category below.
          </p>
          <div className="mt-6 mx-auto max-w-md">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help articles…"
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-sky-500 shadow"
              aria-label="Search help articles"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Quick links */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: MessageSquare,
              label: "Live Chat",
              desc: "Chat with our support team (9 AM – 9 PM)",
              href: "#chat",
              color: "text-emerald-500 bg-emerald-500/10",
            },
            {
              icon: Phone,
              label: "Call Us",
              desc: "+91 98765 43210  ·  Mon–Sat 9–6 PM",
              href: "tel:+919876543210",
              color: "text-blue-500 bg-blue-500/10",
            },
            {
              icon: Mail,
              label: "Email Support",
              desc: "support@seedhaproperties.com",
              href: "mailto:support@seedhaproperties.com",
              color: "text-purple-500 bg-purple-500/10",
            },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-2xl border border-border/60 bg-card p-5 hover:border-border transition group"
            >
              <div
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.color}`}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-2 text-xs font-extrabold text-foreground group-hover:text-sky-500 transition">
                {item.label}
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </a>
          ))}
        </div>

        {/* FAQ Sections */}
        <h2 className="text-lg font-extrabold text-foreground mb-6 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Frequently Asked Questions
        </h2>

        {filteredFaqs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground">
              No results for &ldquo;{search}&rdquo;
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different search term or contact our support team.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredFaqs.map((cat) => (
              <div
                key={cat.category}
                className="rounded-3xl border border-border/60 bg-card px-6 py-2"
              >
                <h3 className="border-b border-border/40 py-3 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  {cat.category}
                </h3>
                {cat.items.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground mb-3">
            Still can't find what you're looking for?
          </p>
          <a
            href="mailto:support@seedhaproperties.com"
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow hover:brightness-110 transition"
          >
            Contact Support <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
