/**
 * Server-only admin data helpers. Every function here assumes the caller has
 * already been verified as an admin by the calling server function.
 */

export interface AdminOverview {
  totalProperties: number;
  approvedProperties: number;
  pendingProperties: number;
  featuredProperties: number;
  forRent: number;
  forSale: number;
  totalEnquiries: number;
  enquiriesLast7Days: number;
  cities: Array<{ city: string; count: number }>;
}

export async function loadOverview(): Promise<AdminOverview> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Optimized counting queries
  const weekAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalProps },
    { count: approvedProps },
    { count: featuredProps },
    { count: rentProps },
    { count: saleProps },
    { count: totalEnq },
    { count: recentEnq },
    { data: cityData },
  ] = await Promise.all([
    supabaseAdmin.from("properties").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", true),
    supabaseAdmin
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("is_featured", true),
    supabaseAdmin
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("listing_type", "rent"),
    supabaseAdmin
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("listing_type", "sale"),
    supabaseAdmin.from("enquiries").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("enquiries")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgoStr),
    // For cities, if there are many properties, it is best to use a view or RPC.
    // For now we will fetch only the city column to minimize payload.
    supabaseAdmin.from("properties").select("city"),
  ]);

  const rows = cityData ?? [];
  const cityMap = new Map<string, number>();
  for (const row of rows) cityMap.set(row.city, (cityMap.get(row.city) ?? 0) + 1);

  return {
    totalProperties: totalProps || 0,
    approvedProperties: approvedProps || 0,
    pendingProperties: (totalProps || 0) - (approvedProps || 0),
    featuredProperties: featuredProps || 0,
    forRent: rentProps || 0,
    forSale: saleProps || 0,
    totalEnquiries: totalEnq || 0,
    enquiriesLast7Days: recentEnq || 0,
    cities: [...cityMap.entries()]
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  };
}

export async function loadProperties() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("properties")
    .select(
      "id, title, city, price, listing_type, status, is_approved, is_featured, owner_name, owner_phone, created_at, video_url, video_status",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function loadEnquiries() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("enquiries")
    .select("id, name, phone, message, created_at, property_id, properties(title, city)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  // The embedded `properties(...)` relation is not reflected in the generated
  // row type, so narrow it explicitly instead of casting the whole row.
  type JoinedProperty = { title?: string | null; city?: string | null } | null;
  return (data ?? []).map((row) => {
    const property = (row as { properties?: JoinedProperty }).properties ?? null;
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      message: row.message,
      createdAt: row.created_at,
      propertyId: row.property_id,
      propertyTitle: property?.title ?? "Unknown listing",
      propertyCity: property?.city ?? "—",
    };
  });
}

export async function loadAuditLogs() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select("id, event, outcome, subject_type, subject_id, ip_address, details, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function applyPropertyUpdate(
  id: string,
  patch: {
    is_approved?: boolean;
    is_featured?: boolean;
    status?: "available" | "rented" | "sold";
    video_status?: "pending" | "approved" | "rejected";
  },
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("properties").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
