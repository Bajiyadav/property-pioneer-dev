import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  Eye,
  FileEdit,
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  Settings,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchPropertyFeed, formatPrice, type Property } from "@/lib/properties";
import { DashboardLayout, type NavItem } from "@/components/dashboard/DashboardLayout";
import { RequireRole } from "@/components/dashboard/RequireRole";
import { OwnerOnboardingModal } from "@/components/modals/OwnerOnboardingModal";
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
  OnboardingTips,
  QuickActions,
  SearchInput,
  SectionHeader,
  StatusPill,
  type TimelineItem,
} from "@/components/dashboard/DashboardKit";
import {
  CategoryBarChart,
  DonutChart,
  TrendAreaChart,
} from "@/components/dashboard/DashboardCharts";
import { countBy, relativeTime, seededSeries } from "@/lib/dashboard-data";
import { displayName } from "@/lib/auth-session";

export const Route = createFileRoute("/_authenticated/dashboard/owner")({
  component: OwnerDashboardRoute,
});

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "listings", label: "My Listings", icon: Building2 },
  { id: "add", label: "Add Property", icon: PlusCircle, badge: "FREE" },
  { id: "drafts", label: "Draft Listings", icon: FileEdit },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "enquiries", label: "Enquiries", icon: MessageSquare },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
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

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200";

function listingImage(p: Property): string {
  return Array.isArray(p.images) && p.images[0] ? p.images[0] : FALLBACK_IMAGE;
}

interface OwnerLead {
  id: string;
  name: string;
  phone: string;
  property: string;
  message: string;
  when: string;
  status: "New" | "Contacted" | "Visit booked";
}

const LEADS: OwnerLead[] = [
  {
    id: "l1",
    name: "Kavitha Reddy",
    phone: "+91 98765 43210",
    property: "2BHK Gachibowli",
    message: "Is parking included in the rent?",
    when: "12 min ago",
    status: "New",
  },
  {
    id: "l2",
    name: "Arjun Kapoor",
    phone: "+91 99887 76655",
    property: "3BHK Villa Kondapur",
    message: "Can I schedule a visit this weekend?",
    when: "3 hours ago",
    status: "Contacted",
  },
  {
    id: "l3",
    name: "Neha Sharma",
    phone: "+91 90000 12345",
    property: "Studio, Hitech City",
    message: "Is it available from the 1st?",
    when: "Yesterday",
    status: "Visit booked",
  },
];

const VISITS = [
  { id: "v1", day: "Today", time: "04:00 PM", who: "Kavitha Reddy", what: "2BHK Gachibowli" },
  { id: "v2", day: "Tomorrow", time: "11:00 AM", who: "Arjun Kapoor", what: "3BHK Kondapur" },
  { id: "v3", day: "Saturday", time: "01:30 PM", who: "Neha Sharma", what: "Studio, Hitech City" },
];

const ACTIVITY: TimelineItem[] = [
  {
    id: "a1",
    title: "New enquiry received",
    detail: "Kavitha Reddy asked about parking on 2BHK Gachibowli.",
    time: "12 min ago",
    tone: "info",
  },
  {
    id: "a2",
    title: "Listing approved",
    detail: "Your 3BHK Kondapur listing passed verification.",
    time: "2 hours ago",
    tone: "success",
  },
  {
    id: "a3",
    title: "Visit scheduled",
    detail: "Arjun Kapoor booked a walkthrough for tomorrow 11:00 AM.",
    time: "Yesterday",
    tone: "neutral",
  },
];

function OwnerDashboardRoute() {
  return (
    <RequireRole role="owner">{(session) => <OwnerDashboard user={session.user} />}</RequireRole>
  );
}

