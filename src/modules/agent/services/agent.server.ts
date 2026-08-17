/**
 * Server-only agent data.
 *
 * Every query here is scoped to the agent id taken from the verified JWT, never
 * from client input. These run with the service-role client, which bypasses RLS,
 * so the scoping in this file IS the access control — an unscoped query would
 * expose every agent's leads to every other agent.
 *
 * What this file deliberately does NOT provide is as important as what it does.
 * The agent dashboard previously rendered hardcoded arrays: named clients, visit
 * schedules, a conversion funnel, and commission records showing "₹22,000 Paid"
 * and "₹28,000 Processing". None of it came from the database. An agent reading
 * that screen would believe they had earned money that does not exist anywhere.
 *
 * The schema supports leads, visits and notifications, so those are now real.
 * It has no commission table and no lead-status column, so this file returns
 * nothing for them rather than inventing values — the dashboard shows an honest
 * empty state instead. See `agentCapabilities()`.
 */

async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export interface AgentLead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  locality: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  bedrooms: number | null;
  notes: string | null;
  createdAt: string;
}

export interface AgentVisit {
  id: string;
  propertyId: string;
  propertyTitle: string;
  visitorName: string;
  visitorPhone: string | null;
  preferredDate: string | null;
  preferredTimeSlot: string | null;
  status: string;
  createdAt: string;
}

export interface AgentNotification {
  id: string;
  title: string;
  body: string | null;
  kind: string | null;
  readAt: string | null;
  createdAt: string;
}

/**
 * What the current schema can actually answer.
 *
 * The dashboard reads this to decide between showing a section and showing an
 * explanation. It is not a feature flag for convenience — it is the difference
 * between an empty table and a fabricated one.
 */
export function agentCapabilities() {
  return {
    /** `agent_leads` has no status column, so a pipeline cannot be persisted. */
    leadPipeline: false,
    /** No commission table exists in the schema. */
    commissions: false,
  } as const;
}

export async function listAgentLeads(agentId: string): Promise<AgentLead[]> {
  const db = await adminDb();
  const { data, error } = await db
    .from("agent_leads")
    .select(
      "id,lead_name,lead_email,lead_phone,preferred_locality,budget_min,budget_max,bedrooms,notes,created_at",
    )
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.lead_name,
    email: r.lead_email,
    phone: r.lead_phone,
    locality: r.preferred_locality,
    budgetMin: r.budget_min,
    budgetMax: r.budget_max,
    bedrooms: r.bedrooms,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

/**
 * Visits assigned to this agent.
 *
 * Property titles are resolved in a second query keyed by the ids we already
 * hold, rather than a join, because `properties` restricts its column grants and
 * a nested select would drag the whole row through PostgREST.
 */
export async function listAgentVisits(agentId: string): Promise<AgentVisit[]> {
  const db = await adminDb();
  const { data, error } = await db
    .from("property_visits")
    .select(
      "id,property_id,visitor_name,visitor_phone,preferred_date,preferred_time_slot,status,created_at",
    )
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const propertyIds = [...new Set(rows.map((r) => r.property_id).filter(Boolean))];
  const titles = new Map<string, string>();
  if (propertyIds.length > 0) {
    const { data: props } = await db.from("properties").select("id,title").in("id", propertyIds);
    for (const p of props ?? []) titles.set(p.id, p.title);
  }

  return rows.map((r) => ({
    id: r.id,
    propertyId: r.property_id,
    propertyTitle: titles.get(r.property_id) ?? "Listing",
    visitorName: r.visitor_name,
    visitorPhone: r.visitor_phone,
    preferredDate: r.preferred_date,
    preferredTimeSlot: r.preferred_time_slot,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function listAgentNotifications(agentId: string): Promise<AgentNotification[]> {
  const db = await adminDb();
  const { data, error } = await db
    .from("notifications")
    .select("id,title,body,kind,read_at,created_at")
    .eq("user_id", agentId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    kind: n.kind,
    readAt: n.read_at,
    createdAt: n.created_at,
  }));
}

export interface AgentOverview {
  leads: AgentLead[];
  visits: AgentVisit[];
  notifications: AgentNotification[];
  capabilities: ReturnType<typeof agentCapabilities>;
}

/** One round trip for the dashboard's first paint. */
export async function getAgentOverview(agentId: string): Promise<AgentOverview> {
  const [leads, visits, notifications] = await Promise.all([
    listAgentLeads(agentId),
    listAgentVisits(agentId),
    listAgentNotifications(agentId),
  ]);
  return { leads, visits, notifications, capabilities: agentCapabilities() };
}
