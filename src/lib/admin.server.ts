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

  const [{ data: props }, { data: enquiries }] = await Promise.all([
    supabaseAdmin
      .from("properties")
      .select("city, is_approved, is_featured, listing_type"),
    supabaseAdmin.from("enquiries").select("created_at"),
  ]);

  const rows = props ?? [];
  const cityMap = new Map<string, number>();
  for (const row of rows) cityMap.set(row.city, (cityMap.get(row.city) ?? 0) + 1);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return {
    totalProperties: rows.length,
    approvedProperties: rows.filter((r) => r.is_approved).length,
    pendingProperties: rows.filter((r) => !r.is_approved).length,
    featuredProperties: rows.filter((r) => r.is_featured).length,
    forRent: rows.filter((r) => r.listing_type === "rent").length,
    forSale: rows.filter((r) => r.listing_type === "sale").length,
    totalEnquiries: (enquiries ?? []).length,
    enquiriesLast7Days: (enquiries ?? []).filter(
      (e) => new Date(e.created_at).getTime() >= weekAgo,
    ).length,
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
      "id, title, city, price, listing_type, status, is_approved, is_featured, owner_name, owner_phone, created_at",
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
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    message: row.message,
    createdAt: row.created_at,
    propertyId: row.property_id,
    propertyTitle: (row as any).properties?.title ?? "Unknown listing",
    propertyCity: (row as any).properties?.city ?? "—",
  }));
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
  },
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("properties").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}