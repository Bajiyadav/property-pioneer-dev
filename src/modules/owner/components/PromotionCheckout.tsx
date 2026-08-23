import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ImageOff, Info, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/shared/components/navigation/BackLink";
import { findVisibilityPlan, formatVisibilityInr } from "@/config/visibilityPlans";
import {
  getPromotionAvailability,
  createPromotionCheckout,
} from "@/modules/owner/services/promotionFunctions";

/**
 * Promotion checkout — review and payment method.
 *
 * WHAT THIS SCREEN MUST NEVER DO: report a payment as successful. No provider
 * is connected, so there is no callback, no signature, and nothing to verify.
 * Pressing "Continue to Payment" records a `pending` order server-side and says
 * so. A simulated success here would be indistinguishable from a working
 * integration right up until real money was involved.
 *
 * The payment methods are rendered because the integration will need them and
 * the owner should see what will be accepted — but they are explicitly
 * described as not yet active, and they are disabled rather than clickable
 * decoration that silently does nothing.
 *
 * The total is displayed from the plan, but the AMOUNT CHARGED is computed
 * server-side from the plan id. This display can never become the price.
 */

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI" },
  { id: "card", label: "Card" },
  { id: "netbanking", label: "Net Banking" },
  { id: "wallet", label: "Wallets" },
] as const;

interface PropertyRow {
  id: string;
  title: string | null;
  locality: string | null;
  city: string | null;
  listing_type: string | null;
  images: string[] | null;
}

export function PromotionCheckout({ propertyId, planId }: { propertyId: string; planId: string }) {
  const [method, setMethod] = useState<string>("upi");
  const plan = findVisibilityPlan(planId);

  const availability = useServerFn(getPromotionAvailability);
  const startCheckout = useServerFn(createPromotionCheckout);

  const { data: property } = useQuery({
    queryKey: ["promotion-checkout-property", propertyId],
    queryFn: async (): Promise<PropertyRow | null> => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, locality, city, listing_type, images")
        .eq("id", propertyId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as PropertyRow | null) ?? null;
    },
  });

  const { data: gateway } = useQuery({
    queryKey: ["promotion-gateway-availability"],
    queryFn: () => availability(),
  });

  const checkout = useMutation({
    mutationFn: () => startCheckout({ data: { propertyId, planId } }),
  });

  // An unknown plan id in the URL must not render a priced screen.
  if (!plan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">That promotion plan is not valid</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a plan from the promotion page. Your listing is unaffected.
        </p>
        <Button asChild className="mt-6 rounded-xl">
          <Link to="/list-property/promote/$id" params={{ id: propertyId }}>
            Back to plans
          </Link>
        </Button>
      </div>
    );
  }

  const cover = property?.images?.[0] ?? null;
  const place = [property?.locality, property?.city].filter(Boolean).join(", ");
  const gatewayReady = gateway?.enabled === true;
  const result = checkout.data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <BackLink
        fallbackTo="/list-property/promote/$id"
        fallbackParams={{ id: propertyId }}
        label="Back"
        className="-ml-3 mb-3"
      />

      <h1 className="text-2xl font-semibold tracking-tight">Promote your property</h1>

      {/* Which property is being promoted — no owner phone, email or exact address. */}
      <div className="mt-5 flex gap-4 rounded-2xl border border-border bg-card p-4">
        {cover ? (
          <img
            src={cover}
            alt={property?.title ?? "Your property"}
            width={96}
            height={72}
            loading="lazy"
            className="h-[72px] w-24 flex-none rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-[72px] w-24 flex-none items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground">
            <ImageOff className="h-4 w-4" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{property?.title || "Your listing"}</p>
          {place && <p className="mt-0.5 truncate text-xs text-muted-foreground">{place}</p>}
          {property?.listing_type && (
            <span className="mt-1.5 inline-block rounded-full border border-border px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
              For {property.listing_type}
            </span>
          )}
        </div>
      </div>

      {/* Order summary. No invented tax line — the plan price is the total. */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Selected
        </p>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold">{plan.name}</span>
          <span className="text-sm tabular-nums">{formatVisibilityInr(plan.priceInr)}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Featured for {plan.durationDays} days</p>

        <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatVisibilityInr(plan.priceInr)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatVisibilityInr(plan.priceInr)}</span>
          </div>
          <p className="text-xs text-muted-foreground">No hidden charges.</p>
        </div>
      </div>

      <fieldset className="mt-5" disabled={!gatewayReady}>
        <legend className="text-sm font-semibold">Payment method</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m.id}
              className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm ${
                method === m.id ? "border-primary bg-primary/5" : "border-border bg-card"
              } ${!gatewayReady ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="radio"
                name="payment-method"
                value={m.id}
                checked={method === m.id}
                onChange={() => setMethod(m.id)}
                className="h-4 w-4 accent-primary"
              />
              <span>{m.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Honest unavailable state — never a button that pretends to charge. */}
      {!gatewayReady && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3.5">
          <Info className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Online payment setup is currently being completed. Your free listing is not affected —
            it stays in moderation either way.
          </p>
        </div>
      )}

      {result &&
        (() => {
          // A refusal must not wear a success icon. "forbidden" (you do not own
          // this listing) and "invalid_plan" are failures; rendering them with a
          // green shield and role="status" told the owner the opposite of what
          // happened, and screen readers announced it as a status rather than
          // an alert.
          const failed =
            result.status === "forbidden" ||
            result.status === "invalid_plan" ||
            result.status === "storage_unavailable";
          const Icon = failed ? AlertCircle : ShieldCheck;
          return (
            <div
              role={failed ? "alert" : "status"}
              className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 ${
                failed ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"
              }`}
            >
              <Icon
                className={`mt-0.5 h-4 w-4 flex-none ${
                  failed ? "text-destructive" : "text-primary"
                }`}
                aria-hidden="true"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {result.details ??
                  "Your promotion request has been recorded. Nothing has been charged."}
              </p>
            </div>
          );
        })()}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button
          className="rounded-xl"
          disabled={checkout.isPending}
          onClick={() => checkout.mutate()}
        >
          {checkout.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue to Payment
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/list-property/submitted/$id" params={{ id: propertyId }}>
            Continue with Free Listing
          </Link>
        </Button>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Promotion is optional. Your listing publishes free after moderation.
      </p>
    </div>
  );
}
