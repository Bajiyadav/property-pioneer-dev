import { Link } from "@tanstack/react-router";
import { useDashboardTab } from "@/modules/dashboard/hooks/useDashboardTab";
import type { User } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Calendar,
  CalendarCheck,
  CheckSquare,
  Clock,
  Compass,
  DollarSign,
  Eye,
  FileBarChart,
  LayoutDashboard,
  MapPin,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  UsersRound,
  XCircle,
} from "lucide-react";
import {
  fetchPropertyFeed,
  formatPrice,
  type Property,
} from "@/modules/property/services/propertyQueries";
import { fetchLiveActivities, fetchVisitSchedules } from "@/lib/leadRouting";
import { HYDERABAD_LOCALITIES } from "@/lib/geolocation";
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
  CategoryBarChart,
  DonutChart,
  DualLineChart,
  TrendAreaChart,
} from "@/modules/dashboard/components/DashboardCharts";
import { countBy, relativeTime, seededSeries } from "@/modules/dashboard/services/dashboardData";
import { getAdminProperties, updateAdminProperty } from "@/modules/admin/services/adminFunctions";
import { displayName } from "@/modules/authentication/services/session";
import { PlatformUser, USERS, AUDIT, SEARCH_PARAMS } from "@/modules/admin/fixtures";
import { UserTable, PropertyTable } from "@/modules/admin/components/AdminDashboardParts";

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "live_tracking", label: "Live Visitor & Lead Tracking", icon: Activity },
  { id: "users", label: "Users", icon: Users },
  { id: "owners", label: "Owners", icon: UsersRound },
  { id: "agents", label: "Agents & Territory Scoping", icon: UserCheck },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "approvals", label: "Pending Approvals", icon: CheckSquare },
  { id: "verification", label: "Verification Queue", icon: ShieldCheck },
  { id: "applications", label: "Agent Applications", icon: UserCheck },
  { id: "reports", label: "Reports", icon: FileBarChart },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "audit", label: "Audit Logs", icon: ScrollText },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AdminDashboardPage() {
  return (
    <RequireRole role="admin">{(session) => <AdminDashboard user={session.user} />}</RequireRole>
  );
}

import { PropertyMediaModal } from "@/modules/admin/components/PropertyMediaModal";

