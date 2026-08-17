import { useState } from "react";
import {
  Search,
  Scale,
  MessageSquare,
  MapPin,
  Key,
  UserPlus,
  Upload,
  PhoneIncoming,
  FileCheck,
  Sparkles,
} from "lucide-react";

const CUSTOMER_STEPS = [
  {
    step: "01",
    title: "Browse & Search",
    desc: "Filter verified homes across Hyderabad by budget, bedrooms, and top IT hubs.",
    icon: Search,
  },
  {
    step: "02",
    title: "Compare Details",
    desc: "Check transparent pricing, security deposit terms, and video walk-through tours.",
    icon: Scale,
  },
  {
    step: "03",
    title: "Direct Connect",
    desc: "Connect directly with verified owners via WhatsApp without broker middleman fees.",
    icon: MessageSquare,
  },
  {
    step: "04",
    title: "Visit Property",
    desc: "Schedule physical site visits or explore approved high-definition video tours.",
    icon: MapPin,
  },
  {
    step: "05",
    title: "Move In",
    desc: "Finalize standard rental agreement directly with the owner and collect keys.",
    icon: Key,
  },
];

const OWNER_STEPS = [
  {
    step: "01",
    title: "Free Registration",
    desc: "Sign up in 30 seconds with mobile OTP — no listing or registration charges.",
    icon: UserPlus,
  },
  {
    step: "02",
    title: "Post Details",
    desc: "Add photos, expected rent, tenant preferences, and locality highlights.",
    icon: Upload,
  },
  {
    step: "03",
    title: "Listing Review",
    desc: "Our moderation team checks listing accuracy before publishing to the platform.",
    icon: FileCheck,
  },
  {
    step: "04",
    title: "Direct Inquiries",
    desc: "Receive direct WhatsApp inquiries from interested tenant profiles.",
    icon: PhoneIncoming,
  },
  {
    step: "05",
    title: "Rent Directly",
    desc: "Finalize deals smoothly without middleman fees or platform commissions.",
    icon: Key,
  },
];

export function HowItWorks() {
  const [tab, setTab] = useState<"customer" | "owner">("customer");
  const steps = tab === "customer" ? CUSTOMER_STEPS : OWNER_STEPS;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary mb-3">
          <Sparkles className="h-3.5 w-3.5" /> Simple 5-Step Process
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          How Seedha Properties Works
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Transparent, streamlined, and 100% free of agent commissions.
        </p>

        {/* Dual Tab Switcher */}
        <div className="mt-7 inline-flex rounded-full bg-secondary/80 p-1 border border-border/60 shadow-xs">
          <button
            onClick={() => setTab("customer")}
            className={`rounded-full px-6 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
              tab === "customer"
                ? "bg-card text-foreground shadow-md scale-102"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            For Renters &amp; Buyers
          </button>
          <button
            onClick={() => setTab("owner")}
            className={`rounded-full px-6 py-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
              tab === "owner"
                ? "bg-card text-foreground shadow-md scale-102"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            For Property Owners
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)] hover:border-primary/50"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20">
                    {item.step}
                  </span>
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 shadow-2xs">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>

                <h3 className="mt-4 text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
              </div>

              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
