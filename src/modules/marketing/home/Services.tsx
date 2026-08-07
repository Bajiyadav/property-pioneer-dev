import {
  Landmark,
  ShieldCheck,
  FileText,
  Paintbrush,
  Sparkles,
  Zap,
  Wrench,
  Wifi,
  Armchair,
  Tv,
  UserCheck,
  Building,
  Key,
  Home,
  ArrowRight,
} from "lucide-react";

interface ServiceItem {
  title: string;
  desc: string;
  icon: React.ElementType;
  status: string;
  badgeColor?: string;
}

const SERVICES: ServiceItem[] = [
  {
    title: "Rental Agreement",
    desc: "Digital legal agreement with e-stamping delivered online in 10 minutes.",
    icon: FileText,
    status: "● Live in Hyderabad",
    badgeColor: "bg-emerald-600",
  },
  {
    title: "Home Loans",
    desc: "Compare best interest rates from top partner banks with pre-approval.",
    icon: Landmark,
    status: "🚀 Launching Q4 2026",
  },
  {
    title: "Legal Verification",
    desc: "Property title check and legal document verification assistance.",
    icon: ShieldCheck,
    status: "● Live in Hyderabad",
    badgeColor: "bg-emerald-600",
  },
  {
    title: "Home Painting",
    desc: "Professional painting services with 1-year service warranty.",
    icon: Paintbrush,
    status: "Available Soon",
  },
  {
    title: "Electrician Services",
    desc: "On-demand verified electricians for wiring, fixtures, and appliances.",
    icon: Zap,
    status: "Available Soon",
  },
  {
    title: "Plumbing Services",
    desc: "Instant plumber booking for leaks, fittings, and bathroom upgrades.",
    icon: Wrench,
    status: "Available Soon",
  },
  {
    title: "Internet Setup",
    desc: "High-speed optical fiber broadband setup on move-in day.",
    icon: Wifi,
    status: "Available Soon",
  },
  {
    title: "Furniture Rental",
    desc: "Rent living room, bedroom & study furniture packages monthly.",
    icon: Armchair,
    status: "Available Soon",
  },
  {
    title: "Appliance Rental",
    desc: "Rent refrigerators, ACs, washing machines, and smart TVs.",
    icon: Tv,
    status: "Available Soon",
  },
  {
    title: "Tenant Verification",
    desc: "Instant Aadhaar, PAN, and police verification reports for owners.",
    icon: UserCheck,
    status: "● Live in Hyderabad",
    badgeColor: "bg-emerald-600",
  },
  {
    title: "Property Management",
    desc: "End-to-end property maintenance, rent collection & tenant management.",
    icon: Building,
    status: "Available Soon",
  },
];

const JOURNEY_STEPS = [
  { step: "01", title: "Find Your Home", icon: Home, desc: "Browse 100% verified listings" },
  { step: "02", title: "Rental Agreement", icon: FileText, desc: "Instant 10-min e-stamping" },
  { step: "03", title: "Legal Verification", icon: ShieldCheck, desc: "Title & document checks" },
  { step: "04", title: "Home Painting", icon: Paintbrush, desc: "Move-in ready finish" },
  { step: "05", title: "Move In", icon: Key, desc: "Start living comfortably" },
];

export function Services({
  onSelectService,
}: {
  onSelectService?: (service: ServiceItem) => void;
}) {
  return (
    <section className="relative overflow-hidden bg-secondary/40 py-16 sm:py-24">
      {/* Background Lighting Effects */}
      <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Complete Ecosystem
          </span>
          <h2 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
            Everything You Need Beyond Finding a Home
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base leading-relaxed">
            Urban Properties is more than a property platform. We help you move, settle, and live
            comfortably with trusted home services.
          </p>
        </div>

        {/* Visual Customer Journey Stepper Flow */}
        <div className="mb-16 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-card)]">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              The Seamless Move-In Journey
            </p>
            <h3 className="text-lg font-semibold text-foreground mt-1">
              From Search to Living Comfortably
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {JOURNEY_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="relative flex flex-col items-center text-center p-3 rounded-2xl bg-secondary/50 border border-border/50"
                >
                  <span className="text-[10px] font-bold text-primary">{item.step}</span>
                  <div className="mt-2 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="mt-2 text-xs font-semibold text-foreground">{item.title}</h4>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Infinite Horizontal Marquee Showcase */}
      <div className="relative w-full overflow-hidden py-4">
        {/* Gradient Fades on Left & Right Edges */}
        <div className="absolute left-0 top-0 z-10 h-full w-16 sm:w-32 bg-gradient-to-r from-secondary/80 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 z-10 h-full w-16 sm:w-32 bg-gradient-to-l from-secondary/80 to-transparent pointer-events-none" />

        {/* Marquee Track 1 (Original + Duplicated for Seamless Loop) */}
        <div className="flex w-max animate-[marquee_35s_linear_infinite] hover:[animation-play-state:paused] gap-5 px-4">
          {[...SERVICES, ...SERVICES].map((s, idx) => {
            const Icon = s.icon;
            return (
              <button
                key={`${s.title}-${idx}`}
                type="button"
                onClick={() => onSelectService?.(s)}
                className="group w-72 text-left shrink-0 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition duration-300 transform-gpu hover:-translate-y-2 hover:scale-[1.03] hover:border-primary/50 hover:shadow-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span
                      className={`rounded-full ${s.badgeColor || "bg-primary/10 text-primary"} px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>

                <div className="mt-6 border-t border-border/50 pt-4 flex items-center justify-between text-xs font-semibold text-primary transition group-hover:translate-x-1">
                  <span>Explore & Book Service</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
