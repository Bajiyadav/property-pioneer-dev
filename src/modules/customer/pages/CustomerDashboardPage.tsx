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
  Calendar,
  CalendarCheck,
  Heart,
  History,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchPropertyFeed, formatPrice, type Property } from "@/lib/properties";
import { useFavorites } from "@/lib/useFavorites";
import { PropertyCard } from "@/components/PropertyCard";
import { DashboardLayout, type NavItem } from "@/modules/dashboard/components/DashboardLayout";
import { RequireRole } from "@/modules/dashboard/components/RequireRole";
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
} from "@/modules/dashboard/components/DashboardKit";
import { TrendAreaChart, DonutChart } from "@/modules/dashboard/components/DashboardCharts";
import { displayName } from "@/lib/auth-session";
import { readRecentSearches, type RecentSearch } from "@/lib/dashboard-data";
import {
  Booking,
  Enquiry,
  BOOKINGS,
  ENQUIRIES,
  NOTIFICATIONS,
  VIEW_TREND,
  SEARCH_PARAMS,
} from "@/modules/customer/fixtures";
import {
  ListingGrid,
  RecentSearchesPanel,
  ProfilePanel,
  SettingsPanel,
} from "@/modules/customer/components/CustomerDashboardParts";

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
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

  const {
    data: feed,
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ["property-feed"], queryFn: fetchPropertyFeed });

  const properties = useMemo(() => feed?.properties ?? [], [feed]);
  const isSampleData = feed?.source === "fallback";

  const savedHomes = useMemo(() => properties.filter((p) => ids.includes(p.id)), [properties, ids]);
  const recentSearches = useMemo(() => readRecentSearches(), []);

  const filteredSaved = useMemo(() => {
    const q = savedQuery.trim().toLowerCase();
    if (!q) return savedHomes;
    return savedHomes.filter((p) => `${p.title} ${p.city} ${p.address}`.toLowerCase().includes(q));
  }, [savedHomes, savedQuery]);

  const visibleBookings = useMemo(() => {
    if (bookingFilter === "all") return BOOKINGS;
    if (bookingFilter === "upcoming") return BOOKINGS.filter((b) => b.status !== "Completed");
    return BOOKINGS.filter((b) => b.status === "Completed");
  }, [bookingFilter]);

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
          search={SEARCH_PARAMS}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-110"
        >
          <Search className="h-3.5 w-3.5" /> Browse homes
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
                label="Saved properties"
                numericValue={savedHomes.length}
                icon={<Heart className="h-4 w-4" />}
                accent="rose"
                hint="In your wishlist"
              />
              <KpiCard
                label="Upcoming visits"
                numericValue={BOOKINGS.filter((b) => b.status !== "Completed").length}
                icon={<Calendar className="h-4 w-4" />}
                accent="blue"
                trend={{ direction: "up", label: "1 tomorrow" }}
              />
              <KpiCard
                label="Active enquiries"
                numericValue={ENQUIRIES.length}
                icon={<MessageSquare className="h-4 w-4" />}
                accent="purple"
                hint="Avg reply < 15m"
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
                "Every listing is 0% brokerage, so the rent you see is the rent you pay.",
              ]}
            />
          )}

          <div>
            <SectionHeader title="Quick actions" subtitle="The things tenants do most" />
            <QuickActions
              actions={[
                {
                  id: "browse",
                  label: "Find a home",
                  hint: "Search verified listings",
                  icon: <Search className="h-4 w-4" />,
                  onClick: () => navigate({ to: "/properties", search: SEARCH_PARAMS }),
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
                  icon: <CalendarCheck className="h-4 w-4" />,
                  onClick: () => setActiveTab("bookings"),
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

          <div className="grid gap-6 lg:grid-cols-2">
            <TrendAreaChart
              title="Your search activity"
              subtitle="Listings viewed over the last 7 days"
              data={VIEW_TREND}
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
              <ActivityTimeline items={NOTIFICATIONS} />
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
                search={SEARCH_PARAMS}
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
                  search={SEARCH_PARAMS}
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
                      search={SEARCH_PARAMS}
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
            <ActivityTimeline items={NOTIFICATIONS} />
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
            title="Bookings & site visits"
            subtitle="Walkthroughs and video tours you've scheduled"
            action={
              <FilterChips
                active={bookingFilter}
                onChange={setBookingFilter}
                options={[
                  { id: "all", label: "All" },
                  { id: "upcoming", label: "Upcoming" },
                  { id: "past", label: "Completed" },
                ]}
              />
            }
          />
          {visibleBookings.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck className="h-6 w-6" />}
              title="No bookings in this view"
              hint="Schedule a visit from any property page and it will appear here."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleBookings.map((b) => (
                <div
                  key={b.id}
                  className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm transition hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <StatusPill
                      label={b.status}
                      tone={
                        b.status === "Confirmed"
                          ? "success"
                          : b.status === "Scheduled"
                            ? "info"
                            : "neutral"
                      }
                    />
                    <span className="text-[11px] font-medium text-muted-foreground">{b.mode}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-foreground">{b.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> {b.when}
                  </p>
                  <p className="mt-3 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                    Owner: <span className="font-semibold text-foreground">{b.owner}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "enquiries" && (
        <div className="space-y-5">
          <SectionHeader
            title="Your enquiries"
            subtitle="Messages you've sent to property owners"
          />
          <DataTable
            rows={ENQUIRIES}
            getKey={(e) => e.id}
            empty={
              <EmptyState
                icon={<MessageSquare className="h-6 w-6" />}
                title="No enquiries yet"
                hint="Message an owner from any listing to start a conversation."
              />
            }
            columns={[
              {
                key: "property",
                header: "Property",
                render: (e: Enquiry) => (
                  <span className="font-bold text-foreground">{e.title}</span>
                ),
              },
              {
                key: "message",
                header: "Message",
                render: (e: Enquiry) => (
                  <span className="text-muted-foreground">"{e.message}"</span>
                ),
              },
              {
                key: "sent",
                header: "Sent",
                render: (e: Enquiry) => (
                  <span className="whitespace-nowrap text-muted-foreground">{e.sent}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                className: "text-right",
                render: (e: Enquiry) => (
                  <StatusPill
                    label={e.status}
                    tone={e.status === "Owner responded" ? "success" : "warning"}
                  />
                ),
              },
            ]}
          />
        </div>
      )}

      {activeTab === "settings" && <SettingsPanel user={user} />}
    </DashboardLayout>
  );
}

/* ───────────────────────────── helper components ─────────────────────────── */
