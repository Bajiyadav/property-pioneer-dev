import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Building2, Calendar, ShieldCheck, MessageSquare, AlertTriangle } from "lucide-react";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/notifications")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/notifications");
    const ogImage = getOgImageUrl();
    const title = `Notification Center — ${APP_NAME}`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Stay updated with property alerts, visit confirmations, and inquiries on ${APP_NAME}.`,
        },
        { property: "og:title", content: title },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: APP_NAME },
        { name: "robots", content: "noindex" },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: NotificationsPage,
});

type Category = "property" | "enquiry" | "visit" | "system";

interface NotificationRow {
  id: string;
  title: string | null;
  body: string | null;
  message: string | null;
  kind: string | null;
  type: string | null;
  link_url: string | null;
  read_at: string | null;
  is_read: boolean | null;
  created_at: string;
}

interface NotificationItem {
  id: string;
  category: Category;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  /** Only set when the notification actually points somewhere specific. */
  link?: string;
}

/**
 * Maps a stored notification's kind/type to a display category. The writers use
 * free-text `kind` ("info") and an optional `type`; anything unrecognised falls
 * back to "system" rather than guessing a category that would mislead the icon.
 */
function toCategory(row: NotificationRow): Category {
  const key = `${row.type ?? ""} ${row.kind ?? ""} ${row.title ?? ""}`.toLowerCase();
  if (key.includes("visit")) return "visit";
  if (key.includes("enquir") || key.includes("lead") || key.includes("inquir")) return "enquiry";
  if (key.includes("propert") || key.includes("listing") || key.includes("match"))
    return "property";
  return "system";
}

/**
 * Only returns a destination the notification genuinely refers to. The previous
 * version sent every "View details" to the generic /properties list, which is
 * exactly the dead-end this avoids: no link is better than a wrong one.
 */
function toLink(row: NotificationRow): string | undefined {
  const url = (row.link_url ?? "").trim();
  // Same-origin internal paths only — never an off-site or protocol-relative URL.
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return undefined;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

function NotificationsPage() {
  const [filter, setFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async (): Promise<NotificationItem[]> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return [];

      // `message`, `type`, `link_url` and `is_read` are staging-compatibility
      // columns (migration 002) that the generated Supabase types don't know
      // about yet, so the query is cast the same way the rest of the app casts
      // for these columns (e.g. the customer dashboard's visit_schedules read).
      const { data, error } = await (supabase.from as any)("notifications")
        .select("id,title,body,message,kind,type,link_url,read_at,is_read,created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw new Error(error.message);

      return ((data ?? []) as NotificationRow[]).map((row) => ({
        id: row.id,
        category: toCategory(row),
        title: row.title ?? "Notification",
        message: row.message ?? row.body ?? "",
        time: relativeTime(row.created_at),
        unread: row.read_at == null && row.is_read !== true,
        link: toLink(row),
      }));
    },
    staleTime: 30_000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) return;
      const { error } = await (supabase.from as any)("notifications")
        .update({ read_at: new Date().toISOString(), is_read: true })
        .eq("user_id", uid)
        .is("read_at", null);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications.filter((n) => n.unread).length;
  const filtered = useMemo(
    () => (filter === "all" ? notifications : notifications.filter((n) => n.category === filter)),
    [filter, notifications],
  );

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-border/70">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-[family-name:var(--font-display)]">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-600 text-white text-xs font-extrabold px-2.5 py-0.5">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time property updates, visit confirmations, and enquiry alerts
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition cursor-pointer disabled:opacity-60"
            >
              {markAllRead.isPending ? "Marking…" : "Mark all as read"}
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {[
            { id: "all", label: "All Alerts" },
            { id: "visit", label: "Visit Reminders" },
            { id: "property", label: "Property Updates" },
            { id: "enquiry", label: "Enquiries" },
            { id: "system", label: "System Alerts" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filter === tab.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="space-y-3 mt-4">
          {isLoading ? (
            // Loading: skeleton rows so the page never sits blank.
            <div className="space-y-3" aria-busy="true" aria-live="polite">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl border border-border/60 bg-card flex items-start gap-3.5 animate-pulse"
                >
                  <div className="h-10 w-10 rounded-xl bg-muted flex-none" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded bg-muted" />
                    <div className="h-3 w-4/5 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            // Error: explain and offer a retry — never a raw error string.
            <div className="rounded-3xl border border-dashed border-amber-500/50 p-12 text-center bg-amber-500/5">
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-600" />
              <p className="mt-3 text-base font-bold text-foreground">
                We couldn&apos;t load your notifications
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This is usually temporary. Please check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            // Empty: a real, reassuring empty state — not a blank screen.
            <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center bg-card/40">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="mt-3 text-base font-bold text-foreground">
                {filter === "all"
                  ? "You have no notifications yet"
                  : "No notifications in this category"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {filter === "all"
                  ? "Enquiries, visit confirmations and property updates will appear here."
                  : "You're all caught up with your real estate updates."}
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  item.unread
                    ? "border-emerald-500/40 bg-emerald-500/5 shadow-xs"
                    : "border-border/60 bg-card"
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center flex-none ${
                    item.category === "visit"
                      ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50"
                      : item.category === "property"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-950/50"
                        : item.category === "enquiry"
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50"
                          : "bg-amber-100 text-amber-600 dark:bg-amber-950/50"
                  }`}
                >
                  {item.category === "visit" && <Calendar className="h-5 w-5" />}
                  {item.category === "property" && <Building2 className="h-5 w-5" />}
                  {item.category === "enquiry" && <MessageSquare className="h-5 w-5" />}
                  {item.category === "system" && <ShieldCheck className="h-5 w-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-extrabold text-foreground">
                      {item.title}
                    </h3>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {item.time}
                    </span>
                  </div>
                  {item.message && (
                    <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                  )}
                  {item.link && (
                    <Link
                      to={item.link}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 mt-2"
                    >
                      <span>View details →</span>
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
