import { BellRing } from "lucide-react";
import type { RecentSearch } from "@/modules/dashboard/services/dashboardData";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { ArrowRight, Heart, History, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard } from "@/modules/property/components/PropertyCard";
import type { Property } from "@/modules/property/services/propertyQueries";
import { displayName } from "@/modules/authentication/services/session";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  SectionHeader,
} from "@/modules/dashboard/components/DashboardKit";
import { SEARCH_PARAMS } from "@/modules/customer/fixtures";

export function ListingGrid({
  items,
  isLoading,
  isError,
  onRetry,
  emptyTitle,
  emptyHint,
  action,
}: {
  items: Property[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  emptyTitle: string;
  emptyHint: string;
  action?: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-72 animate-pulse rounded-3xl border border-border/50 bg-secondary/40"
          />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (items.length === 0)
    return (
      <EmptyState
        icon={<Heart className="h-6 w-6" />}
        title={emptyTitle}
        hint={emptyHint}
        action={action}
      />
    );

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  );
}

export function RecentSearchesPanel({ searches }: { searches: RecentSearch[] }) {
  return (
    <div className="space-y-5">
      <SectionHeader
        title={`Recent searches (${searches.length})`}
        subtitle="Jump straight back into a search you ran earlier"
      />
      {searches.length === 0 ? (
        <EmptyState
          icon={<History className="h-6 w-6" />}
          title="No searches yet"
          hint="Run a search and we'll keep it here so you can pick up where you left off."
          action={
            <Link
              to="/properties"
              search={SEARCH_PARAMS}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground"
            >
              <Search className="h-3.5 w-3.5" /> Start a search
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {searches.map((s) => (
            <Link
              key={s.id}
              to="/properties"
              search={{
                q: s.q,
                city: s.city,
                listing: s.listing,
                minPrice: s.minPrice,
                maxPrice: s.maxPrice,
                beds: s.beds,
              }}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/50"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-foreground">
                  {s.q || s.city || "All homes"}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {[s.city, s.listing, s.beds ? `${s.beds}+ BHK` : null]
                    .filter(Boolean)
                    .join(" · ") || "No filters"}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 flex-none text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProfilePanel({ user }: { user: User | null }) {
  const meta = user?.user_metadata ?? {};
  const rows = [
    { label: "Full name", value: displayName(user) },
    { label: "Email", value: user?.email ?? "—" },
    { label: "Mobile", value: (meta.phone as string) ?? "Not added" },
    { label: "Account type", value: "Tenant & Buyer" },
    {
      label: "Member since",
      value: user?.created_at
        ? new Date(user.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "—",
    },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader title="Profile" subtitle="Your account details on Urban Properties" />
      <div className="grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
        {rows.map((r) => (
          <div key={r.label} className="rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {r.label}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">{r.value}</p>
          </div>
        ))}
      </div>
      <Link
        to="/profile"
        className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
      >
        Open full profile page <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

export function SettingsPanel({ user }: { user: User | null }) {
  const [name, setName] = useState((user?.user_metadata?.full_name as string) ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState(true);

  return (
    <div className="space-y-5">
      <SectionHeader title="Settings" subtitle="Manage your account and alert preferences" />

      <form
        className="max-w-xl space-y-4 rounded-3xl border border-border/60 bg-card p-6 text-xs"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          const { error } = await supabase.auth.updateUser({
            email,
            data: { full_name: name },
          });
          setSaving(false);
          if (error) toast.error(error.message);
          else toast.success("Profile updated successfully");
        }}
      >
        <div>
          <label htmlFor="c-name" className="mb-1 block font-semibold text-muted-foreground">
            Full name
          </label>
          <input
            id="c-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1 block font-semibold text-muted-foreground">
            Email address
          </label>
          <input
            id="c-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

      <div className="flex max-w-xl items-center justify-between rounded-3xl border border-border/60 bg-card p-5">
        <div className="flex items-start gap-3">
          <BellRing className="mt-0.5 h-4 w-4 flex-none text-primary" />
          <div>
            <p className="text-xs font-bold text-foreground">Price-drop alerts</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Get notified when a saved home reduces its rent.
            </p>
          </div>
        </div>
        <button
          role="switch"
          aria-checked={alerts}
          aria-label="Toggle price-drop alerts"
          onClick={() => {
            setAlerts((v) => !v);
            toast.success(`Price-drop alerts ${alerts ? "disabled" : "enabled"}`);
          }}
          className={`relative h-6 w-11 flex-none rounded-full transition ${alerts ? "bg-primary" : "bg-muted"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${alerts ? "left-[22px]" : "left-0.5"}`}
          />
        </button>
      </div>
    </div>
  );
}
