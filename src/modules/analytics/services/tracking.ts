/**
 * Customer activity tracking.
 *
 * Three rules, in order of precedence:
 *
 *  1. No consent, no collection. Every entry point checks `hasAnalyticsConsent()`
 *     first and returns `"no-consent"` without touching the network.
 *  2. Tracking never breaks the page. Every call is fire-and-forget and every
 *     failure is swallowed — a analytics outage must not stop someone viewing a
 *     property.
 *  3. It degrades to a no-op if the tables are not there. Migration
 *     20260817120000 may not be applied yet; the first 42P01 latches collection
 *     off for the session instead of retrying on every view. When the migration
 *     lands, a fresh page load starts recording with no code change.
 *
 * What is deliberately NOT recorded: IP address, any device or browser
 * fingerprint, referrer chains, or a durable anonymous visitor id. A signed-out
 * row carries no identifier at all, so it cannot later be re-linked to a person.
 */
import { supabase } from "@/integrations/supabase/client";
import { hasAnalyticsConsent } from "@/modules/legal/services/consent";

/**
 * `types.ts` is generated from the live schema, which does not yet have these
 * tables — so the typed client rejects them at compile time even though the SQL
 * is committed. Rather than hand-edit a generated file, the untyped surface is
 * confined to this one helper, and the row shapes are declared here so call
 * sites stay checked. Regenerating types after the migration lands makes this
 * cast redundant; the call sites do not change.
 */
interface PropertyViewRow {
  user_id: string | null;
  property_id: string;
  time_spent: number | null;
  device: "mobile" | "tablet" | "desktop";
}

interface SearchHistoryRow {
  user_id: string | null;
  query: string | null;
  city: string | null;
  locality: string | null;
  listing: "rent" | "sale" | null;
  filters: Record<string, unknown>;
  result_count: number | null;
}

type PendingTable = "property_views" | "search_history";

function insertPending<T>(table: PendingTable, row: T) {
  const client = supabase as unknown as {
    from: (t: string) => { insert: (r: T) => PromiseLike<{ error: { code?: string } | null }> };
  };
  return client.from(table).insert(row);
}

export type TrackResult = "recorded" | "no-consent" | "unavailable" | "failed";

/** PostgreSQL `undefined_table` — the migration has not been applied here. */
const UNDEFINED_TABLE = "42P01";

let tablesAvailable: boolean | null = null;
let warned = false;

function markUnavailable(table: string) {
  tablesAvailable = false;
  if (!warned) {
    warned = true;
    console.warn(
      `[tracking] ${table} is absent — activity tracking is off until migration 20260817120000 is applied`,
    );
  }
}

/** Test seam. */
export function __resetTrackingProbe() {
  tablesAvailable = null;
  warned = false;
}

export function trackingTablesAvailable(): boolean | null {
  return tablesAvailable;
}

/** Coarse form factor. Buckets only — never a fingerprint. */
export function deviceBucket(width?: number): "mobile" | "tablet" | "desktop" {
  const w = width ?? (typeof window !== "undefined" ? window.innerWidth : 1280);
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}

export interface PropertyViewInput {
  propertyId: string;
  /** Seconds spent on the page, if known. */
  timeSpent?: number;
}

export async function trackPropertyView(input: PropertyViewInput): Promise<TrackResult> {
  if (!hasAnalyticsConsent()) return "no-consent";
  if (tablesAvailable === false) return "unavailable";

  try {
    const { error } = await insertPending<PropertyViewRow>("property_views", {
      user_id: await currentUserId(),
      property_id: input.propertyId,
      time_spent:
        typeof input.timeSpent === "number"
          ? Math.max(0, Math.min(86400, Math.round(input.timeSpent)))
          : null,
      device: deviceBucket(),
    });

    if (error) {
      if (error.code === UNDEFINED_TABLE) {
        markUnavailable("property_views");
        return "unavailable";
      }
      return "failed";
    }
    tablesAvailable = true;
    return "recorded";
  } catch {
    return "failed";
  }
}

export interface SearchInput {
  query?: string;
  city?: string;
  locality?: string;
  listing?: "rent" | "sale";
  filters?: Record<string, unknown>;
  resultCount?: number;
}

export async function trackSearch(input: SearchInput): Promise<TrackResult> {
  if (!hasAnalyticsConsent()) return "no-consent";
  if (tablesAvailable === false) return "unavailable";

  try {
    const { error } = await insertPending<SearchHistoryRow>("search_history", {
      user_id: await currentUserId(),
      query: input.query?.slice(0, 200) || null,
      city: input.city || null,
      locality: input.locality || null,
      listing: input.listing ?? null,
      filters: input.filters ?? {},
      result_count: typeof input.resultCount === "number" ? Math.max(0, input.resultCount) : null,
    });

    if (error) {
      if (error.code === UNDEFINED_TABLE) {
        markUnavailable("search_history");
        return "unavailable";
      }
      return "failed";
    }
    tablesAvailable = true;
    return "recorded";
  } catch {
    return "failed";
  }
}

/**
 * Times how long a property page was open and files one view on the way out.
 *
 * Returns a disposer for a `useEffect` cleanup. One row per visit, recorded at
 * the end so `time_spent` is real rather than guessed.
 */
export function beginPropertyViewTimer(propertyId: string): () => void {
  if (!hasAnalyticsConsent()) return () => {};
  const startedAt = Date.now();
  let done = false;

  const flush = () => {
    if (done) return;
    done = true;
    void trackPropertyView({
      propertyId,
      timeSpent: Math.round((Date.now() - startedAt) / 1000),
    });
  };

  // `pagehide` fires on tab close and bfcache navigation, which `unmount` alone
  // would miss.
  if (typeof window !== "undefined") window.addEventListener("pagehide", flush);

  return () => {
    if (typeof window !== "undefined") window.removeEventListener("pagehide", flush);
    flush();
  };
}
