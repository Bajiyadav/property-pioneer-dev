import { PropertyImage } from "@/shared/components/PropertyImage";

import { CreditCard, Star } from "lucide-react";
import { SectionHeader } from "@/modules/dashboard/components/DashboardKit";
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Building2, Eye, FileEdit, PlusCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, type Property } from "@/modules/property/services/propertyQueries";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  StatusPill,
} from "@/modules/dashboard/components/DashboardKit";
const DEFAULT_SEARCH_PARAMS = {
  q: "",
  city: "Hyderabad",
  listing: "rent",
  minPrice: 0,
  maxPrice: 0,
  beds: 0,
} as const;

// Narrow structural type rather than `any`: this only ever needs the images
// array, and typing it that way keeps the call sites checked.
const getListingImage = (p: { images?: string[] | null }) =>
  p.images && p.images.length > 0 ? p.images[0] : "";

export function ListingRows({
  listings,
  isLoading,
  isError,
  onRetry,
  onAdd,
  onDelete,
  deletingId,
}: {
  listings: Property[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onAdd: () => void;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
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
            <PropertyImage
              src={getListingImage(p)}
              alt={p.title}
              watermarkSize="xs"
              watermarkPosition="bottom-right"
              containerClassName="h-14 w-20 flex-none rounded-xl bg-muted"
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
                search={DEFAULT_SEARCH_PARAMS}
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
              {onDelete && (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${p.title}"? This cannot be undone.`))
                      onDelete(p.id);
                  }}
                  disabled={deletingId === p.id}
                  aria-label={`Delete ${p.title}`}
                  className="rounded-xl border border-border bg-secondary/50 p-2 text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OwnerSettings({ user }: { user: User | null }) {
  const [name, setName] = useState(
    (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || "",
  );
  const [phone, setPhone] = useState((user?.user_metadata?.phone as string) || user?.phone || "");
  const [saving, setSaving] = useState(false);

  // Load authoritative profile data from public.profiles
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setName(data.full_name);
        if (data?.phone) setPhone(data.phone);
      });
  }, [user?.id]);

  return (
    <div className="space-y-5">
      <SectionHeader title="Settings" subtitle="Owner profile and payout preferences" />

      <form
        className="max-w-xl space-y-4 rounded-3xl border border-border/60 bg-card p-6 text-xs"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!user?.id) return;
          setSaving(true);
          try {
            // Update auth user metadata
            await supabase.auth.updateUser({
              data: { full_name: name, phone },
            });
            // Update public.profiles row
            const { error: profErr } = await supabase
              .from("profiles")
              .update({ full_name: name, phone, updated_at: new Date().toISOString() })
              .eq("id", user.id);
            if (profErr) throw profErr;

            toast.success("Owner profile updated successfully!");
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to update profile";
            toast.error(msg);
          } finally {
            setSaving(false);
          }
        }}
      >
        <div>
          <label htmlFor="o-email" className="mb-1 block font-semibold text-muted-foreground">
            Account email
          </label>
          <input
            id="o-email"
            value={user?.email || ""}
            disabled
            className="w-full rounded-xl border border-border bg-secondary/30 px-3 py-2 text-muted-foreground cursor-not-allowed outline-none"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Your verified login identity managed by Supabase Auth.
          </p>
        </div>
        <div>
          <label htmlFor="o-name" className="mb-1 block font-semibold text-muted-foreground">
            Full name
          </label>
          <input
            id="o-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
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
              Connect a bank account to collect rent directly through Seedha Properties with
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
