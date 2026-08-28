import { useState } from "react";
import { Building2, Check, ShieldCheck, Info, ExternalLink } from "lucide-react";
import { ESTABLISHED_BANKS, BankLender } from "../utils/loanCalculations";

interface Props {
  onSelectBank?: (bankName: string) => void;
}

export function BankOffersTable({ onSelectBank }: Props) {
  const [filterCategory, setFilterCategory] = useState<"All" | "Public Sector" | "Private Sector">(
    "All",
  );

  const filteredBanks = ESTABLISHED_BANKS.filter((b) => {
    if (filterCategory === "All") return true;
    return b.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-black text-foreground sm:text-2xl">
              Explore Home Loan Lender Options
            </h3>
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm mt-1">
            Compare benchmark rates, processing fees, and key features across leading Indian public
            & private banks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Tariff Reference: August 2026
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(["All", "Public Sector", "Private Sector"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              filterCategory === cat
                ? "bg-primary text-primary-foreground shadow-xs"
                : "border border-border bg-card hover:bg-secondary/60 text-muted-foreground"
            }`}
          >
            {cat} Lenders {cat === "All" ? `(${ESTABLISHED_BANKS.length})` : ""}
          </button>
        ))}
      </div>

      {/* Grid of Bank Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBanks.map((bank) => (
          <div
            key={bank.id}
            className={`relative flex flex-col justify-between rounded-3xl border p-6 transition-all hover:shadow-md ${
              bank.isPopular
                ? "border-primary/40 bg-card shadow-xs"
                : "border-border bg-card/60 hover:bg-card"
            }`}
          >
            {bank.isPopular && (
              <span className="absolute -top-2.5 right-5 rounded-full bg-primary px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground shadow-xs">
                Popular Choice
              </span>
            )}

            <div>
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${bank.logoBg} text-sm font-black text-white shadow-xs`}
                >
                  {bank.shortName}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground leading-snug">{bank.name}</h4>
                  <span className="inline-block rounded-md bg-secondary/80 px-2 py-0.5 text-[10px] font-bold text-muted-foreground mt-0.5">
                    {bank.category}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-muted-foreground italic">{bank.tagline}</p>

              <div className="mt-4 rounded-2xl bg-secondary/30 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Indicative Rate:</span>
                  <span className="font-extrabold text-primary text-sm">
                    {bank.indicativeRateRange}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Processing Fee:</span>
                  <span className="font-medium text-foreground text-right text-[11px] max-w-[55%]">
                    {bank.processingFee}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Max Tenure:</span>
                  <span className="font-medium text-foreground">{bank.maxTenure}</span>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <p className="text-[11px] font-bold text-foreground uppercase tracking-wide">
                  Key Highlights:
                </p>
                {bank.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/60 space-y-2">
              <p className="text-[10px] text-muted-foreground">{bank.sourceNote}</p>
              <button
                onClick={() => {
                  onSelectBank?.(bank.name);
                  const element = document.getElementById("loan-inquiry-section");
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 py-2.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
              >
                Explore {bank.shortName} Options
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Legal and Compliance Disclaimers */}
      <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4 sm:p-5 text-xs text-muted-foreground leading-relaxed space-y-2">
        <div className="flex items-center gap-2 text-foreground font-bold">
          <Info className="h-4 w-4 text-primary" />
          <span>Lender Assessment & Compliance Notice</span>
        </div>
        <p>
          • <strong>Independent Lender Assessment:</strong> All interest rates, processing fees,
          loan tenures, and eligibility requirements displayed above are indicative benchmark
          figures derived from published tariff schedules. Terms, rates, fees, and final sanctions
          are determined solely by the respective lender based on applicant credit appraisal and
          risk assessment.
        </p>
        <p>
          • <strong>Facilitator Role:</strong> Seedha Properties is a property discovery and
          financing assistance platform. Seedha does not own, operate, represent, or guarantee loan
          approval for any banking institution, nor does it guarantee specific interest rates or
          sanction timelines.
        </p>
      </div>
    </div>
  );
}
