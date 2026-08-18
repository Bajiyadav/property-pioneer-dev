import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Minus, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  OWNER_PLANS,
  DELIVERABLE_BENEFITS,
  formatInr,
  planDiscountPercent,
  planGstPaise,
  type OwnerPlan,
} from "@/config/plans";
import {
  getPaymentAvailability,
  createPlanCheckout,
} from "@/modules/billing/services/billingFunctions";
import { useAuth } from "@/modules/authentication/context/AuthContext";

/**
 * Optional paid assistance plans for owners.
 *
 * Listing stays free — that is the platform's proposition and this section does not
 * change it. What is sold here is human help with an existing listing, which is a
 * different thing from a commission on rent. The copy keeps that distinction
 * explicit, because "no commission" alongside a price list invites exactly the
 * wrong reading.
 *
 * The button never opens a checkout that cannot settle. `getPaymentAvailability`
 * reports whether the server holds Razorpay credentials, and until it does the
 * cards render with a disabled action and an honest explanation rather than a
 * payment sheet that would fail.
 */

/** Union of every benefit any plan offers, in a stable order for the matrix. */
const ALL_BENEFITS = Object.values(DELIVERABLE_BENEFITS);

export function OwnerPlans() {
  const { status, session } = useAuth();
  const fetchAvailability = useServerFn(getPaymentAvailability);
  const startCheckout = useServerFn(createPlanCheckout);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  const { data: availability } = useQuery({
    queryKey: ["billing", "availability"],
    queryFn: () => fetchAvailability({}),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const paymentsEnabled = availability?.enabled === true;

  const onChoose = async (plan: OwnerPlan) => {
    if (status !== "authenticated") {
      toast.info("Sign in to choose a plan", {
        description: "A plan is attached to your account and your listings.",
      });
      return;
    }
    setBusyPlan(plan.id);
    try {
      const order = await startCheckout({ data: { planId: plan.id } });
      if (order.status !== "ok") {
        // Reported, not swallowed: the owner learns the payment did not start.
        toast.error("Payments are not enabled yet", {
          description: order.details ?? "This deployment cannot take a payment right now.",
        });
        return;
      }
      // The Razorpay checkout script is loaded on demand by the route that mounts
      // this component; opening it lives there so this stays a pure presentation
      // component that a test can render without a gateway.
      window.dispatchEvent(
        new CustomEvent("sp:open-razorpay", {
          detail: {
            ...order,
            userEmail: session?.user?.email,
            userPhone: session?.user?.phone,
          },
        }),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the payment.");
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Want help getting your property rented?
        </h2>
        {/*
          States the boundary rather than leaving it implied. Listing free AND a
          price list on the same site reads as a contradiction unless the
          difference is spelled out.
        */}
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Listing your property is free and always will be, and we never take a commission on your
          rent. These optional plans buy one thing only: a person from our team helping you while
          your listing is live.
        </p>
      </div>

      {!paymentsEnabled ? (
        <div
          role="status"
          className="mx-auto mt-8 max-w-2xl rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center"
        >
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
            Plans are not on sale yet. You can see what they will include, but nothing can be
            purchased until we switch payments on.
          </p>
        </div>
      ) : null}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {OWNER_PLANS.map((plan) => {
          const discount = planDiscountPercent(plan);
          const gstInr = Math.round(planGstPaise(plan) / 100);
          const busy = busyPlan === plan.id;

          return (
            <div key={plan.id} className="relative flex pt-4 group">
              {/* Ribbon, sitting above the card edge like the reference layout. */}
              <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary shadow-sm backdrop-blur-md">
                {plan.badge}
              </span>

              <div
                className={`flex min-w-0 flex-1 flex-col rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  plan.highlighted
                    ? "border-primary/50 bg-gradient-to-br from-primary/[0.08] via-primary/[0.03] to-transparent ring-1 ring-primary/20 shadow-primary/10"
                    : "border-border/80 bg-card hover:border-primary/30"
                }`}
              >
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-foreground">
                  {plan.name}
                </h3>

                <div className="mt-4">
                  {discount > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      <s className="tabular-nums">{formatInr(plan.mrpInr)}</s>
                      <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">
                        {discount}% off
                      </span>
                    </p>
                  ) : null}
                  <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-extrabold tabular-nums text-foreground">
                      {formatInr(plan.priceInr)}
                    </span>
                    {/* GST shown as an amount, not just a percentage, so the
                        total is obvious before the payment sheet opens. */}
                    <span className="text-xs font-semibold text-muted-foreground">
                      + {formatInr(gstInr)} GST
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Valid {plan.validityDays} days · total{" "}
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatInr(plan.priceInr + gstInr)}
                    </span>
                  </p>
                </div>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.benefits.map((b) => (
                    <li key={b} className="flex gap-2 text-xs leading-relaxed text-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-emerald-600 dark:text-emerald-400" />
                      <span className="min-w-0">{b}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => onChoose(plan)}
                  disabled={!paymentsEnabled || busy}
                  aria-describedby={!paymentsEnabled ? "plans-unavailable" : undefined}
                  className={`mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground hover:brightness-110"
                      : "border border-border bg-background text-foreground hover:bg-secondary"
                  }`}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {paymentsEnabled ? "Choose this plan" : "Not on sale yet"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison matrix, so the difference between tiers is legible at a glance. */}
      <div className="mt-10 overflow-x-auto rounded-2xl border border-border/80">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <caption className="sr-only">What each owner assistance plan includes</caption>
          <thead>
            <tr className="border-b border-border/80 bg-secondary/30">
              <th scope="col" className="p-4 text-xs font-extrabold uppercase tracking-wider">
                Included
              </th>
              {OWNER_PLANS.map((p) => (
                <th
                  key={p.id}
                  scope="col"
                  className="p-4 text-center text-xs font-extrabold uppercase tracking-wider"
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_BENEFITS.map((benefit) => (
              <tr key={benefit} className="border-b border-border/50 last:border-0">
                <th scope="row" className="p-4 text-xs font-medium text-foreground">
                  {benefit}
                </th>
                {OWNER_PLANS.map((p) => {
                  const has = p.benefits.includes(benefit);
                  return (
                    <td key={p.id} className="p-4 text-center">
                      {has ? (
                        <Check
                          className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400"
                          aria-label="Included"
                        />
                      ) : (
                        <Minus
                          className="mx-auto h-4 w-4 text-muted-foreground/50"
                          aria-label="Not included"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p
        id="plans-unavailable"
        className="mx-auto mt-6 flex max-w-2xl items-start gap-2 text-center text-xs text-muted-foreground"
      >
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none text-primary" />
        <span>
          Prices exclude GST, which is shown per plan above. Plans cover assistance only — they do
          not change how tenants contact you, and they never place us between you and your tenant.
        </span>
      </p>
    </section>
  );
}
