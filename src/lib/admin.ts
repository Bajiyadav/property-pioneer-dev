import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface AdminOverviewStats {
  totalProperties: number;
  approvedProperties: number;
  pendingProperties: number;
  featuredProperties: number;
  forRent: number;
  forSale: number;
  totalEnquiries: number;
  enquiriesLast7Days: number;
  totalUsers: number;
  cities: { city: string; count: number }[];
}

/**
 * Loads admin overview stats using PostgreSQL COUNT operations and efficient aggregations.
 * Does not pull unbounded datasets into Node server memory.
 */
export async function loadOverview(
  supabase: SupabaseClient<Database>,
  regions?: string[],
): Promise<AdminOverviewStats> {
  const weekAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let qTotalProps = supabase.from("properties").select("*", { count: "exact", head: true });
  let qApprovedProps = supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("is_approved", true);
  let qFeaturedProps = supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("is_featured", true);
  let qRentProps = supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("listing_type", "rent");
  let qSaleProps = supabase
    .from("properties")
    .select("*", { count: "exact", head: true })
    .eq("listing_type", "sale");

  let qTotalEnq: any = supabase.from("enquiries").select("*", { count: "exact", head: true });
  let qRecentEnq: any = supabase
    .from("enquiries")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekAgoStr);

  let qCitySample = supabase.from("properties").select("city").limit(100);

  if (regions && regions.length > 0) {
    qTotalProps = qTotalProps.in("region", regions);
    qApprovedProps = qApprovedProps.in("region", regions);
    qFeaturedProps = qFeaturedProps.in("region", regions);
    qRentProps = qRentProps.in("region", regions);
    qSaleProps = qSaleProps.in("region", regions);

    // For enquiries, we must join on properties to filter by region
    qTotalEnq = supabase
      .from("enquiries")
      .select("*, properties!inner(region)", { count: "exact", head: true })
      .in("properties.region", regions);
    qRecentEnq = supabase
      .from("enquiries")
      .select("*, properties!inner(region)", { count: "exact", head: true })
      .gte("created_at", weekAgoStr)
      .in("properties.region", regions);

    qCitySample = qCitySample.in("region", regions);
  }

  const [
    { count: totalProps },
    { count: approvedProps },
    { count: featuredProps },
    { count: rentProps },
    { count: saleProps },
    { count: totalEnq },
    { count: recentEnq },
    { count: totalUsers },
    { data: citySample },
  ] = await Promise.all([
    qTotalProps,
    qApprovedProps,
    qFeaturedProps,
    qRentProps,
    qSaleProps,
    qTotalEnq,
    qRecentEnq,
    supabase.from("user_roles").select("*", { count: "exact", head: true }),
    qCitySample,
  ]);

  const cityCounts: Record<string, number> = {};
  for (const p of citySample || []) {
    if (!p.city) continue;
    cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
  }

  const cities = Object.entries(cityCounts)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalProperties: totalProps || 0,
    approvedProperties: approvedProps || 0,
    pendingProperties: Math.max(0, (totalProps || 0) - (approvedProps || 0)),
    featuredProperties: featuredProps || 0,
    forRent: rentProps || 0,
    forSale: saleProps || 0,
    totalEnquiries: totalEnq || 0,
    enquiriesLast7Days: recentEnq || 0,
    totalUsers: totalUsers || 0,
    cities,
  };
}
