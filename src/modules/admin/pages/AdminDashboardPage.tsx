import { Link } from "@tanstack/react-router";
import { useDashboardTab } from "@/modules/dashboard/hooks/useDashboardTab";
import type { User } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckSquare,
  DollarSign,
  FileBarChart,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  UsersRound,
  XCircle,
} from "lucide-react";
import { fetchPropertyFeed, formatPrice, type Property } from "@/lib/properties";
import { DashboardLayout, type NavItem } from "@/components/dashboard/DashboardLayout";
import { RequireRole } from "@/components/dashboard/RequireRole";
import {
  ActivityTimeline,
  CardSkeleton,
  DataTable,
  DemoDataNotice,
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
} from "@/components/dashboard/DashboardKit";
import {
  CategoryBarChart,
  DonutChart,
  DualLineChart,
  TrendAreaChart,
} from "@/components/dashboard/DashboardCharts";
import { countBy, relativeTime, seededSeries } from "@/lib/dashboard-data";
import { getAdminProperties, updateAdminProperty } from "@/lib/admin.functions";
import { displayName } from "@/lib/auth-session";

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "owners", label: "Owners", icon: UsersRound },
  { id: "agents", label: "Agents", icon: UserCheck },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "approvals", label: "Pending Approvals", icon: CheckSquare },
  { id: "verification", label: "Verification Queue", icon: ShieldCheck },
  { id: "reports", label: "Reports", icon: FileBarChart },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "audit", label: "Audit Logs", icon: ScrollText },
  { id: "settings", label: "Settings", icon: Settings },
];

const SEARCH_PARAMS = {
  q: "",
  city: "Hyderabad",
  listing: "rent",
  minPrice: 0,
  maxPrice: 0,
  beds: 0,
} as const;

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: "Customer" | "Owner" | "Agent" | "Admin";
  status: "Active" | "Suspended" | "Pending";
  joined: string;
}

const USERS: PlatformUser[] = [
  {
    id: "U-1",
    name: "Kavitha Reddy",
    email: "kavitha@example.in",
    role: "Customer",
    status: "Active",
    joined: "12 Mar 2026",
  },
  {
    id: "U-2",
    name: "Suresh Reddy",
    email: "suresh@example.in",
    role: "Owner",
    status: "Active",
    joined: "04 Feb 2026",
  },
  {
    id: "U-3",
    name: "Anitha Rao",
    email: "anitha@example.in",
    role: "Owner",
    status: "Pending",
    joined: "28 Jul 2026",
  },
  {
    id: "U-4",
    name: "Rahul Verma",
    email: "rahul@example.in",
    role: "Agent",
    status: "Active",
    joined: "19 Jan 2026",
  },
  {
    id: "U-5",
    name: "Divya Nair",
    email: "divya@example.in",
    role: "Customer",
    status: "Active",
    joined: "02 Jun 2026",
  },
  {
    id: "U-6",
    name: "Vikram Singh",
    email: "vikram@example.in",
    role: "Agent",
    status: "Suspended",
    joined: "15 Apr 2026",
  },
];

const AUDIT: TimelineItem[] = [
  {
    id: "au1",
    title: "property.approved",
    detail: "3BHK Kondapur approved by admin@urbanproperties.in",
    time: "12 min ago",
    tone: "success",
  },
  {
    id: "au2",
    title: "user.role_granted",
    detail: "Agent role granted to rahul@example.in",
    time: "1 hour ago",
    tone: "info",
  },
  {
    id: "au3",
    title: "enquiry.rate_limited",
    detail: "IP 49.37.x.x exceeded the hourly enquiry cap",
    time: "3 hours ago",
    tone: "warning",
  },
  {
    id: "au4",
    title: "auth.failed",
    detail: "5 failed sign-ins for unknown@example.in",
    time: "Yesterday",
    tone: "danger",
  },
];

export function AdminDashboardPage() {
  return (
    <RequireRole role="admin">{(session) => <AdminDashboard user={session.user} />}</RequireRole>
  );
}

