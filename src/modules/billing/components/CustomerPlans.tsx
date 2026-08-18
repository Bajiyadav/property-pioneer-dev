import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  CUSTOMER_PLANS,
  formatInr,
  planDiscountPercent,
  planGstPaise,
  type CustomerPlan,
} from "@/config/plans";
import {
  getPaymentAvailability,
  createPlanCheckout,
} from "@/modules/billing/services/billingFunctions";
import { useAuth } from "@/modules/authentication/context/AuthContext";

export function CustomerPlans() {
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

  const onChoose = async (plan: CustomerPlan) => {
    if (status !== "authenticated") {
      toast.info("Sign in to choose a plan", {
        description: "A plan is attached to your account to unlock features.",
      });
      return;
    }
    setBusyPlan(plan.id);
    try {
      const order = await startCheckout({ data: { planId: plan.id } });
      if (order.status !== "ok") {
        toast.error("Payments are not enabled yet", {
          description: order.details ?? "This deployment cannot take a payment right now.",
        });
        return;
      }
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
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Unlock Premium Features
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Upgrade your experience to directly contact owners and get priority scheduling.
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

      <div className="mt-10 grid gap-6 sm:grid-cols-1 max-w-md mx-auto">
        {CUSTOMER_PLANS.map((plan) => {
          const discount = planDiscountPercent(plan);
          const gstInr = Math.round(planGstPaise(plan) / 100);
          const busy = busyPlan === plan.id;

          return (
            <div key={plan.id} className="relative flex pt-4 group">
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
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-foreground text-center">
                  {plan.name}
                </h3>

                <div className="mt-4 text-center">
                  {discount > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      <s className="tabular-nums">{formatInr(plan.mrpInr)}</s>
                      <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">
                        {discount}% off
                      </span>
                    </p>
                  ) : null}
                  <p className="mt-0.5 flex flex-wrap justify-center items-baseline gap-x-2">
                    <span className="font-[family-name:var(--font-display)] text-3xl font-extrabold tabular-nums text-foreground">
                      {formatInr(plan.priceInr)}
                    </span>
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
                  className={`mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground hover:brightness-110"
                      : "border border-border bg-background text-foreground hover:bg-secondary"
                  }`}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {paymentsEnabled ? "Upgrade Now" : "Not on sale yet"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mx-auto mt-6 flex max-w-2xl items-start gap-2 text-center justify-center text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none text-primary" />
        <span>Secure payment via Razorpay. Cancel anytime.</span>
      </p>
    </section>
  );
}
