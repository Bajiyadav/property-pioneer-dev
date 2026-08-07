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
} from "lucide-react";

const CUSTOMER_STEPS = [
  {
    step: "01",
    title: "Search",
    desc: "Filter by city, locality, price, and tenant preferences.",
    icon: Search,
  },
  {
    step: "02",
    title: "Compare",
    desc: "Shortlist favorites and compare amenities & rent deposits.",
    icon: Scale,
  },
  {
    step: "03",
    title: "Contact",
    desc: "Connect directly with verified owners via WhatsApp or inquiry.",
    icon: MessageSquare,
  },
  {
    step: "04",
    title: "Visit",
    desc: "Schedule a physical visit or take a virtual tour.",
    icon: MapPin,
  },
  {
    step: "05",
    title: "Move In",
    desc: "Sign digital rental agreement online and move into your home.",
    icon: Key,
  },
];

const OWNER_STEPS = [
  {
    step: "01",
    title: "Create Account",
    desc: "Sign up in 30 seconds with phone or email.",
    icon: UserPlus,
  },
  {
    step: "02",
    title: "Upload Property",
    desc: "Add photos, location, and rent details for free.",
    icon: Upload,
  },
  {
    step: "03",
    title: "Receive Leads",
    desc: "Get instant WhatsApp & SMS notifications from interested tenants.",
    icon: PhoneIncoming,
  },
  {
    step: "04",
    title: "Manage Enquiries",
    desc: "Filter candidate tenant profiles (bachelors, families).",
    icon: FileCheck,
  },
  {
    step: "05",
    title: "Rent Faster",
    desc: "Finalize deal with zero broker interference.",
    icon: Key,
  },
];

export function HowItWorks() {
  const [tab, setTab] = useState<"customer" | "owner">("customer");
  const steps = tab === "customer" ? CUSTOMER_STEPS : OWNER_STEPS;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Simple Workflow
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
          How Urban Properties Works
        </h2>

        {/* Dual Tab Switch */}
        <div className="mt-6 inline-flex rounded-xl bg-secondary p-1">
          <button
            onClick={() => setTab("customer")}
            className={`rounded-lg px-6 py-2 text-xs font-semibold transition ${
              tab === "customer"
                ? "bg-background text-foreground shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            For Renters & Buyers
          </button>
          <button
            onClick={() => setTab("owner")}
            className={`rounded-lg px-6 py-2 text-xs font-semibold transition ${
              tab === "owner"
                ? "bg-background text-foreground shadow"
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
              className="relative rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <span className="text-xs font-bold text-primary">{item.step}</span>
              <div className="mt-2 grid h-10 w-10 place-items-center rounded-xl bg-secondary text-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
