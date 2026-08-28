import {
  Home,
  Hammer,
  Maximize2,
  Paintbrush,
  Layers,
  ArrowLeftRight,
  CheckCircle2,
  Info,
} from "lucide-react";
import { HOME_LOAN_TYPES } from "../utils/loanCalculations";

const ICONS = {
  purchase: Home,
  construction: Hammer,
  extension: Maximize2,
  renovation: Paintbrush,
  "plot-construction": Layers,
  "balance-transfer": ArrowLeftRight,
};

interface Props {
  onSelectType?: (typeId: string) => void;
}

export function HomeLoanTypes({ onSelectType }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-xl font-black text-foreground sm:text-2xl">
            Choose the Right Home Loan
          </h3>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Understand different housing loan categories tailored for every stage of your home
            journey.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          Available products vary by lender & applicant profile
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {HOME_LOAN_TYPES.map((loan) => {
          const Icon = ICONS[loan.id as keyof typeof ICONS] || Home;
          return (
            <div
              key={loan.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                    {loan.badge}
                  </span>
                </div>

                <h4 className="mt-4 text-base font-bold text-foreground">{loan.title}</h4>
                <p className="mt-1 text-xs font-medium text-primary">{loan.subtitle}</p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {loan.description}
                </p>

                <div className="mt-4 rounded-2xl bg-secondary/30 p-3 text-xs space-y-1.5">
                  <p className="font-semibold text-foreground">Who it's for:</p>
                  <p className="text-[11px] text-muted-foreground">{loan.whoItsFor}</p>
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Key Benefits:</p>
                  {loan.keyBenefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60">
                <p className="text-[10px] text-muted-foreground italic mb-3">
                  Note: {loan.eligibilityNote}
                </p>
                <button
                  onClick={() => onSelectType?.(loan.id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/40 py-2.5 text-xs font-bold text-foreground transition hover:border-primary hover:bg-primary/10 hover:text-primary"
                >
                  Explore {loan.title}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
