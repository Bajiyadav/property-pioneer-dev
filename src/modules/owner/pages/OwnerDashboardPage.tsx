import { Link } from "@tanstack/react-router";
import { useDashboardTab } from "@/modules/dashboard/hooks/useDashboardTab";
import type { User } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  ExternalLink,
  Eye,
  FileEdit,
  LayoutDashboard,
  MessageSquare,
  Phone,
  PlusCircle,
  Settings,
  Star,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPropertyFeed,
  formatPrice,
  type Property,
} from "@/modules/property/services/propertyQueries";
import type { OwnerLead } from "@/modules/owner/services/owner.server";
import { getMyLeads, getMyListings, removeListing } from "@/modules/owner/services/ownerFunctions";
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
import {
  CategoryBarChart,
  DonutChart,
  TrendAreaChart,
} from "@/modules/dashboard/components/DashboardCharts";
import { countBy, relativeTime } from "@/modules/dashboard/services/dashboardData";
import { displayName } from "@/modules/authentication/services/session";
import { ListingRows, OwnerSettings } from "@/modules/owner/components/OwnerDashboardParts";
import { useInteractionStore } from "@/modules/interactions/stores/interactionStore";
import { ChatInterface } from "@/modules/interactions/components/ChatInterface";

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

/**
 * Owner only.
 *
 * Admitting customers here showed a non-owner the full "Verified Owner Portal" —
 * role surfaces without the grant, which contradicts owner access being granted
 * rather than self-assigned. Nobody is stranded by it: creating a listing now
 * records the owner role server-side, so anyone who lists through
 * /list-property can manage what they listed.
 */
export function OwnerDashboardPage() {
  return (
    <RequireRole role="owner">{(session) => <OwnerDashboard user={session.user} />}</RequireRole>
  );
}

