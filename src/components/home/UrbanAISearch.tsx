import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, Search, ArrowRight, Bot, Compass, MapPin } from "lucide-react";
import { toast } from "sonner";

const AI_SEARCH_PROMPTS = [
  "Furnished 2BHK under ₹30,000 near Durgam Cheruvu Metro",
  "Studio flat in Gachibowli near Financial District for IT professionals",
  "3BHK apartment in Kondapur near Botanical Garden for family",
  "PG accommodation near Hitech City Mindspace under ₹10,000",
];

export function UrbanAISearch() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const handleAISearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    toast.success("Urban AI parsed your natural language request!", {
      description: `Filtering listings for: "${prompt}"`,
    });

    navigate({
      to: "/properties",
      search: { q: prompt, city: "Hyderabad", listing: "rent", minPrice: 0, maxPrice: 0, beds: 0 },
    });
  };

  return (
    <div className="rounded-3xl border border-primary/30 bg-card p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          <Bot className="h-4 w-4" /> Ask Urban AI Search
        </span>
        <span className="text-xs text-muted-foreground">✨ Powered by Gemini AI</span>
      </div>

      <h3 className="text-xl sm:text-2xl font-semibold text-foreground">
        Search Homes in Plain English
      </h3>

      <form onSubmit={handleAISearch} className="mt-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Furnished 2BHK flat under ₹30,000 near Raidurg Metro for bachelors"
            className="w-full rounded-2xl border border-border bg-background py-3.5 pl-11 pr-4 text-xs sm:text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-xs sm:text-sm font-semibold text-primary-foreground transition hover:brightness-110 shadow-lg"
        >
          <Search className="h-4 w-4" /> AI Search
        </button>
      </form>

      {/* Suggested Natural Language Prompts */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-muted-foreground">Try asking:</span>
        {AI_SEARCH_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPrompt(p)}
            className="rounded-xl border border-border bg-secondary/40 px-3 py-1.5 text-[11px] text-foreground transition hover:border-primary hover:bg-card"
          >
            "{p}"
          </button>
        ))}
      </div>
    </div>
  );
}
