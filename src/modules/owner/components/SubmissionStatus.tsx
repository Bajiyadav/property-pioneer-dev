import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  XCircle,
  PencilLine,
  AlertTriangle,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/navigation/BackLink";
import { deriveStage, type ListingStage } from "./listingStage";
import { RequestPropertyManagementDialog } from "./RequestPropertyManagementDialog";

/**
 * Step 8 — what the owner sees after submitting.
 *
 * The wizard used to drop the owner on /dashboard/owner with only a toast, so
 * the one moment they most need reassurance — "did that actually work, and what
 * happens now?" — was carried by a notification that disappears in four seconds.
 *
 * The status shown here is READ FROM THE DATABASE, never assumed from the fact
 * that a submit succeeded. `is_approved` is the authority: a listing is public
 * only when an admin has approved it, and this screen must never imply otherwise.
 */

interface StatusRow {
  id: string;
  title: string | null;
  status: string | null;
  is_approved: boolean | null;
  created_at: string | null;
  admin_notes: string | null;
}

const STAGES: Array<{ id: ListingStage; label: string }> = [
  { id: "submitted", label: "Submitted" },
  { id: "under_review", label: "Under review" },
  { id: "approved", label: "Published" },
];

const PRESENTATION: Record<
  ListingStage,
  { icon: typeof CheckCircle2; title: string; body: string; tone: string }
> = {
  draft: {
    icon: PencilLine,
    title: "Saved as a draft",
    body: "This listing has not been submitted yet. You can pick up where you left off any time.",
    tone: "text-muted-foreground",
  },
  submitted: {
    icon: CheckCircle2,
    title: "Listing submitted",
    body: "Your property has been submitted for verification. Nothing is public yet.",
    tone: "text-primary",
  },
  under_review: {
    icon: Clock,
    title: "Under review",
    body: "Our moderation team is checking your property details, photos and pricing. You will be notified once it is live.",
    tone: "text-amber-600 dark:text-amber-500",
  },
  approved: {
    icon: ShieldCheck,
    title: "Published",
    body: "Your listing is live and visible to buyers and tenants searching Seedha Properties.",
    tone: "text-primary",
  },
  rejected: {
    icon: XCircle,
    title: "Not approved",
    body: "This listing was not approved. The reason is shown below — you can correct it and resubmit.",
    tone: "text-destructive",
  },
  changes_required: {
    icon: AlertTriangle,
    title: "Changes required",
    body: "Our team needs something corrected before this listing can go live.",
    tone: "text-amber-600 dark:text-amber-500",
  },
};

