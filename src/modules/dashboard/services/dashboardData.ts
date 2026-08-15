import { STORAGE_KEYS } from "@/config/storage";
/**
 * Client-side dashboard stores.
 *
 * Recent searches live in localStorage rather than Postgres: there is no
 * `search_history` table, and persisting query strings server-side would be a
 * privacy decision the product hasn't made yet. Every accessor is SSR-safe and
 * fails closed to an empty list.
 */

const MAX_RECENT_SEARCHES = 8;

export interface RecentSearch {
  id: string;
  q: string;
  city: string;
  listing: string;
  minPrice: number;
  maxPrice: number;
  beds: number;
  at: number;
}

function isRecentSearch(value: unknown): value is RecentSearch {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.q === "string" &&
    typeof v.city === "string" &&
    typeof v.listing === "string" &&
    typeof v.minPrice === "number" &&
    typeof v.maxPrice === "number" &&
    typeof v.beds === "number"
  );
}

export function readRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.RECENT_SEARCH);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentSearch).slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

/** Records a search, de-duplicating on the filter combination. */
export function recordRecentSearch(
  entry: Omit<RecentSearch, "id" | "at">,
  now: number = Date.now(),
): void {
  if (typeof window === "undefined") return;
  // An empty search carries no intent worth remembering.
  if (!entry.q && !entry.city && !entry.listing && !entry.beds) return;

  try {
    const signature = `${entry.q}|${entry.city}|${entry.listing}|${entry.minPrice}|${entry.maxPrice}|${entry.beds}`;
    const existing = readRecentSearches().filter(
      (s) => `${s.q}|${s.city}|${s.listing}|${s.minPrice}|${s.maxPrice}|${s.beds}` !== signature,
    );
    const next: RecentSearch[] = [{ ...entry, id: signature, at: now }, ...existing].slice(
      0,
      MAX_RECENT_SEARCHES,
    );
    window.localStorage.setItem(STORAGE_KEYS.RECENT_SEARCH, JSON.stringify(next));
  } catch {
    // Storage full or blocked — recent searches are a convenience, not critical.
  }
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCH);
  } catch {
    // ignore
  }
}

/* ─────────────────────────── derived analytics helpers ───────────────────── */

/** Groups listings into a label/value series, largest first. */
export function countBy<T>(items: T[], key: (item: T) => string, limit = 6) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item) || "Unknown";
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/** Short "3 days ago" style label. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

/** Deterministic pseudo-random series so charts stay stable across renders. */
export function seededSeries(labels: string[], seed: number, min: number, max: number) {
  let state = seed;
  return labels.map((label) => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const t = state / 4294967296;
    return { label, value: Math.round(min + t * (max - min)) };
  });
}
