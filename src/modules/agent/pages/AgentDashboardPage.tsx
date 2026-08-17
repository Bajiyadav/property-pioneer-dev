import { Link } from "@tanstack/react-router";
import { useDashboardTab } from "@/modules/dashboard/hooks/useDashboardTab";
import type { User } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  Banknote,
  Bell,
  Building2,
  CalendarCheck,
  Compass,
  FileBarChart,
  LayoutDashboard,
  MapPin,
  Phone,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  fetchPropertyFeed,
  formatPrice,
  type Property,
} from "@/modules/property/services/propertyQueries";
import { fetchLiveActivities, fetchVisitSchedules } from "@/lib/leadRouting";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout, type NavItem } from "@/modules/dashboard/components/DashboardLayout";
import { RequireRole } from "@/modules/dashboard/components/RequireRole";
import {
  ActivityTimeline,
  CardSkeleton,
  DataTable,
  SampleDataNotice,
  EmptyState,
  ErrorState,
  FilterChips,
  KpiCard,
  LoadingSkeleton,
  QuickActions,
  SearchInput,
  SectionHeader,
  StatusPill,
  type TimelineItem,
} from "@/modules/dashboard/components/DashboardKit";
import {
  DualLineChart,
  FunnelBars,
  TrendAreaChart,
} from "@/modules/dashboard/components/DashboardCharts";
import { displayName } from "@/modules/authentication/services/session";
import { seededSeries, relativeTime } from "@/modules/dashboard/services/dashboardData";
import {
  Lead,
  Client,
  LEADS,
  CLIENTS,
  VISITS,
  COMMISSIONS,
  NOTIFICATIONS,
  FUNNEL,
} from "@/modules/agent/fixtures";

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "territory_leads", label: "Territory Leads & Visitors", icon: Activity },
  { id: "assigned", label: "Territory Listings", icon: Building2 },
  { id: "visits", label: "Customer Visit Schedules", icon: CalendarCheck },
  { id: "clients", label: "Clients", icon: Users },
  { id: "commission", label: "Commission", icon: Banknote },
  { id: "reports", label: "Reports", icon: FileBarChart },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const SEARCH_PARAMS = {
  q: "",
  city: "Hyderabad",
  listing: "rent",
  minPrice: 0,
  maxPrice: 0,
  beds: 0,
} as const;

import { PropertyMediaModal } from "@/modules/admin/components/PropertyMediaModal";

export function AgentDashboardPage() {
  return (
    <RequireRole role="agent">{(session) => <AgentDashboard user={session.user} />}</RequireRole>
  );
}

