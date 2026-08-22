import { Building2, ExternalLink, Check, ShieldCheck } from "lucide-react";

export interface BankOffer {
  name: string;
  tagline: string;
  rateRange: string;
  minRate: number;
  processingFee: string;
  maxTenure: string;
  features: string[];
  color: string;
  isPopular?: boolean;
}

const BANK_OFFERS: BankOffer[] = [
  {
    name: "State Bank of India (SBI)",
    tagline: "India's largest public mortgage lender",
    rateRange: "8.50% - 9.45% p.a.",
    minRate: 8.5,
    processingFee: "0.35% (Min ₹2,000 + GST)",
    maxTenure: "Up to 30 Years",
    features: [
      "Zero prepayment penalty",
      "Concession for women borrowers",
      "Overdraft Maxgain facility",
    ],
    color: "bg-blue-600",
    isPopular: true,
  },
  {
    name: "HDFC Bank",
    tagline: "Premier private housing finance provider",
    rateRange: "8.75% - 9.65% p.a.",
    minRate: 8.75,
    processingFee: "0.50% (Max ₹3,000 + GST)",
    maxTenure: "Up to 30 Years",
    features: [
      "Instant digital approval",
      "Customized EMI repayment plans",
      "Top-up loan availability",
    ],
    color: "bg-red-600",
    isPopular: true,
  },
  {
    name: "ICICI Bank",
    tagline: "Express pre-approved home loans",
    rateRange: "8.75% - 9.80% p.a.",
    minRate: 8.75,
    processingFee: "0.50% - 1.00% + GST",
    maxTenure: "Up to 30 Years",
    features: [
      "3-step online sanction",
      "Reduced documentation",
      "Attractive balance transfer rates",
    ],
    color: "bg-orange-600",
  },
  {
    name: "Axis Bank",
    tagline: "Flexible interest & quick disbursal",
    rateRange: "8.90% - 9.85% p.a.",
    minRate: 8.9,
    processingFee: "Up to 1% + GST",
    maxTenure: "Up to 30 Years",
    features: [
      "Fast track sanctioning",
      "12 EMI waivers on timely payment",
      "Nil prepayment charges",
    ],
    color: "bg-purple-600",
  },
  {
    name: "Bank of Baroda",
    tagline: "Competitive government bank interest rates",
    rateRange: "8.40% - 9.30% p.a.",
    minRate: 8.4,
    processingFee: "Nil for select festival offers",
    maxTenure: "Up to 30 Years",
    features: [
      "Lowest benchmark rate",
      "Free credit card on sanction",
      "No hidden processing charges",
    ],
    color: "bg-amber-600",
  },
  {
    name: "Kotak Mahindra Bank",
    tagline: "Fast digital sanction & personalized assistance",
    rateRange: "8.70% - 9.50% p.a.",
    minRate: 8.7,
    processingFee: "0.50% + GST",
    maxTenure: "Up to 25 Years",
    features: ["Paperless digital journey", "Dedicated loan advisor", "Balance transfer top-up"],
    color: "bg-red-700",
  },
];

interface Props {
  onSelectBank?: (bankName: string) => void;
}

export function BankOffersTable({ onSelectBank }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-xl font-bold text-foreground">Compare Top Bank Home Loan Rates</h3>
          <p className="text-xs text-muted-foreground">
            Current benchmark interest rates and processing fees from verified lending partners.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Updated August 2026
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BANK_OFFERS.map((bank) => (
          <div
            key={bank.name}
            className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all hover:shadow-md ${
              bank.isPopular ? "border-primary/40 bg-card shadow-xs" : "border-border bg-card/60"
            }`}
          >
            {bank.isPopular && (
              <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-foreground shadow-xs">
                Popular
              </span>
            )}

            <div>
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${bank.color} text-sm font-black text-white`}
                >
                  {bank.name.slice(0, 3)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground leading-snug">{bank.name}</h4>
                  <p className="text-[11px] text-muted-foreground">{bank.tagline}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-secondary/30 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Interest Rate (Indicative):</span>
                  <span className="font-extrabold text-primary">{bank.rateRange}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processing Fee:</span>
                  <span className="font-medium text-foreground text-right">
                    {bank.processingFee}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Tenure:</span>
                  <span className="font-medium text-foreground">{bank.maxTenure}</span>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                {bank.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/60">
              <a
                href="#loan-inquiry-section"
                onClick={() => onSelectBank?.(bank.name)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 py-2 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                Apply via {bank.name.split(" ")[0]}
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-[11px] text-muted-foreground leading-relaxed">
        <strong className="text-foreground font-semibold">Important Disclaimer:</strong> All
        interest rates, processing fees, and eligibility criteria displayed above are{" "}
        <span className="font-bold text-foreground underline">indicative</span> and compiled from
        publicly available lender information as of August 2026. Seedha Properties is a marketplace
        facilitator and does not guarantee loan sanctions or specific interest rates. Final sanction
        terms, rates, and disbursal are solely determined by the respective banking partner based on
        individual credit appraisal and RBI guidelines.
      </div>
    </div>
  );
}
