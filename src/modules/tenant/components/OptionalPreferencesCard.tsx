import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Home, IndianRupee } from "lucide-react";

export function OptionalPreferencesCard() {
  const [isVisible, setIsVisible] = useState(true);
  const [bhk, setBhk] = useState<string>("");
  const [budget, setBudget] = useState<string>("");

  useEffect(() => {
    // Check if we already have this data
    try {
      const stored = localStorage.getItem("sp_tenant_prefs");
      if (stored) {
        setIsVisible(false);
      }
    } catch (err) {
      // ignore
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem("sp_tenant_prefs", JSON.stringify({ bhk, budget }));
      setIsVisible(false);
      // In a real app, this would also sync to the backend for the logged-in user
    } catch (err) {
      // ignore
    }
  };

  if (!isVisible) return null;

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 p-5 shadow-sm relative overflow-hidden my-6">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />

      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-emerald-600" />
        <h3 className="text-lg font-bold text-foreground tracking-tight">
          Help us find your perfect home faster
        </h3>
      </div>

      <p className="text-sm text-muted-foreground mb-5 max-w-lg">
        Tell us a bit more about what you're looking for, and we'll prioritize listings that match
        your criteria.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Home className="h-3.5 w-3.5" /> Preferred BHK
          </label>
          <div className="flex flex-wrap gap-2">
            {["1", "2", "3", "4+"].map((val) => (
              <button
                key={val}
                onClick={() => setBhk(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  bhk === val
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-background border border-border/60 hover:bg-emerald-50 text-foreground"
                }`}
              >
                {val} BHK
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5" /> Monthly Budget
          </label>
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
          >
            <option value="">Select your budget range</option>
            <option value="Under 20k">Under ₹20,000</option>
            <option value="20k-40k">₹20,000 - ₹40,000</option>
            <option value="40k-80k">₹40,000 - ₹80,000</option>
            <option value="80k+">Above ₹80,000</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-emerald-500/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-xs hover:bg-emerald-500/10"
        >
          Skip for now
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!bhk && !budget}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
        >
          Save Preferences <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
