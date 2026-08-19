import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Home, Building2, Sparkles, Loader2, UserCheck, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/modules/authentication/context/AuthContext";
import { GoogleSignInButton } from "@/shared/components/auth/GoogleSignInButton";
import { LISTING_PHONE_KEY } from "@/routes/list-property";

export interface StartNowFormProps {
  className?: string;
  onSuccess?: () => void;
}

/**
 * Production-ready StartNowForm for Seedha Properties.
 *
 * Key fixes:
 * - Immediate click responsiveness with zero mandatory blocking validations.
 * - Non-blocking phone number field (optional for initial wizard entry).
 * - Safe draft storage to localStorage & sessionStorage.
 * - Loading spinner & clean toast notifications.
 * - Mobile responsive 48px+ touch targets.
 */
export const StartNowForm: React.FC<StartNowFormProps> = ({ className = "", onSuccess }) => {
  const navigate = useNavigate();
  const { status, user } = useAuth();

  const [propertyType, setPropertyType] = useState<"Residential" | "Commercial">("Residential");
  const [intent, setIntent] = useState<"Rent" | "Sell" | "PG/Co-living">("Rent");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartNow = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      // 1. Sanitize phone if provided (optional at start)
      const cleanPhone = phone.trim();
      const pureDigits = cleanPhone.replace(/\D/g, "");

      if (cleanPhone.length > 0 && (pureDigits.length < 7 || pureDigits.length > 15)) {
        setError(
          "Please enter a valid phone number (7 to 15 digits) or leave it blank to fill later.",
        );
        setIsLoading(false);
        return;
      }

      // 2. Persist initial draft state in localStorage and sessionStorage
      try {
        if (pureDigits.length > 0) {
          sessionStorage.setItem(LISTING_PHONE_KEY, cleanPhone);
        }
        localStorage.setItem(
          "listing_draft",
          JSON.stringify({
            property_type: propertyType,
            listing_type: intent.toLowerCase() === "sell" ? "sale" : "rent",
            intent,
            owner_phone: cleanPhone,
            startedAt: new Date().toISOString(),
          }),
        );
      } catch {
        // Private browsing safe
      }

      // 3. Callback if supplied
      if (onSuccess) {
        onSuccess();
      }

      // 4. Navigate smoothly to the 6-step listing wizard
      toast.success("Starting your free listing...", {
        description: "Zero brokerage, direct owner connection.",
      });

      await navigate({
        to: "/list-property/wizard",
        search: { propertyType, intent },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`w-full max-w-md bg-card/95 backdrop-blur-xl border border-border/80 rounded-3xl shadow-2xl overflow-hidden ${className}`}
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F766E] to-[#115E59] p-4 text-center text-white">
        <p className="text-[11px] uppercase tracking-widest font-bold text-emerald-200 flex items-center justify-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Start Your Listing
        </p>
        <h3 className="text-lg font-extrabold text-white mt-0.5">Post as an Owner Free</h3>
      </div>

      <div className="p-5 sm:p-7 space-y-5">
        {/* Authentication Notice / 1-Click Fast Track */}
        {status === "authenticated" ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <UserCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="truncate">
              Signed in as <span className="font-bold">{user?.email}</span> (Listing will link to
              your owner account).
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-secondary/50 border border-border/70 p-3.5 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">Have an account?</span>
              <span className="text-[10px] uppercase font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                1-Click Fast Track
              </span>
            </div>
            <GoogleSignInButton
              redirect="/list-property/wizard"
              label="Continue with Google (1-Click)"
              className="h-11 w-full text-xs shadow-xs border-border"
            />
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 h-px bg-border/80" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                OR CONTINUE BELOW
              </span>
              <div className="flex-1 h-px bg-border/80" />
            </div>
          </div>
        )}

        <form onSubmit={handleStartNow} className="space-y-4">
          {/* Property Category */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Property Category
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPropertyType("Residential")}
                className={`flex min-h-[48px] items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                  propertyType === "Residential"
                    ? "bg-[#0F766E]/10 border-[#0F766E] text-[#0F766E] dark:text-[#14B8A6] shadow-xs ring-1 ring-[#0F766E]"
                    : "bg-background border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                <Home className="h-4 w-4" /> Residential
              </button>
              <button
                type="button"
                onClick={() => setPropertyType("Commercial")}
                className={`flex min-h-[48px] items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                  propertyType === "Commercial"
                    ? "bg-[#0F766E]/10 border-[#0F766E] text-[#0F766E] dark:text-[#14B8A6] shadow-xs ring-1 ring-[#0F766E]"
                    : "bg-background border-border text-muted-foreground hover:border-border/80"
                }`}
              >
                <Building2 className="h-4 w-4" /> Commercial
              </button>
            </div>
          </div>

          {/* Intent / I Want To */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              I want to...
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Rent", "Sell", "PG/Co-living"] as const).map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIntent(i)}
                  className={`min-h-[44px] rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    intent === i
                      ? "bg-[#0F766E] border-[#0F766E] text-white shadow-md"
                      : "bg-background border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Phone Number Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="startnow-phone"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Your Mobile Number
              </label>
              <span className="text-[10px] text-muted-foreground font-semibold">
                (Optional for now)
              </span>
            </div>
            <input
              id="startnow-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={18}
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/[^0-9+\s-]/g, "").slice(0, 18));
                if (error) setError(null);
              }}
              className="w-full h-12 min-h-[48px] rounded-xl border border-input bg-background px-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0F766E] transition-all"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              Direct WhatsApp & verified buyer connections. Zero spam.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 px-3.5 py-2.5 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* START NOW Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="start-now-submit-button"
              disabled={isLoading}
              aria-label="Start property listing now"
              className="w-full min-h-[50px] flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#0F766E] via-[#115E59] to-[#0D9488] px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-teal-950/20 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                  <span>START NOW — FREE</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartNowForm;
