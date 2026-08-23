import { useMemo, useState } from "react";
import { MapPin, Search, ChevronDown, X, Check } from "lucide-react";
import { LIVE_CITIES } from "@/config/platform";
import { locationLabel, type LocationValue } from "./locationValue";

/**
 * The ONE canonical location selector for search.
 *
 * The homepage previously offered three separate ways to pick a location (a city
 * dropdown in the search box, quick-chips in the hero, and city cards), each
 * wiring itself to /properties independently. This is the single source of
 * truth: it holds { city, locality } and every other affordance (chips, cards)
 * becomes a shortcut that sets THIS state rather than a competing selector.
 *
 * SCOPE, deliberately matched to the data: properties carry city + locality only
 * (no state/district column; the /properties route validates just `city` and
 * `q`). Cities are grouped by their real state from config for readability, but
 * there is no fabricated State→District→City→Locality cascade over a dataset
 * that does not support one. Locality is optional free text mapped to `q`.
 *
 * Selection is owned by the parent (URL-backed on /properties), so Back/Forward,
 * refresh, and shareable URLs all work through the existing route search params —
 * this component adds no second location parameter.
 */

interface Props {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  className?: string;
}

export function SearchLocationSelector({ value, onChange, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [locality, setLocality] = useState(value.locality);

  const grouped = useMemo(() => {
    const t = term.trim().toLowerCase();
    const cities = LIVE_CITIES.filter(
      (c) => !t || c.name.toLowerCase().includes(t) || c.state.toLowerCase().includes(t),
    );
    const byState = new Map<string, typeof cities>();
    for (const c of cities) {
      const arr = byState.get(c.state) ?? [];
      arr.push(c);
      byState.set(c.state, arr);
    }
    return [...byState.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [term]);

  const commit = (city: string) => {
    onChange({ city, locality: locality.trim() });
    setOpen(false);
    setTerm("");
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-left text-sm font-medium transition-colors hover:border-primary/40"
      >
        <MapPin className="h-4 w-4 flex-none text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{locationLabel(value)}</span>
        <ChevronDown className="h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close location selector"
            className="fixed inset-0 z-40 cursor-default bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Select location"
            className="absolute z-50 mt-2 max-h-[70vh] w-full min-w-[280px] overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold">Select location</span>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder="Search city or state"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Search city or state"
                />
              </div>
            </div>

            <div className="max-h-[46vh] overflow-y-auto p-2">
              <button
                type="button"
                onClick={() => commit("")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-secondary"
              >
                <span className="font-medium">All India</span>
                {!value.city && <Check className="h-4 w-4 text-primary" />}
              </button>

              {grouped.map(([state, cities]) => (
                <div key={state} className="mt-2">
                  <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {state}
                  </p>
                  {cities.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => commit(c.name)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-secondary"
                    >
                      <span>{c.name}</span>
                      {value.city === c.name && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              ))}

              {grouped.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No matching city. Try &ldquo;All India&rdquo;.
                </p>
              )}
            </div>

            <div className="border-t border-border p-3">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Locality / landmark (optional)
              </label>
              <input
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. Gachibowli, Cyber Towers"
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                aria-label="Locality or landmark"
              />
              <button
                type="button"
                onClick={() => commit(value.city)}
                className="mt-2 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Apply
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
