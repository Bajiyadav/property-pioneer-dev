import { useState, useEffect } from "react";
import { MapPin, Loader2, Lock, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { LIVE_CITIES } from "@/config/platform";
import { fetchAvailableLocalities } from "@/modules/property/services/propertyService";

/**
 * Location-gated reveal of a property's EXACT address + landmark.
 *
 * The coarse location (locality, city) is public and shown immediately for SEO
 * and browsing. The exact street address/landmark are never shipped with the
 * public payload; they come from the server-authoritative endpoint
 * (/api/public/properties/$id/location) only after the visitor SELECTS a
 * city + locality — from our existing data, not free text — that matches this
 * property's area. The server owns the decision; this only collects the choice.
 *
 * We never ask for the visitor's name or any profile detail here — this step is
 * purely a location selection.
 */

const NO_PROPERTIES = "No properties are currently available in this location.";

type RevealState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "revealed"; address: string | null; landmark: string | null }
  | { kind: "no_properties" }
  | { kind: "needs_city" }
  | { kind: "needs_locality" }
  | { kind: "error" };

export function PropertyLocationReveal({
  property,
}: {
  property: { id: string; city: string; locality?: string | null };
}) {
  const coarse = property.locality ? `${property.locality}, ${property.city}` : property.city;

  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [localities, setLocalities] = useState<string[]>([]);
  const [loadingLocalities, setLoadingLocalities] = useState(false);
  const [state, setState] = useState<RevealState>({ kind: "idle" });

  // When a city is chosen, load the localities that actually have listings there
  // (from our data) so the visitor selects rather than types.
  useEffect(() => {
    let cancelled = false;
    setLocality("");
    setLocalities([]);
    if (!city) return;
    setLoadingLocalities(true);
    fetchAvailableLocalities(city)
      .then((list) => {
        if (cancelled) return;
        setLocalities(list);
        setState(list.length === 0 ? { kind: "no_properties" } : { kind: "idle" });
      })
      .finally(() => {
        if (!cancelled) setLoadingLocalities(false);
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

  const submit = async () => {
    if (!city) {
      setState({ kind: "needs_city" });
      return;
    }
    if (localities.length > 0 && !locality) {
      setState({ kind: "needs_locality" });
      return;
    }
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/public/properties/${property.id}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, locality }),
      });
      const data = (await res.json()) as {
        status: string;
        address?: string | null;
        landmark?: string | null;
      };
      switch (data.status) {
        case "ok":
          setState({
            kind: "revealed",
            address: data.address ?? null,
            landmark: data.landmark ?? null,
          });
          break;
        case "locality_required":
          setState({ kind: "needs_locality" });
          break;
        case "city_required":
          setState({ kind: "needs_city" });
          break;
        // A valid but non-matching / unrecognised location means this property
        // is not there — the required "no properties" message.
        case "invalid_location":
        case "mismatch":
        case "not_found":
          setState({ kind: "no_properties" });
          break;
        case "rate_limited":
          toast.error("Too many location lookups. Please try again shortly.");
          setState({ kind: "idle" });
          break;
        default:
          setState({ kind: "error" });
      }
    } catch {
      setState({ kind: "error" });
    }
  };

  return (
    <section
      aria-labelledby="exact-location-heading"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <h2 id="exact-location-heading" className="flex items-center gap-2 text-base font-semibold">
        <MapPin className="h-4 w-4 flex-none text-primary" aria-hidden="true" />
        Location
      </h2>

      {/* Coarse location is always visible (public, SEO-safe). */}
      <p className="mt-1 text-sm text-muted-foreground">{coarse}</p>

      {state.kind === "revealed" ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            <Navigation className="h-3.5 w-3.5" aria-hidden="true" /> Exact address
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {state.address || "Exact address not recorded for this listing."}
          </p>
          {state.landmark && (
            <p className="mt-1 text-sm text-muted-foreground">Landmark: {state.landmark}</p>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
            Select your city and locality to view the exact address.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">City</span>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="City"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a city…</option>
                {LIVE_CITIES.map((c) => (
                  <option key={c.slug} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium">Locality</span>
              <select
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                aria-label="Locality"
                disabled={!city || loadingLocalities || localities.length === 0}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                <option value="">
                  {loadingLocalities
                    ? "Loading localities…"
                    : !city
                      ? "Select a city first"
                      : localities.length === 0
                        ? "No localities available"
                        : "Select a locality…"}
                </option>
                {localities.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {state.kind === "needs_city" && (
            <p className="mt-2 text-sm text-amber-600">Please select a city first.</p>
          )}
          {state.kind === "needs_locality" && (
            <p className="mt-2 text-sm text-amber-600">Please select a locality.</p>
          )}
          {state.kind === "no_properties" && (
            <p className="mt-2 text-sm text-amber-600">{NO_PROPERTIES}</p>
          )}
          {state.kind === "error" && (
            <p className="mt-2 text-sm text-destructive">Something went wrong. Please try again.</p>
          )}

          <Button
            className="mt-4 w-full rounded-xl sm:w-auto"
            onClick={submit}
            disabled={state.kind === "loading" || !city || localities.length === 0}
          >
            {state.kind === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking location…
              </>
            ) : (
              "Show exact address"
            )}
          </Button>
        </div>
      )}
    </section>
  );
}
