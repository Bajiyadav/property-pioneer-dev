import { Quote } from "lucide-react";

const QUOTES = [
  "Your next home is closer than you think.",
  "Every great journey begins with the right address.",
  "Verified homes. Honest pricing. Better living.",
  "Built for Hyderabad. Ready for India.",
  "Finding a home should feel exciting—not stressful.",
  "No brokerage. No surprises. Just better homes.",
];

export function QuoteBanner() {
  const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-secondary p-8 text-center shadow-lg">
        <Quote className="mx-auto h-8 w-8 text-primary/40" />
        <blockquote className="mt-3 text-xl font-serif font-medium italic text-foreground sm:text-2xl">
          "{randomQuote}"
        </blockquote>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Urban Properties • The Hyderabad Standard
        </p>
      </div>
    </section>
  );
}
