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
import {
  fetchLocationHierarchy,
  type LocationHierarchy,
  type LocationValidationResult,
} from "@/modules/property/services/locationDetailsService";
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
  initialCity = "Hyderabad",
  initialLocality = "",
  onLocationValidated,
  className = "",
}) => {
  const { user } = useAuthSession();
  const [hierarchy, setHierarchy] = useState<LocationHierarchy>({
    cities: ["Hyderabad", "Bengaluru", "Mumbai", "Pune", "Chennai", "Delhi NCR", "Kolkata"],
    localities: [],
    places: [],
  });

  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedLocality, setSelectedLocality] = useState(initialLocality);
  const [selectedPlace, setSelectedPlace] = useState("");
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load localities and places when city or locality changes
  useEffect(() => {
    let isMounted = true;
    setLoadingHierarchy(true);
    fetchLocationHierarchy(selectedCity, selectedLocality)
      .then((data) => {
        if (isMounted) {
          setHierarchy(data);
          if (data.localities.length > 0 && !data.localities.includes(selectedLocality)) {
            setSelectedLocality(data.localities[0] || "");
          }
          if (data.places.length > 0 && !data.places.includes(selectedPlace)) {
            setSelectedPlace(data.places[0] || "");
          }
          setLoadingHierarchy(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingHierarchy(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCity, selectedLocality]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCity.trim() || !selectedLocality.trim()) {
      setErrorMessage("Please select a valid location from the available options.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/properties/location-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          city: selectedCity.trim(),
          locality: selectedLocality.trim(),
          place: selectedPlace.trim() || undefined,
        }),
      });

      const data = (await res.json()) as LocationValidationResult;

      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Please select a valid location from the available options.");
        setSubmitting(false);
        return;
      }

      onLocationValidated(data);
    } catch {
      setErrorMessage("Please select a valid location from the available options.");
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
          Select your location to continue
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose the verified city, locality, and place to view complete property details and direct
          owner connectivity.
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
        {/* City Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            City
          </label>
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedLocality("");
                setSelectedPlace("");
                setErrorMessage(null);
              }}
              className="w-full h-11 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              {hierarchy.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Locality Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Locality
          </label>
          <div className="relative">
            <select
              value={selectedLocality}
              disabled={loadingHierarchy || hierarchy.localities.length === 0}
              onChange={(e) => {
                setSelectedLocality(e.target.value);
                setSelectedPlace("");
                setErrorMessage(null);
              }}
              className="w-full h-11 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-60"
            >
              {hierarchy.localities.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Place / Landmark Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Place
          </label>
          <div className="relative">
            <select
              value={selectedPlace}
              disabled={loadingHierarchy || hierarchy.places.length === 0}
              onChange={(e) => {
                setSelectedPlace(e.target.value);
                setErrorMessage(null);
              }}
              className="w-full h-11 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-60"
            >
              {hierarchy.places.length === 0 ? (
                <option value="">Main Road / Central Corridor</option>
              ) : (
                hierarchy.places.map((place) => (
                  <option key={place} value={place}>
                    {place}
                  </option>
                ))
              )}
            </select>
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
          disabled={submitting || loadingHierarchy}
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
