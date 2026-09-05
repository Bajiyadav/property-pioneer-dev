import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Building2,
  Compass,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  AUTHORITATIVE_LOCATIONS,
  type StateInfo,
  type CityInfo,
  findState,
} from "@/config/locationHierarchy";

interface VisualLocationDiscoveryProps {
  initialState?: string;
  initialCity?: string;
  onSelectLocation: (state: string, city: string, geo?: { lat: number; lng: number }) => void;
  onCancel?: () => void;
}

export function VisualLocationDiscovery({
  initialState,
  initialCity,
  onSelectLocation,
  onCancel,
}: VisualLocationDiscoveryProps) {
  const [selectedState, setSelectedState] = useState<StateInfo | null>(() => {
    if (initialState) {
      return findState(initialState) || null;
    }
    return null;
  });

  const [selectedCity, setSelectedCity] = useState<CityInfo | null>(() => {
    if (initialState && initialCity) {
      const s = findState(initialState);
      return (
        s?.cities.find(
          (c) =>
            c.name.toLowerCase() === initialCity.toLowerCase() ||
            c.slug === initialCity.toLowerCase(),
        ) || null
      );
    }
    return null;
  });

  const [gpsStatus, setGpsStatus] = useState<"idle" | "requesting" | "denied" | "success">("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      setGpsError("Geolocation is not supported by your browser. Please choose manually.");
      return;
    }

    setGpsStatus("requesting");
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsStatus("success");

        // Find nearest supported city using simple euclidean distance
        let nearestCity: CityInfo | null = null;
        let nearestState: StateInfo | null = null;
        let minDistance = Infinity;

        for (const state of AUTHORITATIVE_LOCATIONS) {
          for (const city of state.cities) {
            const dist = Math.hypot(city.lat - latitude, city.lng - longitude);
            if (dist < minDistance) {
              minDistance = dist;
              nearestCity = city;
              nearestState = state;
            }
          }
        }

        if (nearestCity && nearestState) {
          setSelectedState(nearestState);
          setSelectedCity(nearestCity);
          onSelectLocation(nearestState.name, nearestCity.name, {
            lat: latitude,
            lng: longitude,
          });
        }
      },
      (error) => {
        setGpsStatus("denied");
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError("Location access was denied. You can easily pick your State & City below.");
        } else {
          setGpsError("Unable to retrieve device location. Please pick your State & City below.");
        }
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  };

  const handleStateClick = (state: StateInfo) => {
    setSelectedState(state);
    setSelectedCity(null);
  };

  const handleCityClick = (city: CityInfo) => {
    if (!selectedState) return;
    setSelectedCity(city);
    onSelectLocation(selectedState.name, city.name, {
      lat: city.lat,
      lng: city.lng,
    });
  };

  return (
    <div className="w-full rounded-3xl border border-border/80 bg-gradient-to-b from-card to-background p-6 sm:p-8 shadow-sm">
      {/* Header Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Direct Owner Marketplace
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Where are you looking?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select your State and City to discover 100% verified, 0% brokerage direct-owner
            properties.
          </p>
        </div>

        {/* GPS Quick Action */}
        <div className="flex flex-col sm:items-end gap-1.5">
          <button
            type="button"
            onClick={handleUseGps}
            disabled={gpsStatus === "requesting"}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {gpsStatus === "requesting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Detecting location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4" />
                Use Device GPS (Nearby)
              </>
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-muted-foreground hover:text-foreground font-medium underline underline-offset-4"
            >
              Keep Current Location
            </button>
          )}
        </div>
      </div>

      {/* GPS Error / Recovery Alert */}
      {gpsStatus === "denied" && gpsError && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 flex-none mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="font-semibold">{gpsError}</p>
            <p className="mt-0.5 text-amber-700/80 dark:text-amber-400/80">
              Choose your State and City below to continue uninterrupted.
            </p>
          </div>
        </div>
      )}

      {/* Step 1: State Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
              1
            </span>
            Select Operating State
          </h3>
          {selectedState && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> {selectedState.name} Selected
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {AUTHORITATIVE_LOCATIONS.map((state) => {
            const isSelected = selectedState?.id === state.id;
            return (
              <button
                key={state.id}
                type="button"
                onClick={() => handleStateClick(state)}
                className={`group relative flex flex-col justify-between rounded-2xl overflow-hidden text-left transition-all cursor-pointer border ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/80"
                    : "border-border/80 bg-card hover:border-emerald-500/50 hover:shadow-sm"
                }`}
              >
                {/* State Landmark Photo Banner */}
                <div className="relative h-20 w-full overflow-hidden bg-muted">
                  <img
                    src={state.imageUrl}
                    alt={`${state.name} landmark`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <span
                    className={`absolute top-2 left-2 inline-flex items-center justify-center rounded-md text-[10px] font-extrabold px-1.5 py-0.5 shadow-sm ${
                      isSelected
                        ? "bg-emerald-600 text-white"
                        : "bg-black/60 text-white backdrop-blur-xs border border-white/20"
                    }`}
                  >
                    {state.shortCode}
                  </span>
                  <span className="absolute bottom-1.5 left-2 right-2 text-[10px] font-semibold text-white/90 truncate drop-shadow-xs">
                    {state.landmark}
                  </span>
                </div>

                <div className="p-3 w-full">
                  <h4 className="font-bold text-sm text-foreground leading-tight">{state.name}</h4>
                  <div className="mt-2 flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                    <span>{state.cities.length} cities</span>
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-transform ${
                        isSelected
                          ? "translate-x-1 text-emerald-600"
                          : "group-hover:translate-x-0.5"
                      }`}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: City Cards (Revealed when State is selected) */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                selectedState ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </span>
            {selectedState
              ? `Explore Cities in ${selectedState.name}`
              : "Choose City (Select State First)"}
          </h3>
          {selectedCity && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> {selectedCity.name} Confirmed
            </span>
          )}
        </div>

        {!selectedState ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-secondary/20 p-8 text-center">
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">City selection is gated</p>
            <p className="text-xs text-muted-foreground mt-1">
              Please tap one of the operating States above to unlock supported cities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedState.cities.map((city) => {
              const isSelected = selectedCity?.slug === city.slug;
              return (
                <button
                  key={city.slug}
                  type="button"
                  onClick={() => handleCityClick(city)}
                  className={`group flex items-start justify-between rounded-2xl p-4 text-left transition-all cursor-pointer border ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500"
                      : "border-border/80 bg-card hover:border-emerald-500/50 hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-secondary text-muted-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-600"
                      }`}
                    >
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground truncate">{city.name}</h4>
                        {city.isMetro && (
                          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-extrabold text-muted-foreground">
                            Metro
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {city.popularLocalities.slice(0, 3).join(", ")}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-border/80 text-transparent group-hover:border-emerald-500"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
