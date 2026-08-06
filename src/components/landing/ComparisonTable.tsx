import { CheckCircle2, XCircle } from "lucide-react";

export function ComparisonTable() {
  const MATRIX = [
    { feature: "Brokerage & Fees", urban: "0% Zero Commission", broker: "2% to 3% Heavy Fee", legacy: "Hidden Charges" },
    { feature: "Seller Verification", urban: "Mandatory Aadhaar/PAN ID", broker: "Unverified Brokers", legacy: "Frequent Fake Leads" },
    { feature: "Legal Title Verification", urban: "100% Pre-Audited Deeds", broker: "Manual & Risky", legacy: "Self-Reported Only" },
    { feature: "AI Valuation & Trends", urban: "Real-Time Machine Learning", broker: "Inflated Quotes", legacy: "Outdated Data" },
    { feature: "Direct Owner Contact", urban: "Instant Direct Connect", broker: "Blocked by Middleman", legacy: "Paid Contact Limits" },
    { feature: "Digital E-Stamp Agreements", urban: "Included Instantly", broker: "Manual Paperwork", legacy: "Third-Party Extra Fee" },
    { feature: "Bank Loan Assistance", urban: "Direct Bank Integrations", broker: "High Agent Margins", legacy: "Lead Selling to Banks" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Why Choose Urban Properties
        </span>
        <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">The Transparent Advantage</h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
          See how our tech-first platform compares against traditional brokers and legacy property sites.
        </p>
      </div>

      <div className="mt-10 overflow-x-auto rounded-3xl border border-border/50 bg-card shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-secondary/50">
              <th className="p-4 font-extrabold text-foreground">Feature</th>
              <th className="p-4 font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-600/10">Urban Properties</th>
              <th className="p-4 font-semibold text-muted-foreground">Traditional Brokers</th>
              <th className="p-4 font-semibold text-muted-foreground">Legacy Portals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {MATRIX.map((row, idx) => (
              <tr key={idx} className="hover:bg-secondary/30 transition">
                <td className="p-4 font-bold text-foreground">{row.feature}</td>
                <td className="p-4 font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-600/5 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-none" /> {row.urban}
                </td>
                <td className="p-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5 text-rose-500" /> {row.broker}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5 text-amber-500" /> {row.legacy}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
