import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export function ProductFaq({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          <HelpCircle className="h-3.5 w-3.5" /> Frequently Asked Questions
        </span>
        <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
          Everything You Need to Know
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-border/50 bg-card overflow-hidden transition"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-foreground hover:bg-secondary/30 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/30">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
