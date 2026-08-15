import { supabase } from "@/integrations/supabase/client";

export interface LocalityStats {
  locality: string;
  count: number;
}

/**
 * Fetch counts of approved properties per locality for a given city.
 * Excludes localities that are null or empty.
 */
export async function getLocalityStats(city: string): Promise<LocalityStats[]> {
  try {
    // In a real production app with massive data, this might be a materialized view or RPC.
    // For now, we query the table directly (PostgREST doesn't support GROUP BY natively
    // unless using RPC, so we either need to fetch all and group client-side, or use an RPC).

    const { data, error } = await supabase
      .from("properties")
      .select("locality")
      .eq("city", city)
      .eq("is_approved", true)
      .not("locality", "is", null);

    if (error) {
      console.error("[localityStats] error:", error);
      return [];
    }

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      if (row.locality && row.locality.trim() !== "") {
        const loc = row.locality.trim();
        counts[loc] = (counts[loc] || 0) + 1;
      }
    }

    const stats = Object.entries(counts)
      .map(([locality, count]) => ({ locality, count }))
      .sort((a, b) => b.count - a.count); // highest count first

    return stats;
  } catch (err) {
    console.error("[localityStats] unreachable:", err);
    return [];
  }
}
