import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  ShieldCheck,
  Loader2,
  PhoneCall,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  Sparkles,
  UserCheck,
  Compass,
  Building2,
  Calendar,
  Award,
  Star,
  Quote,
} from "lucide-react";
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  const FAQS = [
    {
      q: "How do I make Payment to subscribe one of the paid plans for property search?",
      a: "You can securely pay using UPI (Google Pay, PhonePe, Paytm), Net Banking, Debit/Credit Cards via our Razorpay payment gateway. Your plan activates instantly upon confirmation.",
    },
    {
      q: "How does Freedom / Relax / MoneyBack / Super Relax Plan compare?",
      a: "Freedom Plan (₹199) unlocks up to 25 verified direct-owner contacts. Relax Plan (₹299) assigns you a dedicated House-Hunt Assistant (RM) who negotiates rent and schedules visits. MoneyBack (₹499) adds our 100% refund guarantee. Super Relax (₹799) includes a Field Relationship Manager for on-ground physical/virtual tours.",
    },
    {
      q: "What services do you provide after I subscribe to Relax plan?",
      a: "Within 2 working hours, your dedicated Relationship Manager (RM) contacts you to understand your budget, locality, and amenities. Your RM handpicks matching properties, connects directly with owners, fixes visit appointments, and negotiates rent for you.",
    },
    {
      q: "What If I do not find a property after subscribing to relax plan?",
      a: "Your Relationship Manager will continuously refresh options and contact newly listed verified owners until your 45-day validity period. On the MoneyBack Plan, you are protected by our 100% refund policy.",
    },
    {
      q: "How soon can I get the property after I subscribe to the Relax or MoneyBack plan?",
      a: "Most seekers on our assisted plans finalize their home within 5 to 10 days, saving hours of manual searching and thousands in brokerage.",
    },
    {
      q: "Will you be coming to show the property to me if I am a customer?",
      a: "Yes! If you choose the Super Relax Plan (₹799), a Field Relationship Manager (FRM) accompanies you or provides virtual tours of shortlisted homes.",
    },
    {
      q: "Will you help me in negotiating the rent?",
      a: "Yes. Our locality experts leverage historical local pricing trends to negotiate the fairest rent and security deposit directly with the property owner.",
    },
    {
      q: "Can you get me the property in some specific area?",
      a: "Absolutely. We specialize in top metro tech corridors (Madhapur, Gachibowli, HSR Layout, Indiranagar, Whitefield, Powai, Hinjewadi, and more).",
    },
    {
      q: "How do I give my requirements for the type of property I am looking for?",
      a: "Once subscribed, you can fill your preferences online or directly chat/call your Relationship Manager.",
    },
    {
      q: "Are there any hidden charges in the subscription plans?",
      a: "Zero hidden charges. What you see is transparent (Plan price + 18% GST). We charge 0% brokerage on your final rental agreement.",
    },
    {
      q: "Is It possible that I can pay for relax plan once I find the property?",
      a: "Our assisted plans cover operational relationship manager time and field visits up-front at nominal introductory prices starting from just ₹199 to ₹299.",
    },
    {
      q: "Do you have any extra services for Super Relax Plan customers?",
      a: "Super Relax plan customers receive priority physical and virtual site inspections, neighborhood insight dossiers, and instant WhatsApp support.",
    },
  ];

  const TESTIMONIALS = [
    {
      name: "Tiasha",
      role: "IT Professional, Bengaluru",
      plan: "Relax Plan",
      text: "The service was great and very professional. I went with the Relax plan. My RM noted my requirements quite well and suggested a curated list of options. I shortlisted one and in just one visit, I was able to finalize the house of my choice. With a small baby to look after, this was the best possible option and truly worth it!",
    },
    {
      name: "Anoop Nair",
      role: "Software Architect, Hyderabad",
      plan: "Relax Plan",
      text: "Excellent service and an equally involved team. I opted for the Relax plan and got a good deal on my property in Gachibowli without paying a single rupee of brokerage. Highly recommended!",
    },
    {
      name: "Shubham Raibhandar",
      role: "Business Analyst, Pune",
      plan: "Relax Plan",
      text: "The site really helps us to find good properties in the least amount of time without any headache of brokerage. I was new in Pune and had no time. The Relationship Manager cooperated a lot and within one week provided a great flat as per my demand and budget.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          Affordable Assisted Seeker Plans
        </span>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Find Your Dream Home with Personal Assistance
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Get genuine owner contacts, dedicated Relationship Managers, rent negotiation, and 0%
          brokerage starting at just <strong className="text-foreground">₹199</strong>.
        </p>
      </div>

      {!paymentsEnabled ? (
        <div
          role="status"
          className="mx-auto mt-6 max-w-2xl rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center"
        >
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
            Plans are not on sale yet. You can see what they will include, but nothing can be
            purchased until we switch payments on.
          </p>
        </div>
      ) : null}

      {/* Plan Cards Grid */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {CUSTOMER_PLANS.map((plan) => {
          const discount = planDiscountPercent(plan);
          const gstInr = Math.round(planGstPaise(plan) / 100);
          const busy = busyPlan === plan.id;

          return (
            <div key={plan.id} className="relative flex flex-col pt-4 group">
              <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-teal-600/30 bg-teal-600 px-3.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-md">
                {plan.badge}
              </span>

              <div
                className={`flex min-w-0 flex-1 flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  plan.highlighted
                    ? "border-teal-600/60 bg-gradient-to-b from-teal-500/[0.08] via-card to-card ring-2 ring-teal-500/30 shadow-teal-900/10"
                    : "border-border/80 bg-card hover:border-teal-600/40"
                }`}
              >
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-extrabold text-foreground text-center">
                    {plan.name}
                  </h3>
                  <p className="mt-1.5 text-center text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                    {plan.tagline}
                  </p>

                  <div className="mt-4 rounded-xl bg-muted/40 p-3.5 text-center border border-border/50">
                    {discount > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        <s className="tabular-nums">{formatInr(plan.mrpInr)}</s>
                        <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">
                          {discount}% off
                        </span>
                      </p>
                    ) : null}
                    <p className="mt-0.5 flex flex-wrap justify-center items-baseline gap-x-1.5">
                      <span className="font-[family-name:var(--font-display)] text-3xl font-extrabold tabular-nums text-foreground">
                        {formatInr(plan.priceInr)}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        + 18% GST ({formatInr(gstInr)})
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Valid {plan.validityDays} days · Total{" "}
                      <strong className="text-foreground">
                        {formatInr(plan.priceInr + gstInr)}
                      </strong>
                    </p>
                  </div>

                  {/* Highlights Pill */}
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-300">
                    <span>Number of Contacts</span>
                    <span className="rounded bg-teal-600 px-2 py-0.5 text-[11px] font-bold text-white">
                      upto {plan.contactsCount}
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="mt-4 space-y-2.5">
                    {plan.benefits.map((b) => (
                      <li key={b} className="flex gap-2 text-xs leading-relaxed text-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-emerald-600 dark:text-emerald-400" />
                        <span className="min-w-0">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => onChoose(plan)}
                  disabled={!paymentsEnabled || busy}
                  className={`mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-md shadow-teal-900/20 hover:brightness-110"
                      : "border border-teal-600/30 bg-teal-500/5 text-teal-900 dark:text-teal-200 hover:bg-teal-500/15"
                  }`}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {paymentsEnabled ? `Get ${plan.name}` : "Not on sale yet"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plan Validity & Support Info Bar */}
      <div className="mt-10 rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-500/5 via-card to-teal-500/5 p-5 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
        <div>
          <p className="text-xs font-semibold text-foreground">
            Plan Validity: <strong>MoneyBack & Relax (45 Days)</strong> ·{" "}
            <strong>Freedom & Basic (90 Days)</strong>. T&amp;C apply.
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Looking to list your property as an owner?{" "}
            <a href="/list-property" className="font-bold text-teal-600 hover:underline">
              Click here for Owner Plans &amp; Free Listing
            </a>
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <a
            href="tel:+918905552222"
            className="inline-flex items-center gap-2 rounded-xl border border-teal-600/30 bg-card px-4 py-2 text-xs font-bold text-teal-700 dark:text-teal-300 shadow-sm transition hover:bg-teal-500/10"
          >
            <PhoneCall className="h-4 w-4 text-teal-600" />
            <span>Assistance: +91-89-055-522-22</span>
          </a>
        </div>
      </div>

      {/* HOW ASSISTED PLANS WORK */}
      <div className="mt-16 rounded-3xl border border-border/80 bg-gradient-to-br from-card via-muted/30 to-card p-8 sm:p-12 shadow-sm">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            LOOKING FOR A HOUSE?
          </span>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-extrabold text-foreground sm:text-3xl">
            How Assisted Plans Work
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Just get one of our Assisted Plans and make your house-hunting completely stress-free.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/60 shadow-sm">
            <div className="h-14 w-14 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-4">
              <UserCheck className="h-7 w-7" />
            </div>
            <h4 className="font-bold text-base text-foreground">
              1. Say HELLO to Your House-Hunt Assistant
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              A dedicated Relationship Manager is assigned to gather all your specific requirements
              and location preferences.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/60 shadow-sm">
            <div className="h-14 w-14 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-4">
              <Compass className="h-7 w-7" />
            </div>
            <h4 className="font-bold text-base text-foreground">
              2. City &amp; Locality Level Expertise
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Your assistant shortlists matching homes, contacts genuine owners, schedules property
              visits, and negotiates rent.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/60 shadow-sm">
            <div className="h-14 w-14 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-4">
              <Award className="h-7 w-7" />
            </div>
            <h4 className="font-bold text-base text-foreground">
              3. Helping You Find The Best House
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Move into your verified home with zero brokerage, transparent documentation, and
              instant peace of mind.
            </p>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="mt-16">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Real Stories
          </span>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-extrabold text-foreground sm:text-3xl">
            Our Customers Loved Us
          </h3>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
            >
              <div>
                <Quote className="h-8 w-8 text-teal-500/20 mb-3" />
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs italic leading-relaxed text-muted-foreground">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60">
                <p className="font-bold text-sm text-foreground">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">{t.role}</p>
                <span className="mt-1 inline-block rounded bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-700 dark:text-teal-300">
                  {t.plan} User
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Natasha Live Chat Help Card */}
      <div className="mt-16 rounded-3xl border border-teal-600/30 bg-gradient-to-r from-teal-900/90 via-teal-800 to-teal-950 p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-teal-700/80 border-2 border-amber-400/80 flex items-center justify-center text-xl font-bold text-amber-300 shrink-0 shadow-md">
              👩‍💼
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-extrabold text-white">Natasha &amp; Support Team</h4>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-semibold text-emerald-300">Online Now</span>
              </div>
              <p className="mt-1 text-xs text-teal-100 max-w-xl leading-relaxed">
                Need help picking the right plan? Our house-hunting team is ready and waiting. Chat
                with us now for immediate assistance and tailored solutions.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="https://wa.me/918905552222?text=Hi%20Natasha,%20I%20need%20assistance%20choosing%20a%20Seedha%20Properties%20plan."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-white shadow-lg hover:bg-emerald-600 transition"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Start Chat on WhatsApp</span>
            </a>
            <a
              href="tel:+918905552222"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              <PhoneCall className="h-4 w-4" />
              <span>Call +91-89-055-522-22</span>
            </a>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="mt-16">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Got Questions?
          </span>
          <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-extrabold text-foreground sm:text-3xl">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="mt-8 max-w-3xl mx-auto space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-border/80 bg-card overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-4.5 text-left text-sm font-bold text-foreground hover:bg-muted/40 cursor-pointer"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180 text-teal-600" : ""
                    }`}
                  />
                </button>
                {isOpen ? (
                  <div className="px-4.5 pb-4.5 pt-1 text-xs leading-relaxed text-muted-foreground border-t border-border/40">
                    {faq.a}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
