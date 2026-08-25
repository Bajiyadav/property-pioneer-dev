import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Sparkles, ImageOff, ArrowRight, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/navigation/BackLink";
import { formatPrice } from "@/modules/property/services/propertyQueries";
import {
  VISIBILITY_PLANS,
  formatVisibilityInr,
  type VisibilityPlan,
} from "@/config/visibilityPlans";

/**
 * Step 9 — the optional visibility offer, shown AFTER a free submission.
 *
 * The business rule this screen exists to express: listing is free and carries
 * no brokerage. Promotion is an optional extra, offered once the owner has
 * already succeeded, never as a condition of publishing. "Continue with the
 * free listing" is therefore a real, equally-weighted action, not a dismissal
 * link, and it is never styled as the lesser choice.
 *
 * DELIBERATELY ABSENT: countdowns, "only N slots left", "your listing may be
 * missed", struck-through fake discounts, and any guarantee of tenants or
 * enquiries. Seedha's positioning is zero-brokerage and direct; a promotion
 * that behaves like a brokerage upsell would undermine the one claim the whole
 * product rests on.
 *
 * The plans differ ONLY by how long the featured window lasts. See
 * config/visibilityPlans.ts for why that is the only honest difference.
 */

interface PropertyRow {
  id: string;
  title: string | null;
  locality: string | null;
  city: string | null;
  price: number | null;
  listing_type: string | null;
  images: string[] | null;
  is_featured: boolean | null;
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: VisibilityPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-2xl border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold tabular-nums">
              {formatVisibilityInr(plan.priceInr)}
            </span>
            {/* Quiet label. Deliberately not a loud colour-flooded ribbon. */}
            {plan.recommended && (
              <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-semibold">{plan.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{plan.tagline}</p>
        </div>
        <span
          aria-hidden="true"
          className={`mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full border ${
            selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
          }`}
        >
          {selected && <Check className="h-3 w-3" />}
        </span>
      </div>

      <p className="mt-3 text-xs font-medium text-foreground">
        Featured for {plan.durationDays} days
      </p>
      <ul className="mt-2 space-y-1.5">
        {plan.benefits.map((b) => (
          <li key={b} className="flex items-start gap-2 text-xs">
            <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-primary" aria-hidden="true" />
            <span className="leading-relaxed text-muted-foreground">{b}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}

export function PromoteListing({ propertyId }: { propertyId: string }) {
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["promote-listing", propertyId],
    queryFn: async (): Promise<PropertyRow | null> => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, locality, city, price, listing_type, images, is_featured")
        .eq("id", propertyId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as PropertyRow | null) ?? null;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  const cover = data?.images?.[0] ?? null;
  const place = [data?.locality, data?.city].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <BackLink
        fallbackTo="/list-property/submitted/$id"
        fallbackParams={{ id: propertyId }}
        label="Back"
        className="-ml-3 mb-3"
      />

      {/* The free listing is the headline, not the upsell. */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Submitted · Free
          </span>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
            0% brokerage
          </span>
        </div>
        <h1 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
          Your property has been submitted for verification
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Your listing is free to publish after moderation. You do not need to pay anything.
        </p>
      </div>

      {/* The owner's own property, using their own photo. Never a stock stand-in. */}
      <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
        {cover ? (
          <img
            src={cover}
            alt={data?.title ?? "Your property"}
            width={132}
            height={99}
            loading="lazy"
            className="h-[99px] w-full rounded-xl object-cover sm:w-[132px]"
          />
        ) : (
          <div className="flex h-[99px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground sm:w-[132px]">
            <ImageOff className="h-5 w-5" aria-hidden="true" />
            <span className="text-[11px] font-medium">No photos yet</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{data?.title || "Your listing"}</p>
          {place && <p className="mt-0.5 truncate text-xs text-muted-foreground">{place}</p>}
          {typeof data?.price === "number" && data.price > 0 && (
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {formatPrice(data.price, data.listing_type ?? "rent")}
            </p>
          )}
        </div>
      </div>

      {!cover && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Adding real photos does more for enquiries than any paid placement, and it costs nothing.
        </p>
      )}

      <div className="mt-9">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          Want more visibility?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Get your property in front of more relevant property seekers. Optional — it never changes
          brokerage, and it does not affect moderation.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {VISIBILITY_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedPlanId === plan.id}
            onSelect={() => setSelectedPlanId(plan.id)}
          />
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3.5">
        <Info className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Promotion improves where your listing appears. It cannot guarantee enquiries, visits or a
          tenant — anyone promising that is guessing.
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button
          className="rounded-xl"
          disabled={!selectedPlanId}
          onClick={() => {
            if (!selectedPlanId) return;
            navigate({
              to: "/list-property/promote/$id/checkout",
              params: { id: propertyId },
              search: { plan: selectedPlanId },
            });
          }}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {/* Equal weight, never a whispered link. */}
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/list-property/submitted/$id" params={{ id: propertyId }}>
            Continue with Free Listing
          </Link>
        </Button>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Seedha Properties charges no platform brokerage on this listing.
      </p>
    </div>
  );
}