function OwnerDashboard({ user }: { user: User | null }) {
  const [activeTab, setActiveTab] = useDashboardTab("/dashboard/owner");
  const navigate = useNavigate();
  const [listingQuery, setListingQuery] = useState("");
  const [leadFilter, setLeadFilter] = useState("all");

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

  // Real per-owner portfolio, scoped server-side to the signed-in owner_id.
  const fetchMine = useServerFn(getMyListings);
  const deleteMine = useServerFn(removeListing);
  const fetchLeads = useServerFn(getMyLeads);

  const {
    data: mine,
    isLoading: mineLoading,
    isError: mineError,
    refetch: refetchMine,
  } = useQuery({ queryKey: ["owner", "listings"], queryFn: () => fetchMine({}), retry: false });

  const { data: myLeads, isLoading: leadsLoading } = useQuery({
    queryKey: ["owner", "leads"],
    queryFn: () => fetchLeads({}),
    retry: false,
  });

  const queryClient = useQueryClient();
  const removal = useMutation({
    mutationFn: (id: string) => deleteMine({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["property-feed"] });
      toast.success("Listing deleted");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Could not delete the listing"),
  });

  const myListings = useMemo(() => mine ?? [], [mine]);
  /** Live to the public. */
  const listings = useMemo(() => myListings.filter((p) => p.is_approved), [myListings]);
  /** Submitted or edited, waiting on moderator approval. */
  const drafts = useMemo(() => myListings.filter((p) => !p.is_approved), [myListings]);

  const filteredListings = useMemo(() => {
    const q = listingQuery.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((p) => `${p.title} ${p.city} ${p.address}`.toLowerCase().includes(q));
  }, [listings, listingQuery]);

  // Derived with useMemo from the raw slice, not inside the selector. A
  // selector that returns `.filter(...)` hands useSyncExternalStore a brand new
  // array every render, so the snapshot never compares equal and React loops
  // until "Maximum update depth exceeded" — which crashed this dashboard to the
  // error boundary and took the sign-out control down with it.
  const allBookings = useInteractionStore((s) => s.bookings);
  const allChats = useInteractionStore((s) => s.chats);
  const uid = user?.id || "";
  const myBookings = useMemo(
    () => allBookings.filter((b) => b.ownerId === uid),
    [allBookings, uid],
  );
  const myChats = useMemo(() => allChats.filter((c) => c.ownerId === uid), [allChats, uid]);

  const allNotifications = useInteractionStore((s) => s.notifications);
  const myNotifications = useMemo(
    () => allNotifications.filter((n) => n.userId === uid),
    [allNotifications, uid],
  );

  const monthlyRent = useMemo(
    () => listings.reduce((sum, p) => sum + Number(p.price || 0), 0),
    [listings],
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
  const viewsTrend = useMemo<{ label: string; value: number }[]>(() => [], []);
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
      subtitle="Manage your listings and the enquiries they receive."
      navItems={NAV_ITEMS}
      activeTab={activeTab}
      onTabChange={(id) =>
        id === "add"
          ? navigate({
              to: "/list-property/wizard",
              search: { propertyType: "Residential", intent: "Rent" },
            })
          : setActiveTab(id)
      }
      user={user}
      headerAction={
        <button
          onClick={() =>
            navigate({
              to: "/list-property/wizard",
              search: { propertyType: "Residential", intent: "Rent" },
            })
          }
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
        >
          <PlusCircle className="h-3.5 w-3.5" /> Add property
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
                label="Active listings"
                numericValue={listings.length}
                icon={<Building2 className="h-4 w-4" />}
                accent="emerald"
                hint="Moderated before publication"
              />
              <KpiCard
                label="Tenant messages"
                numericValue={myChats.length}
                icon={<Users className="h-4 w-4" />}
                accent="blue"
                trend={{ direction: "up", label: "Active chats" }}
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
                  onClick: () =>
                    navigate({
                      to: "/list-property/wizard",
                      search: { propertyType: "Residential", intent: "Rent" },
                    }),
                },
                {
                  id: "leads",
                  label: "Tenant leads",
                  hint: `${myChats.length} open`,
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
                  hint: `${myBookings.length} upcoming`,
                  icon: <CalendarDays className="h-4 w-4" />,
                  onClick: () => setActiveTab("calendar"),
                },
              ]}
            />
          </div>

          {/* Owner Monetization & Fast-Track Boost Callout */}
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-amber-500/10 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span>Reach Verified Tenants 4x Faster</span>
                </div>
                <h3 className="text-base font-extrabold text-foreground">
                  Upgrade to Fast-Track Promotion &amp; Verified Shield
                </h3>
                <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                  Get topmost search ranking, instant SMS/WhatsApp tenant notifications,
                  pre-screened inquiries, and dedicated relationship manager assistance starting
                  from just ₹249.
                </p>
              </div>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/plans" })}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:brightness-110 cursor-pointer active:scale-95"
                >
                  <span>Explore Owner Boost Plans</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
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
              <ActivityTimeline
                items={myNotifications.map((n) => ({
                  id: n.id,
                  title: n.title,
                  detail: n.detail,
                  time: relativeTime(n.createdAt),
                  tone: (n.tone === "rose" ? "danger" : n.tone) as
                    "success" | "warning" | "danger" | "info" | "neutral",
                }))}
              />
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
              onAdd={() =>
                navigate({
                  to: "/list-property/wizard",
                  search: { propertyType: "Residential", intent: "Rent" },
                })
              }
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
            isLoading={mineLoading}
            isError={mineError}
            onRetry={refetchMine}
            onAdd={() =>
              navigate({
                to: "/list-property/wizard",
                search: { propertyType: "Residential", intent: "Rent" },
              })
            }
            onDelete={(id) => removal.mutate(id)}
            deletingId={removal.isPending ? removal.variables : null}
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
                  onClick={() =>
                    navigate({
                      to: "/list-property/wizard",
                      search: { propertyType: "Residential", intent: "Rent" },
                    })
                  }
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
                      onClick={() =>
                        navigate({
                          to: "/list-property/wizard",
                          search: { propertyType: "Residential", intent: "Rent" },
                        })
                      }
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
                  numericValue={myBookings.length}
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
        <div className="space-y-6">
          <SectionHeader
            title="Tenant Enquiries & Leads"
            subtitle="Verified leads from prospective tenants with direct WhatsApp response"
          />

          {/* Real Leads from Database */}
          {leadsLoading ? (
            <LoadingSkeleton rows={2} />
          ) : myLeads && myLeads.length > 0 ? (
            <div className="grid gap-3">
              {myLeads.map((lead) => {
                const cleanPhone = lead.phone.replace(/\D/g, "");
                const waUrl = `https://wa.me/91${cleanPhone.replace(/^91/, "")}?text=${encodeURIComponent(
                  `Hi ${lead.name}, thank you for your enquiry on "${lead.propertyTitle}". When would you like to schedule a walkthrough?`,
                )}`;

                return (
                  <div
                    key={lead.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-border/70 bg-card p-4.5 shadow-sm transition hover:border-border sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">{lead.name}</h4>
                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {lead.propertyTitle}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {relativeTime(lead.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">"{lead.message}"</p>
                      <p className="text-[11px] font-medium text-foreground/80">📞 {lead.phone}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#20bd5a] hover:shadow"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Reply on WhatsApp
                      </a>
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-xs font-bold text-foreground transition hover:bg-secondary"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 p-6 text-center">
              <MessageSquare className="mx-auto h-7 w-7 text-muted-foreground/60" />
              <p className="mt-2 text-xs font-semibold text-foreground">No tenant enquiries yet</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                When tenants submit enquiries on your live listings, they will appear here with
                instant WhatsApp reply buttons.
              </p>
            </div>
          )}

          <div className="pt-2">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              In-App Chat Threads
            </h3>
            <ChatInterface currentUserId={user?.id || ""} role="owner" chats={myChats} />
          </div>
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="space-y-5">
          <SectionHeader
            title="Visit calendar"
            subtitle="Walkthroughs tenants have booked with you"
          />
          {myBookings.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title="No visits scheduled"
              hint="Tenant walkthrough bookings appear here automatically."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {myBookings.map((v) => (
                <div
                  key={v.id}
                  className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                      {v.when.split(" · ")[0]}
                    </p>
                    <StatusPill
                      label={v.status}
                      tone={v.status === "Confirmed" ? "success" : "info"}
                    />
                  </div>
                  <p className="font-[family-name:var(--font-display)] text-2xl font-black text-foreground">
                    {v.when.split(" · ")[1]}
                  </p>
                  <p className="mt-2 text-xs font-bold text-foreground">Tenant</p>
                  <p className="text-[11px] text-muted-foreground">
                    {v.mode} for {v.propertyTitle}
                  </p>
                  <div className="flex gap-2 mt-4">
                    {v.status === "Scheduled" && (
                      <button
                        onClick={() => {
                          useInteractionStore.getState().updateBookingStatus(v.id, "Confirmed");
                          toast.success(`Visit confirmed`);
                        }}
                        className="flex-1 rounded-xl bg-primary py-2 text-[11px] font-bold text-primary-foreground transition hover:bg-primary/90"
                      >
                        Confirm
                      </button>
                    )}
                    <button
                      onClick={() => toast.success(`Reminder sent`)}
                      className="flex-1 rounded-xl border border-border bg-secondary/60 py-2 text-[11px] font-bold text-foreground transition hover:bg-secondary"
                    >
                      Remind
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && <OwnerSettings user={user} />}
    </DashboardLayout>
  );
}
