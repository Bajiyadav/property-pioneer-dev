/* eslint-disable */
import { Link, useNavigate } from "@tanstack/react-router";
import { useDashboardTab } from "@/modules/dashboard/hooks/useDashboardTab";
import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Bell,
  BellRing,
  Bookmark,
  Building2,
  Calendar,
  CalendarCheck,
  Heart,
  History,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPropertyFeed,
  formatPrice,
  type Property,
} from "@/modules/property/services/propertyQueries";
import { useFavorites } from "@/modules/property/hooks/useFavorites";
import { PropertyCard } from "@/modules/property/components/PropertyCard";
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
  OnboardingTips,
  QuickActions,
  SearchInput,
  SectionHeader,
  StatusPill,
  type TimelineItem,
} from "@/modules/dashboard/components/DashboardKit";
import { TrendAreaChart, DonutChart } from "@/modules/dashboard/components/DashboardCharts";
import { displayName } from "@/modules/authentication/services/session";
import { readRecentSearches, type RecentSearch } from "@/modules/dashboard/services/dashboardData";
const DEFAULT_SEARCH_PARAMS = {
  q: "",
  city: "Hyderabad",
  listing: "rent",
  minPrice: 0,
  maxPrice: 0,
  beds: 0,
} as const;
import {
  ListingGrid,
  RecentSearchesPanel,
  ProfilePanel,
  SettingsPanel,
} from "@/modules/customer/components/CustomerDashboardParts";
import { useInteractionStore } from "@/modules/interactions/stores/interactionStore";
import { ChatInterface } from "@/modules/interactions/components/ChatInterface";
import { TenantProfile } from "@/modules/tenant/components/TenantProfile";

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tenant-matches", label: "AI Matches", icon: Sparkles },
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "saved", label: "Saved Properties", icon: Heart },
  { id: "searches", label: "Recent Searches", icon: History },
  { id: "wishlist", label: "Wishlist", icon: Bookmark },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "bookings", label: "Bookings", icon: CalendarCheck },
  { id: "enquiries", label: "Enquiries", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
];

export function CustomerDashboardPage() {
  return (
    <RequireRole role="customer">
      {(session) => <CustomerDashboard user={session.user} />}
    </RequireRole>
  );
}

