/**
 * Aggregates for the admin analytics view.
 *
 * Read with the service role, because RLS deliberately scopes the tracking
 * tables to their owner — an admin is not entitled to read one person's
 * browsing history through the client, and these queries never expose one. Every
 * figure returned here is a count or an average across many rows.
 *
 * If the tracking migration has not been applied, this reports `available:
 * false` rather than throwing, so the dashboard can say so honestly instead of
 * rendering zeroes that look like real measurements.
 *
 * The window is caller-selected (Today / 3 days / Week / Month). Alongside the
 * totals it returns a per-bucket time series — hourly for a single day, daily
 * otherwise — so the dashboard can draw real trends for searches, listings, and
 * enquiries rather than a single number.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

async function adminDb(): Promise<SupabaseClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient;
}

export interface TopProperty {
  propertyId: string;
  views: number;
}

export interface TopSearch {
  city: string;
  searches: number;
}

/** One point on the activity timeline (an hour, or a day). */
export interface ActivityBucket {
  label: string;
  views: number;
  searches: number;
  enquiries: number;
  listings: number;
}

export interface ActivityAnalytics {
  /** False when migration 20260817120000 has not been applied here. */
  available: boolean;
  windowDays: number;
  /** "hour" when the window is a single day, otherwise "day". */
  bucket: "hour" | "day";
  totalViews: number;
  totalSearches: number;
  signedInViews: number;
  anonymousViews: number;
  averageSecondsOnPage: number | null;
  deviceSplit: { mobile: number; tablet: number; desktop: number };
  topProperties: TopProperty[];
  topCities: TopSearch[];
  /** Enquiries in the same window, so views can be read against outcomes. */
  enquiries: number;
  /** New listings created in the same window. */
  newListings: number;
  /** Views / searches / enquiries / listings per time bucket, oldest first. */
  timeSeries: ActivityBucket[];
}

const EMPTY: ActivityAnalytics = {
  available: false,
  windowDays: 7,
  bucket: "day",
  totalViews: 0,
  totalSearches: 0,
  signedInViews: 0,
  anonymousViews: 0,
  averageSecondsOnPage: null,
  deviceSplit: { mobile: 0, tablet: 0, desktop: 0 },
  topProperties: [],
  topCities: [],
  enquiries: 0,
  newListings: 0,
  timeSeries: [],
};

interface ViewRow {
  user_id: string | null;
  property_id: string;
  time_spent: number | null;
  device: "mobile" | "tablet" | "desktop" | null;
  viewed_at: string | null;
}

/**
 * IST wall-clock labels without any Intl/timezone-data dependency: shift the
 * timestamp by +5:30 and read the UTC fields. Robust across the Node and edge
 * runtimes this can be deployed to.
 */
const IST_OFFSET_MS = 5.5 * 3_600_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function bucketLabel(ms: number, hourly: boolean): string {
  const d = new Date(ms + IST_OFFSET_MS);
  if (hourly) {
    const raw = d.getUTCHours();
    const h = raw % 12 || 12;
    return `${h} ${raw < 12 ? "AM" : "PM"}`;
  }
  return `${d.getUTCDate().toString().padStart(2, "0")} ${MONTHS[d.getUTCMonth()]}`;
}

/**
 * Builds the empty timeline for the window and a fast index lookup that maps a
 * row timestamp onto its bucket (or -1 when outside the window / unparseable).
 */
function buildTimeline(windowDays: number, startMs: number) {
  const hourly = windowDays <= 1;
  const bucketMs = hourly ? 3_600_000 : 86_400_000;
  const count = hourly ? 24 : windowDays;

  const buckets: ActivityBucket[] = [];
  for (let i = 0; i < count; i++) {
    buckets.push({
      label: bucketLabel(startMs + i * bucketMs, hourly),
      views: 0,
      searches: 0,
      enquiries: 0,
      listings: 0,
    });
  }

  const indexFor = (iso: string | null): number => {
    if (!iso) return -1;
    const ms = Date.parse(iso);
    if (Number.isNaN(ms)) return -1;
    const idx = Math.floor((ms - startMs) / bucketMs);
    return idx < 0 || idx >= count ? -1 : idx;
  };

  return { buckets, indexFor, kind: hourly ? ("hour" as const) : ("day" as const) };
}

