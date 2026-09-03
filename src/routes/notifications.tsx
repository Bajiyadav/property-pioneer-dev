import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Building2,
  Heart,
  Calendar,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

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

interface NotificationItem {
  id: string;
  category: "property" | "enquiry" | "visit" | "payment" | "system";
  title: string;
  message: string;
  time: string;
  unread: boolean;
  link?: string;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    category: "visit",
    title: "Visit Confirmed by Owner",
    message:
      "Your in-person walkthrough request for 2 BHK Apartment in Madhapur was confirmed for tomorrow at 4:00 PM.",
    time: "10 mins ago",
    unread: true,
    link: "/properties",
  },
  {
    id: "notif-2",
    category: "property",
    title: "New Match in Gachibowli",
    message:
      "A newly verified 3 BHK Standalone Villa matching your budget was just posted with 0% brokerage.",
    time: "2 hours ago",
    unread: true,
    link: "/properties",
  },
  {
    id: "notif-3",
    category: "enquiry",
    title: "Direct Owner Message",
    message:
      "The property owner shared direct contact details for your scheduled visit in Kondapur.",
    time: "Yesterday",
    unread: false,
    link: "/properties",
  },
  {
    id: "notif-4",
    category: "system",
    title: "Account Security Verified",
    message:
      "Your profile phone verification is active and eligible for 3 free direct owner contacts.",
    time: "2 days ago",
    unread: false,
  },
];

function NotificationsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const filtered =
    filter === "all" ? notifications : notifications.filter((n) => n.category === filter);

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
              onClick={markAllRead}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
            >
              Mark all as read
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
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center bg-card/40">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="mt-3 text-base font-bold text-foreground">
                No notifications in this category
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You're all caught up with your real estate updates.
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
                  <p className="text-xs text-foreground/80 mt-1 leading-relaxed">{item.message}</p>
                  {item.link && (
                    <Link
                      to={item.link}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 mt-2"
                    >
                      <span>View Details →</span>
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