function CustomerDashboard({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useDashboardTab("/dashboard/customer");

  const { ids, toggle } = useFavorites();
  const [savedQuery, setSavedQuery] = useState("");
  const [bookingFilter, setBookingFilter] = useState("all");

  const { data: myVisits = [] } = useQuery({
    queryKey: ["customer", "my_visits", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase.from as any)("visit_schedules")
        .select("*, properties(title, city, locality, address)")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: Boolean(user?.id),
  });

  const feed = { properties: [] as any[], source: "live", error: null };
  const isLoading = false;
  const isError = false;
  const refetch = () => {};

  const properties = useMemo(() => feed?.properties ?? [], []);
  const isSampleData = feed?.source === "fallback";

  const savedHomes = useMemo(() => properties.filter((p) => ids.includes(p.id)), [properties, ids]);
  const recentSearches = useMemo(() => readRecentSearches(), []);

  const filteredSaved = useMemo(() => {
    const q = savedQuery.trim().toLowerCase();
    if (!q) return savedHomes;
    return savedHomes.filter((p) => `${p.title} ${p.city} ${p.address}`.toLowerCase().includes(q));
  }, [savedHomes, savedQuery]);

  // Derived with useMemo from the raw slice, not inside the selector. A
  // selector that returns `.filter(...)` hands useSyncExternalStore a brand new
  // array every render, so the snapshot never compares equal and React loops
  // until "Maximum update depth exceeded" — which crashed this dashboard to the
  // error boundary and took the sign-out control down with it.
  const allBookings = useInteractionStore((s) => s.bookings);
  const allChats = useInteractionStore((s) => s.chats);
  const allNotifications = useInteractionStore((s) => s.notifications);
  const uid = user?.id || "";
  const myBookings = useMemo(
    () => allBookings.filter((b) => b.tenantId === uid),
    [allBookings, uid],
  );
  const myChats = useMemo(() => allChats.filter((c) => c.tenantId === uid), [allChats, uid]);
  const myNotifications = useMemo(
    () => allNotifications.filter((n) => n.userId === uid),
    [allNotifications, uid],
  );

  const visibleBookings = useMemo(() => {
    if (bookingFilter === "all") return myBookings;
    if (bookingFilter === "upcoming") return myBookings.filter((b) => b.status !== "Completed");
    return myBookings.filter((b) => b.status === "Completed");
  }, [bookingFilter, myBookings]);

  // Map Notification → TimelineItem (Notification uses 'createdAt', TimelineItem requires 'time')
  const notificationsAsTimeline = useMemo<TimelineItem[]>(
    () =>
      myNotifications.map((n) => ({
        id: n.id,
        title: n.title,
        detail: n.detail,
        time: new Date(n.createdAt).toLocaleString(),
        tone: n.tone as TimelineItem["tone"],
      })),
    [myNotifications],
  );

  const cityMix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of properties) counts.set(p.city, (counts.get(p.city) ?? 0) + 1);
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [properties]);

  return (
    <DashboardLayout
      role="customer"
      title={`Welcome back, ${displayName(user)}`}
      subtitle="Track saved homes, scheduled visits, enquiries, and everything you've shortlisted."
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={user}
      headerAction={
        <Link
          to="/properties"
          search={DEFAULT_SEARCH_PARAMS}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-110"
        >
          <Search className="h-3.5 w-3.5" /> Browse homes
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
                label="Saved properties"
                numericValue={savedHomes.length}
                icon={<Heart className="h-4 w-4" />}
                accent="rose"
                hint="In your wishlist"
              />
              <KpiCard
                label="Upcoming visits"
                numericValue={myBookings.filter((b) => b.status !== "Completed").length}
                icon={<Calendar className="h-4 w-4" />}
                accent="blue"
                trend={{ direction: "up", label: "Scheduled" }}
              />
              <KpiCard
                label="Active chats"
                numericValue={myChats.length}
                icon={<MessageSquare className="h-4 w-4" />}
                accent="purple"
                hint="With owners"
              />
              <KpiCard
                label="Listings available"
                numericValue={properties.length}
                icon={<Sparkles className="h-4 w-4" />}
                accent="emerald"
                trend={{ direction: "up", label: "Updated live" }}
              />
            </div>
          )}

          {savedHomes.length === 0 && (
            <OnboardingTips
              tips={[
                "Tap the heart on any listing to save it — saved homes appear here instantly.",
                "Schedule a walkthrough directly from a property page; owners reply in under 15 minutes.",
                "Seedha Properties adds no commission, so the price you see is the owner's asking price.",
              ]}
            />
          )}

          <div>
            <SectionHeader title="Quick actions" subtitle="The things tenants and owners do most" />
            <QuickActions
              actions={[
                {
                  id: "browse",
                  label: "Find a home",
                  hint: "Search verified listings",
                  icon: <Search className="h-4 w-4" />,
                  onClick: () => navigate({ to: "/properties", search: DEFAULT_SEARCH_PARAMS }),
                },
                {
                  id: "lease_to_us",
                  label: "Lease to Us",
                  hint: "Guaranteed rent",
                  icon: <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
                  onClick: () => navigate({ to: "/list-property" }),
                },
                {
                  id: "saved",
                  label: "Saved homes",
                  hint: `${savedHomes.length} shortlisted`,
                  icon: <Heart className="h-4 w-4" />,
                  onClick: () => setActiveTab("saved"),
                },
                {
                  id: "visits",
                  label: "My bookings",
                  hint: "Visits & tours",
                  icon: <Calendar className="h-4 w-4" />,
                  onClick: () => setActiveTab("bookings"),
                },
                {
                  id: "list",
                  label: "Post property",
                  hint: "Free for owners",
                  icon: <Building2 className="h-4 w-4" />,
                  onClick: () => navigate({ to: "/list-property" }),
                },
                {
                  id: "enquiries",
                  label: "My enquiries",
                  hint: "Owner conversations",
                  icon: <MessageSquare className="h-4 w-4" />,
                  onClick: () => setActiveTab("enquiries"),
                },
              ]}
            />
          </div>

          {/* Property Management (Lease to Us) Guaranteed Rent Banner */}
          <div className="rounded-2xl sm:rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-teal-950/80 p-4 sm:p-6 shadow-md text-white relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-bold text-emerald-300 border border-emerald-400/30">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  PROPERTY MANAGEMENT • GUARANTEED RENT
                </div>
                <h3 className="text-lg font-bold text-white sm:text-2xl">
                  Have a Property? Lease It Directly to Us
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                  We take your home on rent and pay you guaranteed fixed rent on the 1st of every
                  month. Enjoy zero vacancy risk while our team handles verified tenants, legal
                  agreements, and complete home maintenance.
                </p>
              </div>
              <button
                onClick={() => navigate({ to: "/list-property" })}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 px-5 py-3 text-xs sm:text-sm font-extrabold shadow-sm transition-all hover:scale-105 shrink-0"
              >
                Lease Your Property to Us
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <TrendAreaChart
              title="Your search activity"
              subtitle="Listings viewed over the last 7 days"
              data={[]}
              valueName="Views"
            />
            {cityMix.length > 0 ? (
              <DonutChart
                title="Where the homes are"
                subtitle="Available listings by city"
                data={cityMix}
              />
            ) : (
              <EmptyState
                title="No listings yet"
                hint="City coverage appears once listings load."
              />
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SectionHeader
                title={savedHomes.length > 0 ? "Your saved homes" : "Recommended for you"}
                subtitle={
                  savedHomes.length > 0
                    ? "Shortlisted properties"
                    : "Verified listings picked for you"
                }
                action={
                  <button
                    onClick={() => setActiveTab("saved")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </button>
                }
              />
              <ListingGrid
                items={(savedHomes.length > 0 ? savedHomes : properties).slice(0, 3)}
                isLoading={isLoading}
                isError={isError}
                onRetry={refetch}
                emptyTitle="No listings to show yet"
                emptyHint="New verified homes appear here as owners publish them."
              />
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-5">
              <SectionHeader title="Recent activity" />
              <ActivityTimeline
                items={
                  notificationsAsTimeline.length > 0
                    ? notificationsAsTimeline
                    : [
                        {
                          id: "placeholder",
                          title: "Welcome to Seedha Properties",
                          detail: "Start exploring and favoriting properties to see activity here.",
                          time: "Just now",
                          tone: "info" as const,
                        },
                      ]
                }
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "profile" && <ProfilePanel user={user} />}

      {activeTab === "saved" && (
        <div className="space-y-5">
          <SectionHeader
            title={`Saved properties (${filteredSaved.length})`}
            subtitle="Everything you've hearted across the platform"
            action={
              <SearchInput
                value={savedQuery}
                onChange={setSavedQuery}
                placeholder="Search saved homes…"
              />
            }
          />
          <ListingGrid
            items={filteredSaved}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            emptyTitle={savedQuery ? "No matches" : "Your saved list is empty"}
            emptyHint={
              savedQuery
                ? "Try a different city or property name."
                : "Tap the heart on any listing to shortlist it."
            }
            action={
              <Link
                to="/properties"
                search={DEFAULT_SEARCH_PARAMS}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground"
              >
                <Search className="h-3.5 w-3.5" /> Browse listings
              </Link>
            }
          />
        </div>
      )}

      {activeTab === "searches" && <RecentSearchesPanel searches={recentSearches} />}

      {activeTab === "wishlist" && (
        <div className="space-y-5">
          <SectionHeader
            title={`Wishlist (${savedHomes.length})`}
            subtitle="Compare shortlisted homes side by side, then remove what no longer fits"
          />
          {isLoading ? (
            <LoadingSkeleton rows={3} />
          ) : savedHomes.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="h-6 w-6" />}
              title="Nothing on your wishlist"
              hint="Save homes you like and compare their rent, size, and location here."
              action={
                <Link
                  to="/properties"
                  search={DEFAULT_SEARCH_PARAMS}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground"
                >
                  Start browsing
                </Link>
              }
            />
          ) : (
            <DataTable
              rows={savedHomes}
              getKey={(p) => p.id}
              columns={[
                {
                  key: "home",
                  header: "Property",
                  render: (p: Property) => (
                    <Link
                      to="/properties/$id"
                      params={{ id: p.id }}
                      search={DEFAULT_SEARCH_PARAMS}
                      className="font-bold text-foreground hover:text-primary"
                    >
                      {p.title}
                    </Link>
                  ),
                },
                {
                  key: "city",
                  header: "Location",
                  render: (p: Property) => <span className="text-muted-foreground">{p.city}</span>,
                },
                {
                  key: "config",
                  header: "Config",
                  render: (p: Property) => (
                    <span className="text-muted-foreground">
                      {p.bedrooms} BHK · {p.area_sqft} sq.ft
                    </span>
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
                  key: "actions",
                  header: "",
                  className: "text-right",
                  render: (p: Property) => (
                    <button
                      onClick={() => {
                        toggle(p.id);
                        toast.success("Removed from wishlist");
                      }}
                      className="rounded-lg px-2 py-1 text-[11px] font-bold text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400"
                    >
                      Remove
                    </button>
                  ),
                },
              ]}
            />
          )}
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="space-y-5">
          <SectionHeader
            title="Notifications"
            subtitle="Price drops, visit confirmations, and new matches"
          />
          <div className="rounded-3xl border border-border/60 bg-card p-6">
            <ActivityTimeline
              items={
                notificationsAsTimeline.length > 0
                  ? notificationsAsTimeline
                  : [
                      {
                        id: "placeholder",
                        title: "No notifications yet",
                        detail: "We'll let you know when owners reply to you.",
                        time: "Now",
                        tone: "neutral" as const,
                      },
                    ]
              }
            />
          </div>
          <Link
            to="/notifications"
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
          >
            Manage notification preferences <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {activeTab === "bookings" && (
        <div className="space-y-5">
          <SectionHeader
            title={`Bookings & Site Visits (${myVisits.length})`}
            subtitle="In-person walkthroughs and video tours you've scheduled"
          />
          {myVisits.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck className="h-6 w-6" />}
              title="No property visits scheduled yet"
              hint="Click 'Schedule Visit' on any property detail page to book an in-person or live video tour."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myVisits.map((item: any) => {
                const v = item as Record<string, any>;
                return (
                  <div
                    key={String(v.id)}
                    className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                        {v.visit_type === "video_call" ? "📹 Video Tour" : "🏠 In-Person Visit"}
                      </span>
                      <StatusPill
                        label={String(v.status || "Pending")}
                        tone={
                          v.status === "confirmed"
                            ? "success"
                            : v.status === "completed"
                              ? "info"
                              : "warning"
                        }
                      />
                    </div>

                    <div>
                      <h4 className="font-bold text-foreground text-sm">
                        {v.properties?.title || "Property Listing"}
                      </h4>
                      <p className="text-xs text-primary font-bold">{v.locality}</p>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-secondary/50 border border-border/50 text-xs">
                      <p className="text-muted-foreground font-medium">
                        Preferred Date &amp; Slot:
                      </p>
                      <p className="font-bold text-foreground">
                        {v.preferred_date} ({v.preferred_slot})
                      </p>
                    </div>

                    <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      Contact:{" "}
                      <strong className="text-foreground">
                        {v.customer_name} ({v.customer_phone})
                      </strong>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "enquiries" && (
        <div className="space-y-5">
          <SectionHeader title="Messages" subtitle="Your conversations with property owners" />
          <ChatInterface currentUserId={user?.id || ""} role="tenant" chats={myChats} />
        </div>
      )}

      {activeTab === "tenant-matches" && <TenantProfile />}

      {activeTab === "settings" && <SettingsPanel user={user} />}
    </DashboardLayout>
  );
}

/* ───────────────────────────── helper components ─────────────────────────── */