function AdminDashboard({ user }: { user: User | null }) {
  const [activeTab, setActiveTab] = useDashboardTab("/dashboard/admin");

  const [userQuery, setUserQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [propertyQuery, setPropertyQuery] = useState("");
  const [selectedLocalityFilter, setSelectedLocalityFilter] = useState("all");
  const [assigningAgentId, setAssigningAgentId] = useState<string | null>(null);
  const [selectedLocalities, setSelectedLocalities] = useState<string[]>([]);

  const [mediaModalProperty, setMediaModalProperty] = useState<Property | null>(null);

  const { data: liveActivities = [], refetch: refetchActivities } = useQuery({
    queryKey: ["admin", "live_activities", selectedLocalityFilter],
    queryFn: () => fetchLiveActivities(selectedLocalityFilter),
    refetchInterval: 8000,
  });

  const { data: visitSchedules = [], refetch: refetchVisits } = useQuery({
    queryKey: ["admin", "visit_schedules", selectedLocalityFilter],
    queryFn: () => fetchVisitSchedules(selectedLocalityFilter),
    refetchInterval: 8000,
  });

  const { data: dbAgents = [], refetch: refetchDbAgents } = useQuery({
    queryKey: ["admin", "db_agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, city, assigned_localities, agent_status, agency_name");
      if (error) return [];
      return data || [];
    },
  });

  const saveAgentLocalities = async (agentId: string, localities: string[]) => {
    const { error } = await supabase
      .from("profiles")
      .update({ assigned_localities: localities, updated_at: new Date().toISOString() })
      .eq("id", agentId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Agent territory micro-markets updated successfully!");
      setAssigningAgentId(null);
      refetchDbAgents();
    }
  };

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

  // The public feed is filtered by RLS to `is_approved = true`, so it can never
  // contain anything awaiting moderation. The queue therefore reads through the
  // service-role server function, which sees unapproved rows too.
  const fetchAdminProperties = useServerFn(getAdminProperties);
  const { data: adminRows, isError: adminRowsError } = useQuery({
    queryKey: ["admin", "properties"],
    queryFn: () => fetchAdminProperties({}),
    retry: false,
  });

  // Moderation writes through the same RLS-bypassing server function the secure
  // portal uses. It requires SUPABASE_SERVICE_ROLE_KEY on the server — when that
  // is absent the mutation fails loudly rather than showing a false success.
  const updateProperty = useServerFn(updateAdminProperty);
  const queryClient = useQueryClient();

  const moderation = useMutation({
    mutationFn: (vars: {
      id: string;
      is_approved?: boolean;
      video_status?: "pending" | "approved" | "rejected";
    }) => updateProperty({ data: vars }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      queryClient.invalidateQueries({ queryKey: ["property-feed"] });
      if (vars.video_status) {
        toast.success(`Video tour ${vars.video_status}`);
      } else {
        toast.success(vars.is_approved ? "Listing approved and published" : "Listing rejected");
      }
    },
    onError: (err) =>
      toast.error(
        err instanceof Error && /environment variable/i.test(err.message)
          ? "Moderation is unavailable: SUPABASE_SERVICE_ROLE_KEY is not configured."
          : `Could not update the listing: ${err instanceof Error ? err.message : "unknown error"}`,
      ),
  });

  const moderate = (property: { id: string }, approved: boolean) =>
    moderation.mutate({ id: property.id, is_approved: approved });
  const moderateVideo = (property: { id: string }, status: "approved" | "rejected") =>
    moderation.mutate({ id: property.id, video_status: status });

  const properties = useMemo(() => feed?.properties ?? [], [feed]);
  const isSampleData = feed?.source === "fallback";

  const owners = USERS.filter((u) => u.role === "Owner");
  const agents = USERS.filter((u) => u.role === "Agent");
  /** Genuinely unapproved listings, straight from the service-role view. */
  const pendingApprovals = useMemo(
    () => (adminRows ?? []).filter((p) => !p.is_approved),
    [adminRows],
  );
  const pendingVideos = useMemo(
    () => (adminRows ?? []).filter((p) => p.video_url && p.video_status === "pending"),
    [adminRows],
  );
  const verificationQueue = useMemo(
    () => properties.filter((p) => p.property_verification_status !== "verified").slice(0, 4),
    [properties],
  );

  const { data: applications = [], refetch: refetchApps } = useQuery({
    queryKey: ["admin", "agent_applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("[agent_applications] Query:", error.message);
        return [];
      }
      return data || [];
    },
  });

  const appStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("agent_applications")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "agent_applications"] });
      toast.success(`Application marked as ${vars.status.replace("_", " ")}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update application status");
    },
  });

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    return USERS.filter((u) => {
      if (roleFilter !== "all" && u.role.toLowerCase() !== roleFilter) return false;
      if (!q) return true;
      return `${u.name} ${u.email}`.toLowerCase().includes(q);
    });
  }, [userQuery, roleFilter]);

  const filteredProperties = useMemo(() => {
    const q = propertyQuery.trim().toLowerCase();
    if (!q) return properties;
    return properties.filter((p) => `${p.title} ${p.city}`.toLowerCase().includes(q));
  }, [properties, propertyQuery]);

  const cityMix = useMemo(() => countBy(properties, (p) => p.city), [properties]);
  const typeMix = useMemo(() => countBy(properties, (p) => p.property_type), [properties]);
  const signupTrend = useMemo(
    () => seededSeries(["Mar", "Apr", "May", "Jun", "Jul", "Aug"], 1337, 40, 260),
    [],
  );
  const revenueSeries = useMemo(
    () =>
      ["Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((label, i) => ({
        label,
        a: 180000 + i * 42000,
        b: 220000 + i * 38000,
      })),
    [],
  );
  const grossRevenue = revenueSeries.reduce((s, r) => s + r.a, 0);

  const tabTitle: Record<string, string> = {
    overview: "Platform admin HQ",
    users: "User directory",
    owners: "Property owners",
    agents: "Partner agents",
    properties: "All properties",
    approvals: "Pending approvals",
    verification: "Verification queue",
    reports: "Platform reports",
    analytics: "Growth analytics",
    audit: "Audit logs",
    settings: "Platform settings",
  };

  return (
    <DashboardLayout
      role="admin"
      title={
        activeTab === "overview"
          ? `Welcome back, ${displayName(user)}`
          : (tabTitle[activeTab] ?? "Admin")
      }
      subtitle="Operations, approvals, verification, revenue, and security across the platform."
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user}
      headerAction={
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary/60 px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary"
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Secure portal
        </Link>
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
                label="Registered users"
                numericValue={USERS.length}
                icon={<Users className="h-4 w-4" />}
                accent="blue"
                trend={{ direction: "up", label: "+12% MoM" }}
              />
              <KpiCard
                label="Live listings"
                numericValue={properties.length}
                icon={<Building2 className="h-4 w-4" />}
                accent="emerald"
              />
              <KpiCard
                label="Pending approvals"
                numericValue={pendingApprovals.length}
                icon={<CheckSquare className="h-4 w-4" />}
                accent="amber"
                hint="Needs review"
              />
              <KpiCard
                label="Gross revenue"
                value={`₹${(grossRevenue / 100000).toFixed(1)}L`}
                icon={<DollarSign className="h-4 w-4" />}
                accent="purple"
                trend={{ direction: "up", label: "6-month total" }}
              />
            </div>
          )}

          <div>
            <SectionHeader title="Quick actions" />
            <QuickActions
              actions={[
                {
                  id: "approvals",
                  label: "Review approvals",
                  hint: `${pendingApprovals.length} waiting`,
                  icon: <CheckSquare className="h-4 w-4" />,
                  onClick: () => setActiveTab("approvals"),
                },
                {
                  id: "verification",
                  label: "Verification queue",
                  hint: `${verificationQueue.length} pending`,
                  icon: <ShieldCheck className="h-4 w-4" />,
                  onClick: () => setActiveTab("verification"),
                },
                {
                  id: "users",
                  label: "User directory",
                  hint: `${USERS.length} accounts`,
                  icon: <Users className="h-4 w-4" />,
                  onClick: () => setActiveTab("users"),
                },
                {
                  id: "audit",
                  label: "Audit logs",
                  hint: "Security events",
                  icon: <ScrollText className="h-4 w-4" />,
                  onClick: () => setActiveTab("audit"),
                },
              ]}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TrendAreaChart
              title="New signups"
              subtitle="Monthly account creation"
              data={signupTrend}
              valueName="Signups"
            />
            {cityMix.length > 0 ? (
              <DonutChart title="Coverage by city" subtitle="Live listings" data={cityMix} />
            ) : (
              <EmptyState
                title="No coverage data"
                hint="City breakdown appears once listings load."
              />
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionHeader
                title="Latest listings"
                action={
                  <button
                    onClick={() => setActiveTab("properties")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </button>
                }
              />
              <PropertyTable
                properties={properties.slice(0, 5)}
                isLoading={isLoading}
                isError={isError}
                onRetry={refetch}
                onManageMedia={(p) => setMediaModalProperty(p)}
                onTogglePromotion={(p, updates) => {
                  if (updates.is_featured !== undefined) (p as any).is_featured = updates.is_featured;
                  if (updates.promo_badge !== undefined) (p as any).promo_badge = updates.promo_badge;
                  if (updates.priority_rank !== undefined) (p as any).priority_rank = updates.priority_rank;
                  toast.success(`Updated promotion & ranking for "${p.title}"`);
                  refetch();
                }}
              />
            </div>
            <div className="rounded-3xl border border-border/60 bg-card p-5">
              <SectionHeader title="Security activity" />
              <ActivityTimeline items={AUDIT.slice(0, 4)} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "live_tracking" && (
        <div className="space-y-6">
          <SectionHeader
            title="Real-Time Lead & Visitor Tracking Engine"
            subtitle="Live activity stream of property searches, geolocation checks, listing drafts, and visit schedules across micro-markets."
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground mr-1">Filter Territory:</span>
            {["all", ...HYDERABAD_LOCALITIES.map((l) => l.name)].map((loc) => (
              <button
                key={loc}
                onClick={() => setSelectedLocalityFilter(loc)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  selectedLocalityFilter === loc
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {loc === "all" ? "All Micro-Markets" : loc}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              label="Live Activities"
              numericValue={liveActivities.length}
              icon={<Activity className="h-4 w-4" />}
              accent="blue"
            />
            <KpiCard
              label="Scheduled Visits"
              numericValue={visitSchedules.length}
              icon={<CalendarCheck className="h-4 w-4" />}
              accent="emerald"
            />
            <KpiCard
              label="Micro-Markets Monitored"
              numericValue={HYDERABAD_LOCALITIES.length}
              icon={<MapPin className="h-4 w-4" />}
              accent="purple"
            />
            <KpiCard
              label="Active Area Agents"
              numericValue={agents.length || 1}
              icon={<UserCheck className="h-4 w-4" />}
              accent="amber"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Activities Stream */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Visitor Activity Stream ({liveActivities.length})
                </h3>
                <button
                  onClick={() => refetchActivities()}
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              {liveActivities.length === 0 ? (
                <EmptyState
                  icon={<Activity className="h-6 w-6" />}
                  title="No live activities recorded"
                  hint="Visitor searches, geolocation checks, and property views will stream here in real time."
                />
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {liveActivities.map((act: any) => (
                    <div key={act.id} className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground capitalize flex items-center gap-1.5">
                          <Compass className="h-3.5 w-3.5 text-primary" /> {act.activity_type.replace("_", " ")}
                        </span>
                        <div className="flex items-center gap-1">
                          <StatusPill label={act.locality || "Hyderabad"} tone="info" />
                          <StatusPill label="New Lead" tone="warning" />
                        </div>
                      </div>
                      {act.search_query && (
                        <p className="text-foreground font-semibold bg-background/60 p-2 rounded-xl border border-border/40">
                          {act.search_query}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40 gap-2">
                        <span>Customer Name: <strong className="text-foreground">{act.contact_name || "Guest Visitor"}</strong></span>
                        <span>Phone: <strong className="text-foreground">{act.contact_phone || "+91 98765 43210"}</strong></span>
                        <span>{relativeTime(act.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scheduled Visit Requests */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-emerald-500" /> Scheduled Property Visits ({visitSchedules.length})
                </h3>
                <button
                  onClick={() => refetchVisits()}
                  className="text-xs text-emerald-600 font-semibold hover:underline cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              {visitSchedules.length === 0 ? (
                <EmptyState
                  icon={<CalendarCheck className="h-6 w-6" />}
                  title="No scheduled visits yet"
                  hint="Customer in-person & video tour requests will appear here."
                />
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {visitSchedules.map((vis: any) => (
                    <div key={vis.id} className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          {vis.visit_type === "video_call" ? "📹 Video Tour" : "🏠 In-Person Visit"}
                        </span>
                        <StatusPill
                          label={vis.status}
                          tone={vis.status === "confirmed" ? "success" : vis.status === "completed" ? "info" : "warning"}
                        />
                      </div>
                      <p className="font-semibold text-foreground">{vis.properties?.title || "Property Listing"}</p>
                      <p className="text-muted-foreground">
                        Date: <strong className="text-foreground">{vis.preferred_date}</strong> ({vis.preferred_slot})
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                        <span>Customer: <strong className="text-foreground">{vis.customer_name} ({vis.customer_phone})</strong></span>
                        <span className="font-bold text-primary">{vis.locality}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-5">
          <SectionHeader
            title={`User directory (${filteredUsers.length})`}
            subtitle="Every account on the platform"
            action={
              <SearchInput value={userQuery} onChange={setUserQuery} placeholder="Search users…" />
            }
          />
          <FilterChips
            active={roleFilter}
            onChange={setRoleFilter}
            options={[
              { id: "all", label: "All roles" },
              { id: "customer", label: "Customers" },
              { id: "owner", label: "Owners" },
              { id: "agent", label: "Agents" },
              { id: "admin", label: "Admins" },
            ]}
          />
          <UserTable users={filteredUsers} />
        </div>
      )}

      {activeTab === "owners" && (
        <div className="space-y-5">
          <SectionHeader
            title={`Property owners (${owners.length})`}
            subtitle="Accounts that publish listings"
          />
          <UserTable users={owners} />
        </div>
      )}

      {activeTab === "agents" && (
        <div className="space-y-6">
          <SectionHeader
            title="Partner Agents & Regional Zone Assignments"
            subtitle="Onboard, manage, and assign partner agents to specific territory micro-markets (Kukatpally, Gachibowli, Madhapur, etc.)."
          />

          <div className="space-y-4">
            {(dbAgents.length > 0 ? dbAgents : USERS.filter((u) => u.role === "Agent")).map((ag: any) => {
              const currentLocs: string[] = ag.assigned_localities || ["Kukatpally"];
              const isEditing = assigningAgentId === ag.id;

              return (
                <div
                  key={ag.id}
                  className="rounded-3xl border border-border/80 bg-card p-5 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary font-bold text-lg">
                        {ag.full_name ? ag.full_name[0] : "A"}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm">{ag.full_name || ag.name || "Area Agent"}</h4>
                        <p className="text-xs text-muted-foreground">{ag.email || ag.phone || "agent.qa@urbanproperties.in"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setAssigningAgentId(null);
                          } else {
                            setAssigningAgentId(ag.id);
                            setSelectedLocalities(currentLocs);
                          }
                        }}
                        className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-sm transition hover:bg-primary/90 cursor-pointer"
                      >
                        {isEditing ? "Cancel" : "Assign Micro-Markets"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40">
                    <span className="text-xs font-bold text-muted-foreground block mb-2">
                      Assigned Territories & Micro-Markets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentLocs.map((loc) => (
                        <span
                          key={loc}
                          className="px-3 py-1 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-full text-xs flex items-center gap-1 border border-emerald-600/20"
                        >
                          <MapPin className="h-3 w-3" /> {loc}
                        </span>
                      ))}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="p-4 rounded-2xl bg-secondary/50 border border-primary/30 space-y-3 mt-3">
                      <p className="text-xs font-bold text-foreground">Select Territory Micro-Markets for {ag.full_name || "Agent"}:</p>
                      <div className="flex flex-wrap gap-2">
                        {HYDERABAD_LOCALITIES.map((loc) => {
                          const active = selectedLocalities.includes(loc.name);
                          return (
                            <button
                              key={loc.name}
                              type="button"
                              onClick={() => {
                                if (active) {
                                  setSelectedLocalities(selectedLocalities.filter((l) => l !== loc.name));
                                } else {
                                  setSelectedLocalities([...selectedLocalities, loc.name]);
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                active
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-foreground border-border hover:border-primary/50"
                              }`}
                            >
                              {active ? "✓ " : "+ "}{loc.name}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setAssigningAgentId(null)}
                          className="px-3 py-1.5 bg-secondary text-foreground text-xs font-bold rounded-xl"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveAgentLocalities(ag.id, selectedLocalities)}
                          className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow hover:bg-emerald-500"
                        >
                          Save Assignment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "properties" && (
        <div className="space-y-5">
          <SectionHeader
            title={`All properties (${filteredProperties.length})`}
            subtitle="Every listing on the platform"
            action={
              <SearchInput
                value={propertyQuery}
                onChange={setPropertyQuery}
                placeholder="Search properties…"
              />
            }
          />
          <PropertyTable
            properties={filteredProperties}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />
        </div>
      )}

      {activeTab === "approvals" && (
        <div className="space-y-10">
          <div className="space-y-5">
            <SectionHeader
              title={`Listing Approvals (${pendingApprovals.length})`}
              subtitle="Listings awaiting moderator review"
            />
            {adminRowsError ? (
              <ErrorState
                title="Moderation queue unavailable"
                message="The admin listing feed could not be loaded. This needs SUPABASE_SERVICE_ROLE_KEY on the server and an admin role on your account."
                onRetry={() => queryClient.invalidateQueries({ queryKey: ["admin", "properties"] })}
              />
            ) : !adminRows ? (
              <LoadingSkeleton rows={3} />
            ) : pendingApprovals.length === 0 ? (
              <EmptyState
                icon={<CheckSquare className="h-6 w-6" />}
                title="Nothing to approve"
                hint="New submissions land here for review."
              />
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between gap-4 rounded-3xl border border-border/60 bg-card p-5 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-foreground">{p.title}</h3>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {p.city} · {formatPrice(p.price, p.listing_type)} · submitted{" "}
                        {relativeTime(p.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-none gap-2">
                      <button
                        disabled={moderation.isPending}
                        onClick={() => moderate(p, true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        <BadgeCheck className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        disabled={moderation.isPending}
                        onClick={() => moderate(p, false)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-[11px] font-bold text-foreground transition hover:bg-secondary disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <SectionHeader
              title={`Video Approvals (${pendingVideos.length})`}
              subtitle="Property videos awaiting moderator review"
            />
            {pendingVideos.length === 0 ? (
              <EmptyState
                icon={<CheckSquare className="h-6 w-6" />}
                title="No videos to approve"
                hint="New video submissions land here for review."
              />
            ) : (
              <div className="space-y-3">
                {pendingVideos.map((p) => (
                  <div
                    key={p.id + "_video"}
                    className="flex flex-col justify-between gap-4 rounded-3xl border border-border/60 bg-card p-5 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex gap-4 items-center">
                      <video
                        src={p.video_url || undefined}
                        className="h-20 w-32 object-cover rounded"
                        controls
                      />
                      <div>
                        <h3 className="truncate text-sm font-bold text-foreground">{p.title}</h3>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {p.city} · {formatPrice(p.price, p.listing_type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-none gap-2">
                      <button
                        disabled={moderation.isPending}
                        onClick={() => moderateVideo(p, "approved")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        <BadgeCheck className="h-3.5 w-3.5" /> Approve Video
                      </button>
                      <button
                        disabled={moderation.isPending}
                        onClick={() => moderateVideo(p, "rejected")}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-[11px] font-bold text-foreground transition hover:bg-secondary disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject Video
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "verification" && (
        <div className="space-y-5">
          <SectionHeader
            title={`Verification queue (${verificationQueue.length})`}
            subtitle="Owner identity and property document checks"
          />
          {isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : verificationQueue.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Queue is clear"
              hint="Every listing has completed verification."
            />
          ) : (
            <DataTable
              rows={verificationQueue}
              getKey={(p) => p.id}
              columns={[
                {
                  key: "title",
                  header: "Property",
                  render: (p: Property) => (
                    <span className="font-bold text-foreground">{p.title}</span>
                  ),
                },
                {
                  key: "city",
                  header: "City",
                  render: (p: Property) => <span className="text-muted-foreground">{p.city}</span>,
                },
                {
                  key: "owner",
                  header: "Owner ID",
                  render: (p: Property) => (
                    <StatusPill
                      label={p.id_verified ? "Verified" : "Pending"}
                      tone={p.id_verified ? "success" : "warning"}
                    />
                  ),
                },
                {
                  key: "prop",
                  header: "Documents",
                  render: (p: Property) => (
                    <StatusPill
                      label={p.property_verification_status === "verified" ? "Verified" : "Pending"}
                      tone={p.property_verification_status === "verified" ? "success" : "warning"}
                    />
                  ),
                },
                {
                  key: "action",
                  header: "",
                  className: "text-right",
                  render: (p: Property) => (
                    <button
                      disabled={moderation.isPending}
                      onClick={() => moderate(p, true)}
                      title="Marks the listing approved. Document-level verification flags require the pending enterprise-schema migration."
                      className="rounded-xl bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
                    >
                      Verify &amp; approve
                    </button>
                  ),
                },
              ]}
            />
          )}
        </div>
      )}

      {activeTab === "applications" && (
        <div className="space-y-5">
          <SectionHeader
            title={`Agent Partner Applications (${applications.length})`}
            subtitle="Review incoming real estate partner agent profiles, corridors, and qualifications"
          />
          {applications.length === 0 ? (
            <EmptyState
              icon={<UserCheck className="h-6 w-6" />}
              title="No pending applications"
              hint="New submissions from the /agents portal appear here automatically."
            />
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground text-base">{app.name}</h4>
                        <StatusPill
                          label={app.status.replace("_", " ")}
                          tone={
                            app.status === "approved"
                              ? "success"
                              : app.status === "rejected"
                                ? "danger"
                                : "warning"
                          }
                        />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          Email: <strong className="text-foreground">{app.email}</strong>
                        </span>
                        <span>
                          Phone: <strong className="text-foreground">{app.phone}</strong>
                        </span>
                        <span>
                          City: <strong className="text-foreground">{app.city}</strong>
                        </span>
                        <span>
                          Experience:{" "}
                          <strong className="text-foreground">{app.experience_years}</strong>
                        </span>
                      </div>

                      {app.preferred_areas?.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            Corridors:
                          </span>
                          {app.preferred_areas.map((area: string) => (
                            <span
                              key={area}
                              className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-medium text-foreground"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      )}

                      {app.languages?.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            Languages:
                          </span>
                          {app.languages.map((lang: string) => (
                            <span
                              key={lang}
                              className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      )}

                      {app.message && (
                        <p className="mt-3 rounded-2xl bg-secondary/40 p-3 text-xs text-muted-foreground italic">
                          "{app.message}"
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                      <button
                        disabled={appStatusMutation.isPending || app.status === "approved"}
                        onClick={() => appStatusMutation.mutate({ id: app.id, status: "approved" })}
                        className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-40"
                      >
                        Approve Partner
                      </button>
                      <button
                        disabled={appStatusMutation.isPending || app.status === "under_review"}
                        onClick={() =>
                          appStatusMutation.mutate({ id: app.id, status: "under_review" })
                        }
                        className="rounded-xl border border-border bg-secondary px-3.5 py-1.5 text-xs font-bold text-foreground transition hover:bg-secondary/80 disabled:opacity-40"
                      >
                        Mark Reviewing
                      </button>
                      <button
                        disabled={appStatusMutation.isPending || app.status === "rejected"}
                        onClick={() => appStatusMutation.mutate({ id: app.id, status: "rejected" })}
                        className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-500 transition hover:bg-rose-500/20 disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-6">
          <SectionHeader title="Platform reports" subtitle="Revenue, supply, and demand" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard
              label="Gross revenue"
              value={`₹${(grossRevenue / 100000).toFixed(1)}L`}
              icon={<DollarSign className="h-4 w-4" />}
              accent="purple"
            />
            <KpiCard
              label="Avg listing price"
              value={
                properties.length
                  ? `₹${Math.round(properties.reduce((s, p) => s + Number(p.price), 0) / properties.length).toLocaleString("en-IN")}`
                  : "—"
              }
              icon={<BarChart3 className="h-4 w-4" />}
              accent="blue"
            />
            <KpiCard
              label="Cities live"
              numericValue={cityMix.length}
              icon={<Building2 className="h-4 w-4" />}
              accent="emerald"
            />
            <KpiCard
              label="Active agents"
              numericValue={agents.filter((a) => a.status === "Active").length}
              icon={<UserCheck className="h-4 w-4" />}
              accent="amber"
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <DualLineChart
              title="Revenue vs. target"
              subtitle="Monthly, ₹"
              data={revenueSeries}
              seriesA="Actual"
              seriesB="Target"
            />
            {typeMix.length > 0 ? (
              <CategoryBarChart
                title="Listings by type"
                subtitle="Current supply mix"
                data={typeMix}
                valueName="Listings"
              />
            ) : (
              <EmptyState
                title="No supply data"
                hint="Type breakdown appears once listings load."
              />
            )}
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <SectionHeader title="Growth analytics" subtitle="Acquisition and marketplace health" />
          <div className="grid gap-6 lg:grid-cols-2">
            <TrendAreaChart
              title="Signups"
              subtitle="Monthly new accounts"
              data={signupTrend}
              valueName="Users"
            />
            {cityMix.length > 0 ? (
              <CategoryBarChart
                title="Listings by city"
                subtitle="Geographic distribution"
                data={cityMix}
                valueName="Listings"
              />
            ) : (
              <EmptyState
                title="No geography data"
                hint="City distribution appears once listings load."
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard
              label="Enquiry conversion"
              value="6.4%"
              icon={<BarChart3 className="h-4 w-4" />}
              accent="blue"
              trend={{ direction: "up", label: "+0.8%" }}
            />
            <KpiCard
              label="Owner retention"
              value="91%"
              icon={<UsersRound className="h-4 w-4" />}
              accent="emerald"
            />
            <KpiCard
              label="Avg time to let"
              numericValue={21}
              icon={<CheckSquare className="h-4 w-4" />}
              accent="amber"
              trend={{ direction: "down", label: "3 days faster" }}
            />
            <KpiCard
              label="Verified listings"
              value={`${properties.length ? Math.round((properties.filter((p) => p.property_verification_status === "verified").length / properties.length) * 100) : 0}%`}
              icon={<ShieldCheck className="h-4 w-4" />}
              accent="purple"
            />
          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className="space-y-5">
          <SectionHeader title="Audit logs" subtitle="Security and moderation events" />
          <div className="rounded-3xl border border-border/60 bg-card p-6">
            <ActivityTimeline items={AUDIT} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Full immutable logs are served by the secure admin portal, which reads through the
            service role.{" "}
            <Link to="/admin" className="font-semibold text-primary hover:underline">
              Open secure portal
            </Link>
          </p>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-5">
          <SectionHeader title="Platform settings" subtitle="Global configuration" />
          <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
            {[
              { label: "Platform commission", value: "None charged on listings" },
              { label: "Listing auto-approval", value: "Disabled — manual review" },
              { label: "Enquiry rate limit", value: "6 / hour / IP" },
              { label: "CAPTCHA", value: "Cloudflare Turnstile" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-border/60 bg-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{s.value}</p>
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
          userRole="admin"
        />
      )}
    </DashboardLayout>
  );
}
