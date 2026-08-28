import {
  Compass,
  Calculator,
  FileCheck,
  Building2,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export function LoanApplicationJourney() {
  const steps = [
    {
      step: 1,
      title: "Understand Your Requirement",
      icon: Compass,
      desc: "Determine your property budget, ideal location, and available down payment savings.",
    },
    {
      step: 2,
      title: "Check Indicative Eligibility",
      icon: Calculator,
      desc: "Use our guided tool to estimate borrowing limits, monthly EMI, and FOIR affordability.",
    },
    {
      step: 3,
      title: "Prepare Documents",
      icon: FileCheck,
      desc: "Organize KYC, salary slips, bank statements, ITRs, and property title documentation.",
    },
    {
      step: 4,
      title: "Explore Lender Options",
      icon: Building2,
      desc: "Compare benchmark rates, processing fees, and features across verified Indian banks.",
    },
    {
      step: 5,
      title: "Apply & Connect With Lender",
      icon: CheckCircle,
      desc: "Submit your inquiry for doorstep document collection, technical appraisal, and sanction.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Guided 5-Step Process
        </span>
        <h3 className="mt-3 text-xl font-black text-foreground sm:text-3xl">
          Your Home Loan Financing Journey
        </h3>
        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
          A clear, structured path from initial planning to loan sanction and disbursement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="relative flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-xs font-black text-primary">
                    0{s.step}
                  </span>
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <h4 className="mt-4 text-sm font-bold text-foreground leading-snug">{s.title}</h4>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <div className="grid h-6 w-6 place-items-center rounded-full border border-border bg-background shadow-xs text-muted-foreground">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4 text-xs text-muted-foreground text-center">
        <strong className="text-foreground font-semibold">Important Transparency Note:</strong>{" "}
        Seedha Properties provides indicative planning, eligibility tools, and marketplace
        assistance. Final underwriting, verification, sanction, and disbursement are handled solely
        by the selected licensed banking institution.
      </div>
    </div>
  );
}
