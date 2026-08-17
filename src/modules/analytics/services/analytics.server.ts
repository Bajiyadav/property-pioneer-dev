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

export interface ActivityAnalytics {
  /** False when migration 20260817120000 has not been applied here. */
  available: boolean;
  windowDays: number;
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
}

const EMPTY: ActivityAnalytics = {
  available: false,
  windowDays: 30,
  totalViews: 0,
  totalSearches: 0,
  signedInViews: 0,
  anonymousViews: 0,
  averageSecondsOnPage: null,
  deviceSplit: { mobile: 0, tablet: 0, desktop: 0 },
  topProperties: [],
  topCities: [],
  enquiries: 0,
};

interface ViewRow {
  user_id: string | null;
  property_id: string;
  time_spent: number | null;
  device: "mobile" | "tablet" | "desktop" | null;
}

export async function loadActivityAnalytics(windowDays = 30): Promise<ActivityAnalytics> {
  const db = await adminDb();
  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString();

  const viewsRes = await db
    .from("property_views")
    .select("user_id, property_id, time_spent, device")
    .gte("viewed_at", since)
    .limit(50_000);

  if (viewsRes.error) {
    if (isMissingTable(viewsRes.error)) return { ...EMPTY, windowDays };
    throw new Error(viewsRes.error.message);
  }

  const views = (viewsRes.data ?? []) as ViewRow[];

  const searchesRes = await db
    .from("search_history")
    .select("city")
    .gte("searched_at", since)
    .limit(50_000);
  const searches = searchesRes.error ? [] : ((searchesRes.data ?? []) as { city: string | null }[]);

  const { count: enquiryCount } = await db
    .from("enquiries")
    .select("*", { count: "exact", head: true })
    .gte("created_at", since);

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
  }

  const byCity = new Map<string, number>();
  for (const s of searches) {
    if (!s.city) continue;
    byCity.set(s.city, (byCity.get(s.city) ?? 0) + 1);
  }

  const rank = <T>(m: Map<string, number>, make: (k: string, n: number) => T): T[] =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k, n]) => make(k, n));

  return {
    available: true,
    windowDays,
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
    enquiries: enquiryCount ?? 0,
  };
}