export async function loadActivityAnalytics(windowDays = 7): Promise<ActivityAnalytics> {
  const db = await adminDb();
  const startMs = Date.now() - windowDays * 86_400_000;
  const since = new Date(startMs).toISOString();

  const viewsRes = await db
    .from("property_views")
    .select("user_id, property_id, time_spent, device, viewed_at")
    .gte("viewed_at", since)
    .limit(50_000);

  if (viewsRes.error) {
    if (isMissingTable(viewsRes.error))
      return { ...EMPTY, windowDays, bucket: windowDays <= 1 ? "hour" : "day" };
    throw new Error(viewsRes.error.message);
  }

  const views = (viewsRes.data ?? []) as ViewRow[];

  const searchesRes = await db
    .from("search_history")
    .select("city, searched_at")
    .gte("searched_at", since)
    .limit(50_000);
  const searches = searchesRes.error
    ? []
    : ((searchesRes.data ?? []) as { city: string | null; searched_at: string | null }[]);

  // Enquiries and new listings live in always-present tables; both are read as
  // timestamps (not head-counts) so they can feed the timeline as well as totals.
  const enquiriesRes = await db
    .from("enquiries")
    .select("created_at")
    .gte("created_at", since)
    .limit(50_000);
  const enquiryRows = enquiriesRes.error
    ? []
    : ((enquiriesRes.data ?? []) as { created_at: string | null }[]);

  const listingsRes = await db
    .from("properties")
    .select("created_at")
    .gte("created_at", since)
    .limit(50_000);
  const listingRows = listingsRes.error
    ? []
    : ((listingsRes.data ?? []) as { created_at: string | null }[]);

  const { buckets, indexFor, kind } = buildTimeline(windowDays, startMs);

  const byProperty = new Map<string, number>();
  const deviceSplit = { mobile: 0, tablet: 0, desktop: 0 };
  let signedIn = 0;
  let durationTotal = 0;
  let durationSamples = 0;

  for (const v of views) {
    byProperty.set(v.property_id, (byProperty.get(v.property_id) ?? 0) + 1);
    if (v.user_id) signedIn += 1;
    if (v.device && v.device in deviceSplit) deviceSplit[v.device] += 1;
    if (typeof v.time_spent === "number") {
      durationTotal += v.time_spent;
      durationSamples += 1;
    }
    const bi = indexFor(v.viewed_at);
    if (bi >= 0) buckets[bi].views += 1;
  }

  const byCity = new Map<string, number>();
  for (const s of searches) {
    if (s.city) byCity.set(s.city, (byCity.get(s.city) ?? 0) + 1);
    const bi = indexFor(s.searched_at);
    if (bi >= 0) buckets[bi].searches += 1;
  }

  for (const e of enquiryRows) {
    const bi = indexFor(e.created_at);
    if (bi >= 0) buckets[bi].enquiries += 1;
  }

  for (const l of listingRows) {
    const bi = indexFor(l.created_at);
    if (bi >= 0) buckets[bi].listings += 1;
  }

  const rank = <T>(m: Map<string, number>, make: (k: string, n: number) => T): T[] =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k, n]) => make(k, n));

  return {
    available: true,
    windowDays,
    bucket: kind,
    totalViews: views.length,
    totalSearches: searches.length,
    signedInViews: signedIn,
    anonymousViews: views.length - signedIn,
    averageSecondsOnPage: durationSamples > 0 ? Math.round(durationTotal / durationSamples) : null,
    deviceSplit,
    topProperties: rank(byProperty, (propertyId, viewsCount) => ({
      propertyId,
      views: viewsCount,
    })),
    topCities: rank(byCity, (city, searchCount) => ({ city, searches: searchCount })),
    enquiries: enquiryRows.length,
    newListings: listingRows.length,
    timeSeries: buckets,
  };
}
