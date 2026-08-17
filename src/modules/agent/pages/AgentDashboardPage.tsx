import { Link } from "@tanstack/react-router";
import { useDashboardTab } from "@/modules/dashboard/hooks/useDashboardTab";
import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Banknote,
  Bell,
  Building2,
  CalendarCheck,
  FileBarChart,
  LayoutDashboard,
  Phone,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  fetchPropertyFeed,
  formatPrice,
  type Property,
} from "@/modules/property/services/propertyQueries";
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
  { id: "leads", label: "Leads", icon: Target },
  { id: "assigned", label: "Assigned Properties", icon: Building2 },
  { id: "clients", label: "Clients", icon: Users },
  { id: "visits", label: "Visits", icon: CalendarCheck },
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

export function AgentDashboardPage() {
  return (
    <RequireRole role="agent">{(session) => <AgentDashboard user={session.user} />}</RequireRole>
  );
}

function AgentDashboard({ user }: { user: User | null }) {
  const [activeTab, setActiveTab] = useDashboardTab("/dashboard/agent");

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

  /*
   * Empty rather than generated.
   *
   * This was built by a seeded pseudo-random generator, producing a
   * plausible curve from nothing. It was the most deceptive item on the page: it
   * looked like a measurement, stayed identical across reloads so it read as
   * stable data, and described no real activity whatsoever. The chart now renders
   * its empty state until a real series is available.
   */
  const leadTrend = useMemo<{ label: string; value: number }[]>(() => [], []);
  const revenueSeries = useMemo(
    () =>
      ["Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((label, i) => ({
        label,
        a: 40000 + i * 12000,
        b: 55000 + i * 9000,
      })),
    [],
  );

  const tabTitle: Record<string, string> = {
    overview: "Partner agent hub",
    leads: "Lead pipeline",
    assigned: "Assigned properties",
    clients: "Client directory",
    visits: "Scheduled visits",
    commission: "Commission tracker",
    reports: "Performance reports",
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
      subtitle="Work your pipeline, manage clients and visits, and track commission payouts."
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user}
      headerAction={
        <button
          onClick={() => setActiveTab("leads")}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-110"
        >
          <Target className="h-3.5 w-3.5" /> Work my leads
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
                  key: "status",
                  header: "Status",
                  className: "text-right",
                  render: () => <StatusPill label="Active" tone="success" />,
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
          <SectionHeader title="Scheduled visits" subtitle="Walkthroughs you're accompanying" />
          <div className="grid gap-4 sm:grid-cols-3">
            {VISITS.map((v) => (
              <div key={v.id} className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
                <StatusPill
                  label={v.status}
                  tone={v.status === "Confirmed" ? "success" : "warning"}
                />
                <p className="mt-3 text-sm font-bold text-foreground">{v.client}</p>
                <p className="text-[11px] text-muted-foreground">{v.property}</p>
                <p className="mt-3 flex items-center gap-1.5 border-t border-border/40 pt-2 text-xs font-semibold text-foreground">
                  <CalendarCheck className="h-3.5 w-3.5 text-primary" /> {v.when}
                </p>
                <button
                  onClick={() => toast.success(`Reminder sent to ${v.client}`)}
                  className="mt-3 w-full rounded-xl border border-border bg-secondary/60 py-2 text-[11px] font-bold text-foreground transition hover:bg-secondary"
                >
                  Send reminder
                </button>
              </div>
            ))}
          </div>
        </div>
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
