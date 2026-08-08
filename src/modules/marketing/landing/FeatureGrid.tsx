import {
  ShieldCheck,
  FileCheck,
  TrendingUp,
  Landmark,
  FileText,
  PieChart,
  Award,
  Calculator,
  Video,
  Calendar,
  Lock,
  BadgeCheck,
} from "lucide-react";

export function FeatureGrid() {
  const FEATURES = [
    {
      title: "Verified Sellers Only",
      desc: "Every property owner undergoes mandatory Aadhaar/PAN ID and phone OTP verification.",
      icon: ShieldCheck,
      color: "text-emerald-500",
    },
    {
      title: "Title Deed Verification",
      desc: "Legal title verification reports generated for HMDA, DTCP, and RERA approvals.",
      icon: FileCheck,
      color: "text-blue-500",
    },
    {
      title: "AI Fair Market Valuation",
      desc: "Machine learning models evaluate comparable sales in Madhapur, Gachibowli, & Hitech City.",
      icon: TrendingUp,
      color: "text-purple-500",
    },
    {
      title: "Pre-Approved Bank Loans",
      desc: "Pre-approved mortgage offers starting at 8.35% p.a. from SBI, HDFC, ICICI, and Axis Bank.",
      icon: Landmark,
      color: "text-amber-500",
    },
    {
      title: "Ownership & Encumbrance Audit",
      desc: "Comprehensive history audit showing clear ownership title without legal disputes.",
      icon: FileText,
      color: "text-indigo-500",
    },
    {
      title: "Rental Yield & ROI Score",
      desc: "Predictive analytics evaluating annual rental yield percentage and 5-year capital growth.",
      icon: PieChart,
      color: "text-rose-500",
    },
    {
      title: "Investment Rating (0-100)",
      desc: "Algorithmic rating based on metro proximity, IT corridor distance, and infrastructure plans.",
      icon: Award,
      color: "text-teal-500",
    },
    {
      title: "Mortgage & EMI Calculators",
      desc: "Real-time loan repayment, down payment, and rent vs buy affordability calculators.",
      icon: Calculator,
      color: "text-cyan-500",
    },
    {
      title: "Live Video Walkthroughs",
      desc: "Virtual 3D tours and live video walkthroughs guided by property experts.",
      icon: Video,
      color: "text-emerald-500",
    },
    {
      title: "1-Click Walkthrough Scheduling",
      desc: "Schedule in-person site visits at your convenient date with direct owner confirmation.",
      icon: Calendar,
      color: "text-purple-500",
    },
    {
      title: "Digital E-Stamp Document Vault",
      desc: "State-stamped digital agreements, sale deeds, and receipts stored in encrypted vault.",
      icon: Lock,
      color: "text-amber-500",
    },
    {
      title: "No platform commission",
      desc: "Direct transaction between verified buyers & sellers with zero broker fees.",
      icon: BadgeCheck,
      color: "text-emerald-500",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          Product Capabilities
        </span>
        <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Comprehensive PropTech Engine
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
          Every tool you need to research, verify, finance, and close real estate deals with total
          confidence.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={idx}
              className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm transition hover:shadow-md hover:border-border"
            >
              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl bg-secondary/80 ${item.color}`}
              >
                <IconComp className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">{item.title}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