function StageTrack({ stage }: { stage: ListingStage }) {
  // Rejected / changes-required are not points on the happy path, so the track
  // is not drawn for them — a progress bar would misrepresent the situation.
  if (stage === "rejected" || stage === "changes_required" || stage === "draft") return null;
  const reachedIndex = STAGES.findIndex((s) => s.id === stage);
  const activeIndex = reachedIndex === -1 ? 1 : reachedIndex;

  return (
    <div className="mt-6 flex items-center gap-2" aria-label="Listing progress">
      {STAGES.map((s, i) => {
        const done = i <= activeIndex;
        return (
          <div key={s.id} className="flex flex-1 flex-col gap-2">
            <div
              className={`h-1.5 rounded-full ${done ? "bg-primary" : "bg-muted"}`}
              aria-hidden="true"
            />
            <span
              className={`text-[11px] font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function SubmissionStatus({ propertyId }: { propertyId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["listing-status", propertyId],
    queryFn: async (): Promise<StatusRow | null> => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, status, is_approved, created_at, admin_notes")
        .eq("id", propertyId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as StatusRow | null) ?? null;
    },
    // The owner may sit on this screen while a moderator works.
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  // A listing the owner cannot read is not necessarily missing — RLS scopes
  // reads to the owner. Say what is actually known rather than "not found".
  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">We could not load this listing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may still be saving, or it may belong to a different account. Your dashboard shows
          every listing you own.
        </p>
        <Button asChild className="mt-6 rounded-xl">
          <Link to="/dashboard/owner">Go to my dashboard</Link>
        </Button>
      </div>
    );
  }

  const stage = deriveStage(data);
  const view = PRESENTATION[stage];
  const Icon = view.icon;
  const submitted = data.created_at ? new Date(data.created_at) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      {/* Deep-linked or refreshed, there is no history to pop — the dashboard
          is the correct parent for a listing status page. */}
      <BackLink fallbackTo="/dashboard/owner" label="Back" className="-ml-3 mb-3" />
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <Icon className={`h-10 w-10 ${view.tone}`} aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{view.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{view.body}</p>

        <StageTrack stage={stage} />

        <dl className="mt-7 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Property
            </dt>
            <dd className="mt-1 text-sm font-medium">{data.title || "Untitled listing"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Listing ID
            </dt>
            <dd className="mt-1 font-mono text-xs">{data.id.slice(0, 8)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Submitted
            </dt>
            <dd className="mt-1 text-sm">
              {submitted
                ? submitted.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </dd>
          </div>
        </dl>

        {/* Only rendered when a moderator actually wrote one. */}
        {data.admin_notes && data.admin_notes.trim().length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-500">
              What our team asked for
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">{data.admin_notes}</p>
          </div>
        )}

        {/* Locality Seeker Demand & Fast-Track Boost Card */}
        <div className="mt-7 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-amber-500/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Sparkles className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span>Active Seeker Demand in Your Locality</span>
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
              High Demand
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            🔥 <strong>18+ verified seekers</strong> are currently searching for verified homes in
            your area. Upgrade to <strong>Fast-Track Promotion</strong> to notify active seekers and
            get featured top-slot placement.
          </p>
          <div className="pt-1">
            <Button
              asChild
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-extrabold text-xs shadow-sm hover:brightness-110"
            >
              <Link to="/list-property/promote/$id" params={{ id: data.id }}>
                <Sparkles className="mr-2 h-4 w-4" /> Fast-Track My Listing (₹499)
              </Link>
            </Button>
          </div>
        </div>

        {/* Seedha Property & Rental Management CTA Card */}
        <div className="mt-5 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-background p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-primary">
                <ShieldCheck className="h-4 w-4" /> End-to-End Rental Management
              </span>
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Want Seedha to manage this property for you?
              </h3>
            </div>
            <span className="self-start sm:self-auto text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
              Zero Tenant Hassles
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Turn your asset into completely passive income. Our certified property managers screen
            tenants with police verification, collect rent on-time, perform scheduled physical
            inspections, and resolve 100% of maintenance requests.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-foreground sm:grid-cols-4">
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5">
              <span className="text-primary font-bold">✓</span> Police Verified
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5">
              <span className="text-primary font-bold">✓</span> On-Time Payouts
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5">
              <span className="text-primary font-bold">✓</span> Video Audits
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5">
              <span className="text-primary font-bold">✓</span> 24/7 Repairs
            </div>
          </div>

          <div className="pt-2">
            <RequestPropertyManagementDialog
              propertyId={data.id}
              propertyTitle={data.title || "Your Property"}
              triggerButton={
                <Button className="w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Request Property Management
                </Button>
              }
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {(stage === "rejected" || stage === "changes_required" || stage === "draft") && (
            <Button asChild className="rounded-xl">
              <Link
                to="/list-property/wizard"
                search={{ propertyType: "Residential", intent: "Rent" }}
              >
                <PencilLine className="mr-2 h-4 w-4" /> Edit listing
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/dashboard/owner">
              <LayoutDashboard className="mr-2 h-4 w-4" /> My dashboard
            </Link>
          </Button>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Seedha Properties charges no platform brokerage on this listing.
      </p>
    </div>
  );
}
