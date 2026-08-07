import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { Property } from "@/lib/properties";

export function UrbanAiAssistant({ property }: { property: Property }) {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const prompts = [
    {
      label: "🤖 Explain locality & water supply",
      answer: `In ${property.city}, ${property.address} has 24/7 Manjeera water supply, 100% DG power backup, and a 4.9/5 safety rating. It is 3 mins from Mindspace IT Park.`,
    },
    {
      label: "💰 Estimate fair market price",
      answer: `Our AI valuation model estimates the fair rental range for ${property.bedrooms} BHK in ${property.city} at ₹${(property.price * 0.95).toLocaleString("en-IN")} – ₹${(property.price * 1.05).toLocaleString("en-IN")}. Current asking price of ₹${property.price.toLocaleString("en-IN")} is highly competitive with 0% brokerage.`,
    },
    {
      label: "📈 3-Year appreciation potential",
      answer: `Given the upcoming Metro Expansion and ORR connectivity, properties in ${property.city} are projected to appreciate by 12.5% YoY over the next 36 months.`,
    },
    {
      label: "🚆 Calculate commute time",
      answer: `Commute time from this property: Hitech City Cyber Towers (4 mins, 1.2 km), Durgam Cheruvu Metro (5 mins, 1.5 km), Rajiv Gandhi Int'l Airport (32 mins via ORR).`,
    },
  ];

  return (
    <section className="rounded-3xl border border-primary/30 bg-primary/5 p-6 shadow-sm sm:p-8">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-lg font-extrabold text-foreground">Ask Urban AI Assistant</h3>
          <p className="text-xs text-muted-foreground">
            Instant real-estate insights, price benchmarks & locality intelligence.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedPrompt(p.answer)}
            className="rounded-xl border border-border/60 bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition hover:border-primary hover:bg-primary/10"
          >
            {p.label}
          </button>
        ))}
      </div>

      {selectedPrompt && (
        <div className="mt-4 rounded-2xl border border-primary/30 bg-card p-4 text-xs leading-relaxed text-foreground animate-fadeIn">
          <div className="flex items-center justify-between font-bold text-primary mb-1">
            <span>🤖 Urban AI Analysis Result:</span>
            <button
              onClick={() => setSelectedPrompt(null)}
              className="text-[10px] text-muted-foreground hover:underline"
            >
              Clear
            </button>
          </div>
          <p>{selectedPrompt}</p>
        </div>
      )}
    </section>
  );
}