function AdminDashboard({ user }: { user: User | null }) {
  const [activeTab, setActiveTab] = useDashboardTab("/dashboard/admin");

  const [userQuery, setUserQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [propertyQuery, setPropertyQuery] = useState("");

  const {
    data: feed,
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ["property-feed"], queryFn: fetchPropertyFeed });

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
    mutationFn: (vars: { id: string; is_approved: boolean }) =>
      updateProperty({ data: { id: vars.id, is_approved: vars.is_approved } }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "properties"] });
      queryClient.invalidateQueries({ queryKey: ["property-feed"] });
      toast.success(vars.is_approved ? "Listing approved and published" : "Listing rejected");
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

  const properties = useMemo(() => feed?.properties ?? [], [feed]);
  const isSampleData = feed?.source === "fallback";

  const owners = USERS.filter((u) => u.role === "Owner");
  const agents = USERS.filter((u) => u.role === "Agent");
  /** Genuinely unapproved listings, straight from the service-role view. */
  const pendingApprovals = useMemo(
    () => (adminRows ?? []).filter((p) => !p.is_approved),
    [adminRows],
  );
  const verificationQueue = useMemo(
    () => properties.filter((p) => p.property_verification_status !== "verified").slice(0, 4),
    [properties],
  );

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
          {isSampleData && <DemoDataNotice reason={feed?.error} />}

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
              />
            </div>
            <div className="rounded-3xl border border-border/60 bg-card p-5">
              <SectionHeader title="Security activity" />
              <ActivityTimeline items={AUDIT.slice(0, 4)} />
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
        <div className="space-y-5">
          <SectionHeader
            title={`Partner agents (${agents.length})`}
            subtitle="Accounts working the lead pipeline"
          />
          <UserTable users={agents} />
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
        <div className="space-y-5">
          <SectionHeader
            title={`Pending approvals (${pendingApprovals.length})`}
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
              { label: "Zero brokerage", value: "Enabled platform-wide" },
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
    </DashboardLayout>
  );
}

function UserTable({ users }: { users: PlatformUser[] }) {
  return (
    <DataTable
      rows={users}
      getKey={(u) => u.id}
      empty={
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No accounts match"
          hint="Try a different role filter or search term."
        />
      }
      columns={[
        {
          key: "name",
          header: "User",
          render: (u: PlatformUser) => (
            <div>
              <p className="font-bold text-foreground">{u.name}</p>
              <p className="text-[11px] text-muted-foreground">{u.email}</p>
            </div>
          ),
        },
        {
          key: "role",
          header: "Role",
          render: (u: PlatformUser) => <StatusPill label={u.role} tone="info" />,
        },
        {
          key: "joined",
          header: "Joined",
          render: (u: PlatformUser) => (
            <span className="whitespace-nowrap text-muted-foreground">{u.joined}</span>
          ),
        },
        {
          key: "status",
          header: "Status",
          className: "text-right",
          render: (u: PlatformUser) => (
            <StatusPill
              label={u.status}
              tone={
                u.status === "Active" ? "success" : u.status === "Pending" ? "warning" : "danger"
              }
            />
          ),
        },
      ]}
    />
  );
}

function PropertyTable({
  properties,
  isLoading,
  isError,
  onRetry,
}: {
  properties: Property[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (isError) return <ErrorState onRetry={onRetry} />;

  return (
    <DataTable
      rows={properties}
      getKey={(p) => p.id}
      empty={
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title="No properties found"
          hint="Listings appear here once owners publish them."
        />
      }
      columns={[
        {
          key: "title",
          header: "Listing",
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
          key: "type",
          header: "Type",
          render: (p: Property) => <span className="text-muted-foreground">{p.property_type}</span>,
        },
        {
          key: "price",
          header: "Price",
          render: (p: Property) => (
            <span className="whitespace-nowrap font-bold text-foreground">
              {formatPrice(p.price, p.listing_type)}
            </span>
          ),
        },
        {
          key: "status",
          header: "Status",
          className: "text-right",
          render: (p: Property) => (
            <StatusPill
              label={p.is_featured ? "Featured" : "Live"}
              tone={p.is_featured ? "info" : "success"}
            />
          ),
        },
      ]}
    />
  );
}
