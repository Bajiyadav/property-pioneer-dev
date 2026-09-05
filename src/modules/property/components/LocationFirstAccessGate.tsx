import React, { useState, useEffect } from "react";
import {
  MapPin,
  Building2,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Search,
} from "lucide-react";
import { type LocationValidationResult } from "@/modules/property/services/locationDetailsService";
import { useAuthSession } from "@/hooks/useAuthSession";

interface LocationFirstAccessGateProps {
  propertyId?: string;
  initialCity?: string;
  initialLocality?: string;
  onLocationValidated: (result: LocationValidationResult) => void;
  className?: string;
}

export const LocationFirstAccessGate: React.FC<LocationFirstAccessGateProps> = ({
  propertyId,
  initialCity = "",
  initialLocality = "",
  onLocationValidated,
  className = "",
}) => {
  const { user } = useAuthSession();
  const [searchQuery, setSearchQuery] = useState(
    initialLocality
      ? initialCity
        ? `${initialLocality}, ${initialCity}`
        : initialLocality
      : initialCity,
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parts = searchQuery
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const locality = parts[0] || "";
    const city = parts.length > 1 ? parts[parts.length - 1] : "Unknown City";

    if (!locality) {
      setErrorMessage("Please enter a valid location.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/properties/location-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          city: city,
          locality: locality,
          place: undefined,
        }),
      });

      const data = (await res.json()) as LocationValidationResult;

      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Please enter a valid location.");
        setSubmitting(false);
        return;
      }

      onLocationValidated(data);
    } catch {
      setErrorMessage("Please enter a valid location.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`mx-auto max-w-xl rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl ${className}`}
      data-testid="location-first-access-gate"
    >
      <div className="text-center">
        <div className="mx-auto mb-3.5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <MapPin className="h-6 w-6" />
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-extrabold text-foreground">
          Reveal the exact location
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Confirm the city and locality to unlock this property's exact street address and
          directions. Browsing stays open — this only reveals the precise location.
        </p>

        {user && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary/80 px-3 py-1 text-[11px] font-medium text-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Signed in as{" "}
            <strong className="font-bold">{user.user_metadata?.full_name || user.email}</strong>
          </div>
        )}
      </div>

      <form onSubmit={handleContinue} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Location
          </label>
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="e.g. Bandra, Mumbai"
              className="w-full h-11 rounded-xl border border-border bg-background pl-10 pr-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={submitting || !searchQuery.trim()}
          className="mt-2 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-500 active:scale-98 disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Continue <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