function AgentDashboard({ user }: { user: User | null }) {
  const [activeTab, setActiveTab] = useDashboardTab("/dashboard/agent");
  const [mediaModalProperty, setMediaModalProperty] = useState<Property | null>(null);

  const [leadQuery, setLeadQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const {
    data: feed,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["property-feed"],
    queryFn: fetchPropertyFeed,
    staleTime: 5 * 60 * 1000,
  });

  const properties = useMemo(() => feed?.properties ?? [], [feed]);
  const isSampleData = feed?.source === "fallback";
  const assigned = useMemo(() => properties.slice(0, 6), [properties]);

  const filteredLeads = useMemo(() => {
    const q = leadQuery.trim().toLowerCase();
    return LEADS.filter((l) => {
      if (stageFilter !== "all" && l.stage.toLowerCase() !== stageFilter) return false;
      if (!q) return true;
      return `${l.name} ${l.requirement} ${l.phone}`.toLowerCase().includes(q);
    });
  }, [leadQuery, stageFilter]);

  const paidCommission = COMMISSIONS.filter((c) => c.status === "Paid").reduce(
    (s, c) => s + c.amount,
    0,
  );
  const pipelineValue = COMMISSIONS.filter((c) => c.status !== "Paid").reduce(
    (s, c) => s + c.amount,
    0,
  );

  const leadTrend = useMemo(
    () => seededSeries(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], 77, 3, 14),
    [],
  );
  const revenueSeries = useMemo(
    () =>
      ["Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((label, i) => ({
        label,
        a: 40000 + i * 12000,
        b: 55000 + i * 9000,
      })),
    [],
  );

  const queryClient = useQueryClient();

  const { data: agentProfile } = useQuery({
    queryKey: ["agent", "profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("assigned_localities, phone, full_name, city")
        .eq("id", user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: Boolean(user?.id),
  });

  const assignedLocalities: string[] = useMemo(() => {
    if (agentProfile?.assigned_localities?.length) {
      return agentProfile.assigned_localities;
    }
    return ["Kukatpally"];
  }, [agentProfile]);

  const { data: territoryActivities = [], refetch: refetchActivities } = useQuery({
    queryKey: ["agent", "live_activities", assignedLocalities],
    queryFn: async () => {
      const activities = await fetchLiveActivities("all");
      return activities.filter((a: any) =>
        assignedLocalities.some(
          (loc) => loc.toLowerCase() === (a.locality || "kukatpally").toLowerCase(),
        ),
      );
    },
    refetchInterval: 8000,
  });

  const { data: territoryVisits = [], refetch: refetchVisits } = useQuery({
    queryKey: ["agent", "visit_schedules", assignedLocalities],
    queryFn: async () => {
      const visits = await fetchVisitSchedules("all");
      return visits.filter((v: any) =>
        assignedLocalities.some(
          (loc) => loc.toLowerCase() === (v.locality || "kukatpally").toLowerCase(),
        ),
      );
    },
    refetchInterval: 8000,
  });

  const visitStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("visit_schedules")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["agent", "visit_schedules"] });
      toast.success(`Visit request updated to ${vars.status}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update visit request");
    },
  });

  const tabTitle: Record<string, string> = {
    overview: "Territory Command Center",
    territory_leads: "Territory Leads & Visitors",
    assigned: "Territory Properties",
    clients: "Client Directory",
    visits: "Customer Visit Schedules",
    commission: "Commission Tracker",
    reports: "Performance Reports",
    notifications: "Notifications",
  };

  return (
    <DashboardLayout
      role="agent"
      title={
        activeTab === "overview"
          ? `Welcome back, ${displayName(user)}`
          : (tabTitle[activeTab] ?? "Agent")
      }
      subtitle={`Assigned Micro-Markets: ${assignedLocalities.join(", ")}`}
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user}
      headerAction={
        <button
          onClick={() => setActiveTab("territory_leads")}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 cursor-pointer"
        >
          <Activity className="h-3.5 w-3.5" /> Territory Live Feed ({territoryActivities.length})
        </button>
      }
    >
      {activeTab === "overview" && (
        <div className="space-y-8">
          {isSampleData && <SampleDataNotice reason={feed?.error} />}

          {isLoading ? (
            <CardSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <KpiCard
                label="Open leads"
                numericValue={LEADS.filter((l) => l.stage !== "Closed").length}
                icon={<Target className="h-4 w-4" />}
                accent="blue"
                trend={{ direction: "up", label: "+2 today" }}
              />
              <KpiCard
                label="Active clients"
                numericValue={CLIENTS.length}
                icon={<Users className="h-4 w-4" />}
                accent="purple"
              />
              <KpiCard
                label="Visits this week"
                numericValue={VISITS.length}
                icon={<CalendarCheck className="h-4 w-4" />}
                accent="emerald"
              />
              <KpiCard
                label="Commission earned"
                value={`₹${paidCommission.toLocaleString("en-IN")}`}
                icon={<Banknote className="h-4 w-4" />}
                accent="amber"
                trend={{ direction: "up", label: "This quarter" }}
              />
            </div>
          )}

          <div>
            <SectionHeader title="Quick actions" />
            <QuickActions
              actions={[
                {
                  id: "leads",
                  label: "Lead pipeline",
                  hint: `${LEADS.length} in play`,
                  icon: <Target className="h-4 w-4" />,
                  onClick: () => setActiveTab("leads"),
                },
                {
                  id: "visits",
                  label: "Today's visits",
                  hint: `${VISITS.length} scheduled`,
                  icon: <CalendarCheck className="h-4 w-4" />,
                  onClick: () => setActiveTab("visits"),
                },
                {
                  id: "clients",
                  label: "Client CRM",
                  hint: `${CLIENTS.length} active`,
                  icon: <Users className="h-4 w-4" />,
                  onClick: () => setActiveTab("clients"),
                },
                {
                  id: "commission",
                  label: "Commission",
                  hint: `₹${pipelineValue.toLocaleString("en-IN")} pending`,
                  icon: <Banknote className="h-4 w-4" />,
                  onClick: () => setActiveTab("commission"),
                },
              ]}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <FunnelBars
              title="Lead funnel"
              subtitle="Conversion across pipeline stages"
              stages={FUNNEL}
            />
            <TrendAreaChart
              title="New leads this week"
              subtitle="Inbound across all channels"
              data={leadTrend}
              valueName="Leads"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionHeader
                title="Hot leads"
                action={
                  <button
                    onClick={() => setActiveTab("leads")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    View pipeline <ArrowRight className="h-3 w-3" />
                  </button>
                }
              />
              <LeadTable leads={LEADS.slice(0, 3)} />
            </div>
            <div className="rounded-3xl border border-border/60 bg-card p-5">
              <SectionHeader title="Recent activity" />
              <ActivityTimeline items={NOTIFICATIONS} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "territory_leads" && (
        <div className="space-y-6">
          <SectionHeader
            title={`Territory Leads & Visitor Activity (${territoryActivities.length})`}
            subtitle={`Real-time stream of inquiries, searches, and listing drafts in your assigned micro-markets: ${assignedLocalities.join(", ")}`}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              label="Assigned Localities"
              value={assignedLocalities.join(", ")}
              icon={<MapPin className="h-4 w-4" />}
              accent="blue"
            />
            <KpiCard
              label="Live Territory Inquiries"
              numericValue={territoryActivities.length}
              icon={<Activity className="h-4 w-4" />}
              accent="emerald"
            />
            <KpiCard
              label="Scheduled Territory Visits"
              numericValue={territoryVisits.length}
              icon={<CalendarCheck className="h-4 w-4" />}
              accent="purple"
            />
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" /> Live Visitor Stream for {assignedLocalities.join(", ")}
              </h3>
              <button
                onClick={() => refetchActivities()}
                className="text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                Refresh Feed
              </button>
            </div>

            {territoryActivities.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-6 w-6" />}
                title="No live leads in your territory yet"
                hint={`Customer activities in ${assignedLocalities.join(", ")} will appear here automatically.`}
              />
            ) : (
              <div className="space-y-3">
                {territoryActivities.map((act: any) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-2xl bg-secondary/40 border border-border/60 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground capitalize flex items-center gap-1.5 text-sm">
                        <Compass className="h-4 w-4 text-emerald-500" /> {act.activity_type.replace("_", " ")}
                      </span>
                      <div className="flex items-center gap-1">
                        <StatusPill label={act.locality || "Kukatpally"} tone="success" />
                        <StatusPill label="New Territory Lead" tone="warning" />
                      </div>
                    </div>
                    {act.search_query && (
                      <p className="text-foreground font-semibold bg-background/60 p-2 rounded-xl border border-border/40">
                        Interested Area / Query: {act.search_query}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-between text-muted-foreground pt-1 border-t border-border/40 gap-2">
                      <span>Customer Name: <strong className="text-foreground">{act.contact_name || "Guest Visitor"}</strong></span>
                      <span>Phone: <strong className="text-foreground">{act.contact_phone || "+91 98765 43210"}</strong></span>
                      <span>{relativeTime(act.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "leads" && (
        <div className="space-y-5">
          <SectionHeader
            title={`Lead pipeline (${filteredLeads.length})`}
            subtitle="Every enquiry assigned to you, newest first"
            action={
              <SearchInput value={leadQuery} onChange={setLeadQuery} placeholder="Search leads…" />
            }
          />
          <FilterChips
            active={stageFilter}
            onChange={setStageFilter}
            options={[
              { id: "all", label: "All stages" },
              { id: "new", label: "New" },
              { id: "contacted", label: "Contacted" },
              { id: "visited", label: "Visited" },
              { id: "negotiation", label: "Negotiation" },
              { id: "closed", label: "Closed" },
            ]}
          />
          <LeadTable leads={filteredLeads} />
        </div>
      )}

      {activeTab === "assigned" && (
        <div className="space-y-5">
          <SectionHeader
            title={`Assigned properties (${assigned.length})`}
            subtitle="Listings you represent"
          />
          {isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : assigned.length === 0 ? (
            <EmptyState
              icon={<Building2 className="h-6 w-6" />}
              title="No assigned properties"
              hint="Listings allocated to you will appear here."
            />
          ) : (
            <DataTable
              rows={assigned}
              getKey={(p) => p.id}
              columns={[
                {
                  key: "title",
                  header: "Property",
                  render: (p: Property) => (
                    <Link
                      to="/properties/$id"
                      params={{ id: p.id }}
                      search={SEARCH_PARAMS}
                      className="font-bold text-foreground hover:text-primary"
                    >
                      {p.title}
                    </Link>
                  ),
                },
                {
                  key: "city",
                  header: "City",
                  render: (p: Property) => <span className="text-muted-foreground">{p.city}</span>,
                },
                {
                  key: "config",
                  header: "Config",
                  render: (p: Property) => (
                    <span className="text-muted-foreground">{p.bedrooms} BHK</span>
                  ),
                },
                {
                  key: "price",
                  header: "Price",
                  render: (p: Property) => (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(p.price, p.listing_type)}
                    </span>
                  ),
                },
                {
                  key: "media",
                  header: "Media Moderation",
                  render: (p: Property) => {
                    const mStatus = (p as any).media_status || "pending_review";
                    return (
                      <StatusPill
                        label={mStatus === "verified" ? "Media Verified" : mStatus === "needs_reshoot" ? "Re-Shoot Req" : "Pending Review"}
                        tone={mStatus === "verified" ? "success" : mStatus === "needs_reshoot" ? "danger" : "warning"}
                      />
                    );
                  },
                },
                {
                  key: "status",
                  header: "Status",
                  render: () => <StatusPill label="Active" tone="success" />,
                },
                {
                  key: "action",
                  header: "Media",
                  className: "text-right",
                  render: (p: Property) => (
                    <button
                      onClick={() => setMediaModalProperty(p)}
                      className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition cursor-pointer"
                    >
                      Manage Media
                    </button>
                  ),
                },
              ]}
            />
          )}
        </div>
      )}

      {activeTab === "clients" && (
        <div className="space-y-5">
          <SectionHeader
            title={`Clients (${CLIENTS.length})`}
            subtitle="People you're actively representing"
          />
          <DataTable
            rows={CLIENTS}
            getKey={(c) => c.id}
            empty={
              <EmptyState
                icon={<Users className="h-6 w-6" />}
                title="No clients yet"
                hint="Convert a lead and they'll appear here."
              />
            }
            columns={[
              {
                key: "name",
                header: "Client",
                render: (c: Client) => (
                  <div>
                    <p className="font-bold text-foreground">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.phone}</p>
                  </div>
                ),
              },
              {
                key: "req",
                header: "Requirement",
                render: (c: Client) => (
                  <span className="text-muted-foreground">{c.requirement}</span>
                ),
              },
              {
                key: "since",
                header: "Client since",
                render: (c: Client) => <span className="text-muted-foreground">{c.since}</span>,
              },
              {
                key: "value",
                header: "Deal value",
                render: (c: Client) => <span className="font-bold text-foreground">{c.value}</span>,
              },
              {
                key: "call",
                header: "",
                className: "text-right",
                render: (c: Client) => (
                  <a
                    href={`tel:${c.phone.replace(/\s/g, "")}`}
                    aria-label={`Call ${c.name}`}
                    className="inline-flex rounded-xl bg-emerald-600 p-2 text-white transition hover:bg-emerald-500"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                ),
              },
            ]}
          />
        </div>
      )}

      {activeTab === "visits" && (
        <div className="space-y-5">
          <SectionHeader
            title={`Territory Customer Visit Schedules (${territoryVisits.length || VISITS.length})`}
            subtitle={`In-person and video walkthrough visit appointments for ${assignedLocalities.join(", ")}`}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(territoryVisits.length > 0 ? territoryVisits : VISITS.map((v) => ({
              id: v.id,
              visit_type: "in_person",
              customer_name: v.client,
              customer_phone: "98765 43210",
              properties: { title: v.property },
              preferred_date: v.when,
              preferred_slot: "Morning",
              locality: assignedLocalities[0] || "Kukatpally",
              status: v.status.toLowerCase(),
            }))).map((v: any) => (
              <div key={v.id} className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                    {v.visit_type === "video_call" ? "📹 Video Tour" : "🏠 In-Person Visit"}
                  </span>
                  <StatusPill
                    label={v.status}
                    tone={v.status === "confirmed" ? "success" : v.status === "completed" ? "info" : "warning"}
                  />
                </div>

                <div>
                  <p className="text-sm font-bold text-foreground">{v.customer_name}</p>
                  <p className="text-xs text-muted-foreground font-medium">{v.customer_phone}</p>
                </div>

                <div className="p-2.5 rounded-2xl bg-secondary/50 border border-border/50 text-xs">
                  <p className="font-semibold text-foreground truncate">{v.properties?.title || "Property Listing"}</p>
                  <p className="text-primary font-bold mt-0.5">{v.locality}</p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground pt-1 border-t border-border/40">
                  <CalendarCheck className="h-3.5 w-3.5 text-emerald-500" /> {v.preferred_date} ({v.preferred_slot || "Morning"})
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    disabled={visitStatusMutation.isPending || v.status === "confirmed"}
                    onClick={() => visitStatusMutation.mutate({ id: v.id, status: "confirmed" })}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500 disabled:opacity-40 transition cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    disabled={visitStatusMutation.isPending || v.status === "completed"}
                    onClick={() => visitStatusMutation.mutate({ id: v.id, status: "completed" })}
                    className="flex-1 py-2 rounded-xl bg-secondary border border-border text-foreground font-bold text-[11px] hover:bg-secondary/80 disabled:opacity-40 transition cursor-pointer"
                  >
                    Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mediaModalProperty && (
        <PropertyMediaModal
          isOpen={Boolean(mediaModalProperty)}
          onClose={() => setMediaModalProperty(null)}
          property={mediaModalProperty}
          userRole="agent"
        />
      )}

      {activeTab === "commission" && (
        <div className="space-y-6">
          <SectionHeader title="Commission tracker" subtitle="Earnings and pending payouts" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <KpiCard
              label="Paid out"
              value={`₹${paidCommission.toLocaleString("en-IN")}`}
              icon={<Banknote className="h-4 w-4" />}
              accent="emerald"
            />
            <KpiCard
              label="In pipeline"
              value={`₹${pipelineValue.toLocaleString("en-IN")}`}
              icon={<TrendingUp className="h-4 w-4" />}
              accent="amber"
            />
            <KpiCard
              label="Deals closed"
              numericValue={COMMISSIONS.filter((c) => c.status === "Paid").length}
              icon={<Target className="h-4 w-4" />}
              accent="blue"
            />
          </div>
          <DataTable
            rows={COMMISSIONS}
            getKey={(c) => c.id}
            columns={[
              {
                key: "client",
                header: "Client",
                render: (c) => <span className="font-bold text-foreground">{c.client}</span>,
              },
              {
                key: "property",
                header: "Property",
                render: (c) => <span className="text-muted-foreground">{c.property}</span>,
              },
              {
                key: "amount",
                header: "Commission",
                render: (c) => (
                  <span className="font-bold text-foreground">
                    ₹{c.amount.toLocaleString("en-IN")}
                  </span>
                ),
              },
              {
                key: "date",
                header: "Payout date",
                render: (c) => <span className="text-muted-foreground">{c.date}</span>,
              },
              {
                key: "status",
                header: "Status",
                className: "text-right",
                render: (c) => (
                  <StatusPill
                    label={c.status}
                    tone={
                      c.status === "Paid"
                        ? "success"
                        : c.status === "Processing"
                          ? "info"
                          : "warning"
                    }
                  />
                ),
              },
            ]}
          />
          <button
            onClick={() => toast.success("Payout request submitted to finance")}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow transition hover:bg-emerald-500"
          >
            Request bank payout
          </button>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-6">
          <SectionHeader title="Performance reports" subtitle="How your pipeline is trending" />
          <div className="grid gap-6 lg:grid-cols-2">
            <DualLineChart
              title="Revenue vs. target"
              subtitle="Monthly commission, ₹"
              data={revenueSeries}
              seriesA="Achieved"
              seriesB="Target"
            />
            <FunnelBars title="Conversion funnel" subtitle="Quarter to date" stages={FUNNEL} />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard
              label="Lead→visit rate"
              value="43.8%"
              icon={<Target className="h-4 w-4" />}
              accent="blue"
              trend={{ direction: "up", label: "+5.1%" }}
            />
            <KpiCard
              label="Visit→close rate"
              value="28.6%"
              icon={<TrendingUp className="h-4 w-4" />}
              accent="emerald"
            />
            <KpiCard
              label="Avg deal size"
              value="₹31,600"
              icon={<Banknote className="h-4 w-4" />}
              accent="purple"
            />
            <KpiCard
              label="Avg days to close"
              numericValue={24}
              icon={<CalendarCheck className="h-4 w-4" />}
              accent="amber"
              trend={{ direction: "down", label: "3 days faster" }}
            />
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="space-y-5">
          <SectionHeader
            title="Notifications"
            subtitle="Lead assignments, payouts, and visit reminders"
          />
          <div className="rounded-3xl border border-border/60 bg-card p-6">
            <ActivityTimeline items={NOTIFICATIONS} />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function LeadTable({ leads }: { leads: Lead[] }) {
  const tone = (stage: Lead["stage"]) =>
    stage === "Closed"
      ? "success"
      : stage === "New"
        ? "warning"
        : stage === "Negotiation"
          ? "info"
          : "neutral";

  return (
    <DataTable
      rows={leads}
      getKey={(l) => l.id}
      empty={
        <EmptyState
          icon={<Target className="h-6 w-6" />}
          title="No leads match"
          hint="Try a different stage filter or search term."
        />
      }
      columns={[
        {
          key: "name",
          header: "Lead",
          render: (l: Lead) => (
            <div>
              <p className="font-bold text-foreground">{l.name}</p>
              <p className="text-[11px] text-muted-foreground">{l.phone}</p>
            </div>
          ),
        },
        {
          key: "req",
          header: "Requirement",
          render: (l: Lead) => <span className="text-muted-foreground">{l.requirement}</span>,
        },
        {
          key: "budget",
          header: "Budget",
          render: (l: Lead) => <span className="font-semibold text-foreground">{l.budget}</span>,
        },
        {
          key: "source",
          header: "Source",
          render: (l: Lead) => <span className="text-muted-foreground">{l.source}</span>,
        },
        {
          key: "stage",
          header: "Stage",
          className: "text-right",
          render: (l: Lead) => <StatusPill label={l.stage} tone={tone(l.stage)} />,
        },
      ]}
    />
  );
}
