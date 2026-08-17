import { useEffect, useState } from "react";
import { Quote, Sparkles } from "lucide-react";

const QUOTES = [
  "Your next home is closer than you think.",
  "Every great journey begins with the right address.",
  "Moderated listings. Honest pricing. Better living.",
  "Built for Hyderabad. Ready for India.",
  "Finding a home should feel exciting—not stressful.",
  "Direct owner connect. No platform commission.",
];

export function QuoteBanner() {
  const [quote, setQuote] = useState(QUOTES[0]);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card to-secondary/60 p-8 sm:p-10 text-center shadow-[var(--shadow-card)] ring-1 ring-white/10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <Quote className="mx-auto h-7 w-7 text-primary/40 rotate-180" />
        <blockquote className="mt-3 font-[family-name:var(--font-display)] text-xl sm:text-2xl md:text-3xl font-medium italic text-foreground tracking-tight max-w-3xl mx-auto">
          &ldquo;{quote}&rdquo;
        </blockquote>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Seedha Properties</span>
        </div>
      </div>
    </section>
  );
}
