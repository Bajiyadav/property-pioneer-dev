import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  Building2,
  Heart,
  Calendar,
  Settings,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/notifications")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/notifications");
    const ogImage = getOgImageUrl();
    const title = `Notifications — ${APP_NAME}`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Stay updated with property alerts, visit confirmations, and market news on ${APP_NAME}.`,
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

const NOTIFICATION_TYPES = [
  {
    icon: Heart,
    label: "Saved Property Alerts",
    desc: "Get notified when prices change on your saved homes.",
    color: "text-rose-500 bg-rose-500/10",
  },
  {
    icon: Building2,
    label: "New Listings",
    desc: "Instant alerts when new properties match your search criteria.",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: Calendar,
    label: "Visit Confirmations",
    desc: "Booking confirmations, reminders, and owner responses.",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: Settings,
    label: "Account & Legal",
    desc: "Agreement updates, payment receipts, and security alerts.",
    color: "text-amber-500 bg-amber-500/10",
  },
];

function NotificationsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-violet-900/20 via-background to-background px-6 py-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-800/10 to-transparent" />
        <div className="relative mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-violet-400">
            <Bell className="h-3 w-3" /> Smart Notifications
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Never Miss an <span className="text-violet-400">Opportunity</span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-lg mx-auto">
            Real-time alerts for price changes, new listings, visit confirmations, and more —
            delivered to your device instantly.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Sign in prompt */}
        <div className="mb-10 rounded-3xl border border-violet-500/20 bg-violet-500/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-400 mb-2">
              <Clock className="h-3 w-3" /> Coming Soon
            </div>
            <h2 className="text-sm font-extrabold text-foreground">Notification Centre</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Sign in to manage your notification preferences and view all alerts.
            </p>
          </div>
          <Link
            to="/auth"
            className="flex-none rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-violet-500 transition flex items-center gap-1.5"
          >
            Sign In <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Notification type cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {NOTIFICATION_TYPES.map((n) => (
            <div key={n.label} className="rounded-2xl border border-border/60 bg-card p-5">
              <div
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${n.color}`}
              >
                <n.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-2 text-xs font-extrabold text-foreground">{n.label}</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">{n.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCheck className="h-4 w-4" /> All notifications are end-to-end encrypted
          </div>
        </div>
      </div>
    </div>
  );
}