function OwnerDashboard({ user }: { user: User | null }) {
  const { tab: activeTab } = Route.useSearch();
  const navigate = useNavigate();
  const setActiveTab = (id: string) =>
    navigate({ to: "/dashboard/owner", search: { tab: id }, replace: true });

  const [showWizard, setShowWizard] = useState(false);
  const [listingQuery, setListingQuery] = useState("");
  const [leadFilter, setLeadFilter] = useState("all");

  const {
    data: feed,
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ["property-feed"], queryFn: fetchPropertyFeed });

  const properties = useMemo(() => feed?.properties ?? [], [feed]);
  const isSampleData = feed?.source === "fallback";

  // Until `properties.owner_id` is populated the portfolio is a representative
  // slice of the catalogue rather than a true per-owner query.
  const listings = useMemo(() => properties.slice(0, 4), [properties]);
  const drafts = useMemo(() => properties.slice(4, 6), [properties]);

  const filteredListings = useMemo(() => {
    const q = listingQuery.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((p) => `${p.title} ${p.city} ${p.address}`.toLowerCase().includes(q));
  }, [listings, listingQuery]);

  const visibleLeads = useMemo(
    () => (leadFilter === "all" ? LEADS : LEADS.filter((l) => l.status === "New")),
    [leadFilter],
  );

  const monthlyRent = useMemo(
    () => listings.reduce((sum, p) => sum + Number(p.price || 0), 0),
    [listings],
  );

  const viewsTrend = useMemo(
    () => seededSeries(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], 42, 18, 96),
    [],
  );
  const perListingViews = useMemo(
    () =>
      listings.map((p, i) => ({
        label: p.title.split(" ").slice(0, 2).join(" "),
        value: 40 + ((i * 37) % 120),
      })),
    [listings],
  );
  const typeMix = useMemo(() => countBy(listings, (p) => p.property_type), [listings]);

  const tabTitle: Record<string, string> = {
    overview: "Owner control panel",
    listings: "My listings",
    drafts: "Draft listings",
    analytics: "Listing analytics",
    enquiries: "Tenant enquiries",
    calendar: "Visit calendar",
    settings: "Settings",
  };

  return (
    <DashboardLayout
      role="owner"
      title={
        activeTab === "overview"
          ? `Welcome back, ${displayName(user)}`
          : (tabTitle[activeTab] ?? "Owner")
      }
      subtitle="Manage your 0% brokerage listings, tenant leads, walkthroughs, and rent collection."
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={(id) => (id === "add" ? setShowWizard(true) : setActiveTab(id))}
      user={user}
      headerAction={
        <button
          onClick={() => setShowWizard(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
        >
          <PlusCircle className="h-3.5 w-3.5" /> Add property
        </button>
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
                label="Active listings"
                numericValue={listings.length}
                icon={<Building2 className="h-4 w-4" />}
                accent="emerald"
                hint="100% verified"
              />
              <KpiCard
                label="Tenant leads"
                numericValue={LEADS.length}
                icon={<Users className="h-4 w-4" />}
                accent="blue"
                trend={{ direction: "up", label: "+1 today" }}
              />
              <KpiCard
                label="Est. monthly rent"
                value={`₹${monthlyRent.toLocaleString("en-IN")}`}
                icon={<TrendingUp className="h-4 w-4" />}
                accent="purple"
                hint="0% commission"
              />
              <KpiCard
                label="Avg response"
                value="12 min"
                icon={<MessageSquare className="h-4 w-4" />}
                accent="amber"
                trend={{ direction: "up", label: "Top 5% owners" }}
              />
            </div>
          )}

          {listings.length === 0 && (
            <OnboardingTips
              tips={[
                "Publishing a listing is free and takes under three minutes.",
                "Listings with 5+ photos get roughly 3× more enquiries.",
                "Reply within 15 minutes to earn the fast-responder badge.",
              ]}
            />
          )}

          <div>
            <SectionHeader title="Quick actions" />
            <QuickActions
              actions={[
                {
                  id: "add",
                  label: "Add a property",
                  hint: "Free listing",
                  icon: <PlusCircle className="h-4 w-4" />,
                  onClick: () => setShowWizard(true),
                },
                {
                  id: "leads",
                  label: "Tenant leads",
                  hint: `${LEADS.length} open`,
                  icon: <MessageSquare className="h-4 w-4" />,
                  onClick: () => setActiveTab("enquiries"),
                },
                {
                  id: "analytics",
                  label: "Performance",
                  hint: "Views & conversion",
                  icon: <BarChart3 className="h-4 w-4" />,
                  onClick: () => setActiveTab("analytics"),
                },
                {
                  id: "calendar",
                  label: "Visit calendar",
                  hint: `${VISITS.length} upcoming`,
                  icon: <CalendarDays className="h-4 w-4" />,
                  onClick: () => setActiveTab("calendar"),
                },
              ]}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TrendAreaChart
                title="Listing views this week"
                subtitle="Across all your published properties"
                data={viewsTrend}
                valueName="Views"
              />
            </div>
            <div className="rounded-3xl border border-border/60 bg-card p-5">
              <SectionHeader title="Recent activity" />
              <ActivityTimeline items={ACTIVITY} />
            </div>
          </div>

          <div>
            <SectionHeader
              title={`Your listings (${listings.length})`}
              action={
                <button
                  onClick={() => setActiveTab("listings")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Manage all <ArrowRight className="h-3 w-3" />
                </button>
              }
            />
            <ListingRows
              listings={listings.slice(0, 3)}
              isLoading={isLoading}
              isError={isError}
              onRetry={refetch}
              onAdd={() => setShowWizard(true)}
            />
          </div>
        </div>
      )}

      {activeTab === "listings" && (
        <div className="space-y-5">
          <SectionHeader
            title={`My listings (${filteredListings.length})`}
            subtitle="Published properties visible to tenants"
            action={
              <SearchInput
                value={listingQuery}
                onChange={setListingQuery}
                placeholder="Search listings…"
              />
            }
          />
          <ListingRows
            listings={filteredListings}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onAdd={() => setShowWizard(true)}
          />
        </div>
      )}

      {activeTab === "drafts" && (
        <div className="space-y-5">
          <SectionHeader
            title={`Draft listings (${drafts.length})`}
            subtitle="Unpublished properties — finish these to go live"
          />
          {isLoading ? (
            <LoadingSkeleton rows={2} />
          ) : drafts.length === 0 ? (
            <EmptyState
              icon={<FileEdit className="h-6 w-6" />}
              title="No drafts"
              hint="Start a listing and save it — unfinished properties collect here."
              action={
                <button
                  onClick={() => setShowWizard(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Start a listing
                </button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {drafts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-3xl border border-dashed border-border bg-card p-5"
                >
                  <div className="flex items-center justify-between">
                    <StatusPill label="Draft — not published" tone="warning" />
                    <span className="text-[11px] text-muted-foreground">
                      {relativeTime(p.created_at)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-foreground">{p.title}</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {p.address}, {p.city}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setShowWizard(true)}
                      className="rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground"
                    >
                      Continue editing
                    </button>
                    <button
                      onClick={() => toast.success("Draft submitted for verification")}
                      className="rounded-xl border border-border bg-secondary/60 px-3 py-2 text-[11px] font-bold text-foreground"
                    >
                      Publish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <SectionHeader
            title="Listing performance"
            subtitle="How your properties are performing with tenants"
          />
          {isLoading ? (
            <CardSkeleton count={3} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <KpiCard
                  label="Total views"
                  numericValue={486}
                  icon={<Eye className="h-4 w-4" />}
                  accent="blue"
                />
                <KpiCard
                  label="Enquiry rate"
                  value="6.4%"
                  icon={<MessageSquare className="h-4 w-4" />}
                  accent="purple"
                  trend={{ direction: "up", label: "+1.2%" }}
                />
                <KpiCard
                  label="Visits booked"
                  numericValue={VISITS.length}
                  icon={<CalendarDays className="h-4 w-4" />}
                  accent="emerald"
                />
                <KpiCard
                  label="Avg days to let"
                  numericValue={18}
                  icon={<TrendingUp className="h-4 w-4" />}
                  accent="amber"
                  trend={{ direction: "down", label: "4 days faster" }}
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {perListingViews.length > 0 ? (
                  <CategoryBarChart
                    title="Views by listing"
                    subtitle="Last 30 days"
                    data={perListingViews}
                    valueName="Views"
                  />
                ) : (
                  <EmptyState
                    title="No listings to analyse"
                    hint="Publish a property to see performance."
                  />
                )}
                {typeMix.length > 0 ? (
                  <DonutChart title="Portfolio mix" subtitle="By property type" data={typeMix} />
                ) : (
                  <EmptyState title="No portfolio yet" hint="Your property mix appears here." />
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "enquiries" && (
        <div className="space-y-5">
          <SectionHeader
            title={`Tenant enquiries (${visibleLeads.length})`}
            subtitle="Direct messages from interested tenants"
            action={
              <FilterChips
                active={leadFilter}
                onChange={setLeadFilter}
                options={[
                  { id: "all", label: "All" },
                  { id: "new", label: "New only" },
                ]}
              />
            }
          />
          <DataTable
            rows={visibleLeads}
            getKey={(l) => l.id}
            empty={
              <EmptyState
                icon={<MessageSquare className="h-6 w-6" />}
                title="No enquiries yet"
                hint="Tenant messages on your listings will appear here."
              />
            }
            columns={[
              {
                key: "who",
                header: "Tenant",
                render: (l: OwnerLead) => (
                  <div>
                    <p className="font-bold text-foreground">{l.name}</p>
                    <p className="text-[11px] text-muted-foreground">{l.phone}</p>
                  </div>
                ),
              },
              {
                key: "property",
                header: "Property",
                render: (l: OwnerLead) => (
                  <span className="text-muted-foreground">{l.property}</span>
                ),
              },
              {
                key: "message",
                header: "Message",
                render: (l: OwnerLead) => (
                  <span className="text-muted-foreground">"{l.message}"</span>
                ),
              },
              {
                key: "when",
                header: "Received",
                render: (l: OwnerLead) => (
                  <span className="whitespace-nowrap text-muted-foreground">{l.when}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                className: "text-right",
                render: (l: OwnerLead) => (
                  <StatusPill
                    label={l.status}
                    tone={
                      l.status === "New" ? "warning" : l.status === "Contacted" ? "info" : "success"
                    }
                  />
                ),
              },
            ]}
          />
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="space-y-5">
          <SectionHeader
            title="Visit calendar"
            subtitle="Walkthroughs tenants have booked with you"
          />
          {VISITS.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title="No visits scheduled"
              hint="Tenant walkthrough bookings appear here automatically."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {VISITS.map((v) => (
                <div
                  key={v.id}
                  className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                    {v.day}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-black text-foreground">
                    {v.time}
                  </p>
                  <p className="mt-2 text-xs font-bold text-foreground">{v.who}</p>
                  <p className="text-[11px] text-muted-foreground">{v.what}</p>
                  <button
                    onClick={() => toast.success(`Reminder sent to ${v.who}`)}
                    className="mt-4 w-full rounded-xl border border-border bg-secondary/60 py-2 text-[11px] font-bold text-foreground transition hover:bg-secondary"
                  >
                    Send reminder
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && <OwnerSettings user={user} />}

      <OwnerOnboardingModal isOpen={showWizard} onClose={() => setShowWizard(false)} />
    </DashboardLayout>
  );
}

function ListingRows({
  listings,
  isLoading,
  isError,
  onRetry,
  onAdd,
}: {
  listings: Property[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onAdd: () => void;
}) {
  if (isLoading) return <LoadingSkeleton rows={3} />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (listings.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="h-6 w-6" />}
        title="No listings published yet"
        hint="Add your first property — listing is free and takes under three minutes."
        action={
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground"
          >
            <PlusCircle className="h-3.5 w-3.5" /> Add property
          </button>
        }
      />
    );
  }

  return (
    <div className="divide-y divide-border/40 rounded-3xl border border-border/60 bg-card px-5">
      {listings.map((p) => (
        <div
          key={p.id}
          className="flex flex-col items-start justify-between gap-4 py-4 sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 items-center gap-4">
            <img
              src={listingImage(p)}
              alt=""
              loading="lazy"
              className="h-14 w-20 flex-none rounded-xl bg-muted object-cover"
            />
            <div className="min-w-0">
              <h3 className="truncate text-xs font-bold text-foreground">{p.title}</h3>
              <p className="truncate text-[11px] text-muted-foreground">
                {p.address}, {p.city}
              </p>
              <p className="mt-0.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatPrice(p.price, p.listing_type)}
              </p>
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <StatusPill label="Active & live" tone="success" />
            <div className="flex items-center gap-1">
              <Link
                to="/properties/$id"
                params={{ id: p.id }}
                search={SEARCH_PARAMS}
                aria-label={`View ${p.title}`}
                className="rounded-xl border border-border bg-secondary/50 p-2 text-foreground transition hover:bg-secondary"
              >
                <Eye className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={onAdd}
                aria-label={`Edit ${p.title}`}
                className="rounded-xl border border-border bg-secondary/50 p-2 text-foreground transition hover:bg-secondary"
              >
                <FileEdit className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OwnerSettings({ user }: { user: User | null }) {
  const [name, setName] = useState((user?.user_metadata?.full_name as string) ?? "");
  const [phone, setPhone] = useState((user?.user_metadata?.phone as string) ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-5">
      <SectionHeader title="Settings" subtitle="Owner profile and payout preferences" />

      <form
        className="max-w-xl space-y-4 rounded-3xl border border-border/60 bg-card p-6 text-xs"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          const { error } = await supabase.auth.updateUser({
            data: { full_name: name, phone },
          });
          setSaving(false);
          if (error) toast.error(error.message);
          else toast.success("Owner profile updated");
        }}
      >
        <div>
          <label htmlFor="o-name" className="mb-1 block font-semibold text-muted-foreground">
            Full name
          </label>
          <input
            id="o-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="o-phone" className="mb-1 block font-semibold text-muted-foreground">
            Contact number
          </label>
          <input
            id="o-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <div className="max-w-xl rounded-3xl border border-border/60 bg-card p-5">
        <div className="flex items-start gap-3">
          <CreditCard className="mt-0.5 h-4 w-4 flex-none text-primary" />
          <div>
            <p className="text-xs font-bold text-foreground">Rent collection</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              Connect a bank account to collect rent directly through Urban Properties with
              automated receipts and reminders.
            </p>
            <button
              onClick={() => toast.info("Payouts onboarding opens in the next release.")}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground"
            >
              <Star className="h-3.5 w-3.5" /> Set up payouts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
