import { useMemo, useState, type ReactNode } from "react";
import { MapPin } from "lucide-react";
import { LIVE_CITIES, STATES } from "@/config/platform";

interface LocationGateProps {
  /** The state already chosen, if any. */
  selectedState: string;
  /** The city already chosen, if any. */
  selectedCity: string;
  /** Called once both a state and a city have been picked. */
  onConfirm: (state: string, city: string) => void;
  children: ReactNode;
}

/**
 * Asks a visitor for their state and city before revealing the homepage.
 *
 * Built on the static STATES / LIVE_CITIES config rather than the Geoapify
 * autocomplete on purpose. This gate is the only way into the site, so a
 * missing API key, a rate limit or an outage at the geocoding provider would
 * otherwise lock every visitor out of the whole homepage.
 *
 * It reads and writes the same state/city the homepage already keeps in
 * sessionStorage, so there is one source of truth rather than a second
 * location system running alongside the search box.
 */
export function LocationGate({
  selectedState,
  selectedCity,
  onConfirm,
  children,
}: LocationGateProps) {
  const [draftState, setDraftState] = useState(selectedState);
  const [draftCity, setDraftCity] = useState(selectedCity);

  const citiesForState = useMemo(
    () => LIVE_CITIES.filter((c) => c.state === draftState),
    [draftState],
  );

  if (selectedState && selectedCity) {
    return <>{children}</>;
  }

  const canContinue = Boolean(draftState && draftCity);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-border p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <MapPin className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Where are you looking?</h2>
          <p className="text-muted-foreground text-sm">
            Choose your state and city to see verified direct-owner properties, with 0% brokerage.
          </p>
        </div>

        <div className="space-y-3 text-left">
          <div>
            <label
              htmlFor="gate-state"
              className="mb-1.5 block text-xs font-semibold text-muted-foreground"
            >
              State
            </label>
            <select
              id="gate-state"
              value={draftState}
              onChange={(e) => {
                setDraftState(e.target.value);
                // The chosen city belongs to the previous state, so it cannot
                // survive the change.
                setDraftCity("");
              }}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Select State</option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="gate-city"
              className="mb-1.5 block text-xs font-semibold text-muted-foreground"
            >
              City
            </label>
            <select
              id="gate-city"
              value={draftCity}
              disabled={!draftState}
              onChange={(e) => setDraftCity(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary disabled:opacity-60"
            >
              <option value="">{draftState ? "Select City" : "Select state first"}</option>
              {citiesForState.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {draftState && citiesForState.length === 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                We are not live in {draftState} yet. Pick another state to continue.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={!canContinue}
          onClick={() => onConfirm(draftState, draftCity)}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
