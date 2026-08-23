import { useState } from "react";
import { MapPin, Loader2, Lock, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { SearchLocationSelector } from "@/shared/components/location/SearchLocationSelector";
import type { LocationValue } from "@/shared/components/location/locationValue";

/**
 * Location-gated reveal of a property's EXACT address + landmark.
 *
 * The coarse location (locality, city) is public and shown here immediately for
 * SEO and browsing. The exact street address/landmark are never shipped with the
 * public payload; they are fetched from the server-authoritative endpoint
 * (/api/public/properties/$id/location) only after the visitor commits a
 * city + locality that matches this property's area. The server owns the
 * decision — this component only collects the location and reflects the result.
 */

type RevealState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "revealed"; address: string | null; landmark: string | null }
  | { kind: "city_required" }
  | { kind: "locality_required"; city: string }
  | { kind: "invalid" }
  | { kind: "mismatch"; expectedCity?: string }
  | { kind: "error" };

export function PropertyLocationReveal({
  property,
}: {
  property: { id: string; city: string; locality?: string | null };
}) {
  const coarse = property.locality ? `${property.locality}, ${property.city}` : property.city;
  const [loc, setLoc] = useState<LocationValue>({ city: "", locality: "" });
  const [state, setState] = useState<RevealState>({ kind: "idle" });

  const submit = async () => {
    if (!loc.city.trim()) {
      setState({ kind: "city_required" });
      return;
    }
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/public/properties/${property.id}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: loc.city, locality: loc.locality }),
      });
      const data = (await res.json()) as {
        status: string;
        address?: string | null;
        landmark?: string | null;
        expectedCity?: string;
      };
      switch (data.status) {
        case "ok":
          setState({
            kind: "revealed",
            address: data.address ?? null,
            landmark: data.landmark ?? null,
          });
          break;
        case "city_required":
          setState({ kind: "city_required" });
          break;
        case "locality_required":
          setState({ kind: "locality_required", city: data.expectedCity || loc.city });
          break;
        case "invalid_location":
          setState({ kind: "invalid" });
          break;
        case "mismatch":
          setState({ kind: "mismatch", expectedCity: data.expectedCity });
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

          <div className="mt-3">
            <SearchLocationSelector value={loc} onChange={setLoc} />
          </div>

          {/* Feedback for the current attempt. */}
          {state.kind === "city_required" && (
            <p className="mt-2 text-sm text-amber-600">Please select a city first.</p>
          )}
          {state.kind === "locality_required" && (
            <p className="mt-2 text-sm text-amber-600">
              Enter the locality within {state.city} to view the exact address.
            </p>
          )}
          {state.kind === "invalid" && (
            <p className="mt-2 text-sm text-amber-600">
              That location isn&apos;t recognised. Please select a valid city.
            </p>
          )}
          {state.kind === "mismatch" && (
            <p className="mt-2 text-sm text-amber-600">
              This property is in {state.expectedCity || property.city}. Select that city and its
              locality to view the exact address.
            </p>
          )}
          {state.kind === "error" && (
            <p className="mt-2 text-sm text-destructive">Something went wrong. Please try again.</p>
          )}

          <Button
            className="mt-4 w-full rounded-xl sm:w-auto"
            onClick={submit}
            disabled={state.kind === "loading"}
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
