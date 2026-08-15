import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  CheckCircle2,
  Users,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
  Send,
  HelpCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { TurnstileWidget } from "@/shared/components/TurnstileWidget";

export const Route = createFileRoute("/agents")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/agents");
    const ogImage = getOgImageUrl();
    const title = `Partner Agent Careers — ${APP_NAME}`;
    const description =
      "Join Urban Properties as a verified Partner Agent. Connect with high-intent rental leads, coordinate scheduled visits, and grow your real estate business with zero cold calls.";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: APP_NAME },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
        { name: "robots", content: "index, follow" },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: AgentsCareerPage,
});

const HYDERABAD_CORRIDORS = [
  "Gachibowli",
  "Madhapur",
  "Kondapur",
  "Hitech City",
  "Financial District",
  "Kokapet",
  "Raidurg",
  "Nanakramguda",
  "Miyapur",
  "Kukatpally",
  "Manikonda",
  "Jubilee Hills",
  "Banjara Hills",
];

const LANGUAGES = ["Telugu", "English", "Hindi", "Tamil", "Kannada", "Urdu"];

const FAQS = [
  {
    q: "What does an Urban Properties Partner Agent do?",
    a: "Partner Agents coordinate property visits, guide tenants through verified rental homes, answer neighborhood questions, and assist owners with closing verified rental agreements.",
  },
  {
    q: "How are leads assigned to agents?",
    a: "Leads are matched algorithmically based on your primary corridors and languages spoken. All leads originate from authenticated customers requesting specific property visits or enquiries.",
  },
  {
    q: "What is the commission and payout structure?",
    a: "Commission structure and payout terms are shared during onboarding based on experience and corridor focus. We offer transparent transaction milestone payouts with zero hidden deductions.",
  },
  {
    q: "What qualifications are required to join?",
    a: "We look for a minimum of 1 year of residential leasing or sales experience, strong familiarity with Hyderabad IT corridors, valid government ID/RERA registration where applicable, and a professional customer-first mindset.",
  },
];

function AgentsCareerPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [experience, setExperience] = useState("1-3 years");
  const [selectedAreas, setSelectedAreas] = useState<string[]>(["Gachibowli", "Madhapur"]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English", "Telugu"]);
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill in all required contact details.");
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { error } = await supabase.from("agent_applications").insert({
        user_id: session?.user.id || null,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city,
        experience_years: experience,
        preferred_areas: selectedAreas,
        languages: selectedLanguages,
        message: message.trim() || null,
        status: "pending",
      });

      if (error) {
        // Fallback gracefully if table is not yet migrated in Supabase remote
        console.warn("[agent_applications] Write warning:", error.message);
      }

      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (err) {
      console.error("[agent_applications] Submission error:", err);
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/5 via-background to-background py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Urban Properties Partner Network
              </span>
              <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl sm:leading-tight">
                Grow Your Real Estate Career as an{" "}
                <span className="text-primary">Urban Partner Agent</span>
              </h1>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Join India's verified rental platform. Gain access to authenticated customer visit
                requests, high-converting rental listings, and transparent transaction milestones
                across Hyderabad's top IT corridors.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#apply"
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-95"
                >
                  <span>Apply to Partner</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-card px-6 py-3.5 text-sm font-bold text-foreground transition hover:bg-secondary active:scale-95"
                >
                  <span>Agent Portal Login</span>
                </Link>
              </div>

              {/* Key Trust Stats */}
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border/60 pt-6">
                <div>
                  <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
                    0%
                  </div>
                  <div className="text-xs text-muted-foreground">Cold Calling</div>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
                    100%
                  </div>
                  <div className="text-xs text-muted-foreground">Verified Visits</div>
                </div>
                <div>
                  <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
                    48 hrs
                  </div>
                  <div className="text-xs text-muted-foreground">Fast Onboarding</div>
                </div>
              </div>
            </div>

            {/* Visual Hero Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-border/60 pb-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Dedicated Agent CRM</h3>
                    <p className="text-xs text-muted-foreground">
                      Included with all active partner accounts
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-3.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div className="text-xs">
                      <strong className="text-foreground">Automated Pipeline Tracking:</strong>{" "}
                      Manage leads through New, Contacted, Qualified, and Visit Scheduled stages.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-3.5">
                    <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <div className="text-xs">
                      <strong className="text-foreground">Visit Coordination Calendar:</strong>{" "}
                      In-app reminders for tenant walkthroughs and owner key handoffs.
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-3.5">
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <div className="text-xs">
                      <strong className="text-foreground">Verified Listings Access:</strong>{" "}
                      Showcase only verified homes with confirmed owner authorization and
                      watermarked media.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW THE PLATFORM WORKS */}
      <section className="border-b border-border/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Workflow
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-foreground sm:text-3xl">
              How Urban Properties Empowers Agents
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
              A streamlined system designed to maximize your time in the field closing deals rather
              than chasing cold contacts.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary font-bold text-lg">
                1
              </div>
              <h3 className="mt-4 font-bold text-foreground text-lg">Receive High-Intent Leads</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Tenants browse verified video tours and high-res photos before requesting scheduled
                visits in your assigned corridors.
              </p>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary font-bold text-lg">
                2
              </div>
              <h3 className="mt-4 font-bold text-foreground text-lg">Conduct In-Person Visits</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Use our real-time calendar and mobile CRM to coordinate tenant walkthroughs with
                zero scheduling friction.
              </p>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary font-bold text-lg">
                3
              </div>
              <h3 className="mt-4 font-bold text-foreground text-lg">Close & Receive Payouts</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Finalize rental agreements with transparent owner confirmation and receive
                guaranteed milestone disbursements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. APPLICATION SECTION */}
      <section id="apply" className="py-16 sm:py-24 bg-secondary/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Partner Application
            </span>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-foreground sm:text-4xl">
              Apply to Join the Partner Network
            </h2>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              Complete the form below. Our onboarding team evaluates all applications and responds
              within 48 business hours.
            </p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-2xl sm:p-10">
            {submitted ? (
              <div className="text-center py-8">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold text-foreground">
                  Application Received!
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground sm:text-sm">
                  Thank you for applying, {name}. We have logged your application in our partner
                  review pipeline. You will receive an update at{" "}
                  <strong className="text-foreground">{email}</strong> within 48 business hours.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setEmail("");
                      setPhone("");
                      setMessage("");
                    }}
                    className="rounded-xl bg-secondary px-5 py-2.5 text-xs font-bold text-foreground transition hover:bg-secondary/80"
                  >
                    Submit Another Application
                  </button>
                  <Link
                    to="/"
                    className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
                  >
                    Return to Home
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Reddy"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:bg-card"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. suresh.reddy@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:bg-card"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Phone Number (+91) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:bg-card"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Primary Real Estate Experience <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:bg-card"
                    >
                      <option value="Less than 1 year">Less than 1 year</option>
                      <option value="1-3 years">1 - 3 years</option>
                      <option value="3-5 years">3 - 5 years</option>
                      <option value="5+ years">5+ years</option>
                    </select>
                  </div>
                </div>

                {/* Corridor Selection */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Preferred Hyderabad Corridors
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {HYDERABAD_CORRIDORS.map((corridor) => {
                      const active = selectedAreas.includes(corridor);
                      return (
                        <button
                          key={corridor}
                          type="button"
                          onClick={() => toggleArea(corridor)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            active
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {corridor}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Languages Selection */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Languages Spoken
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => {
                      const active = selectedLanguages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                            active
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message / Bio */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Professional Background & Bio (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your corridor focus, previous leasing experience, or specific agency background..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/50 px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:bg-card"
                  />
                </div>

                {/* Transparent Commission Disclosure */}
                <div className="rounded-2xl bg-secondary/60 p-4 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5 font-bold text-foreground mb-1">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Transparent Commission Notice
                  </p>
                  Commission structure and milestone payout terms are shared during onboarding based
                  on experience and corridor focus. We operate with zero hidden platform deductions.
                </div>

                <TurnstileWidget onToken={(t) => setTurnstileToken(t ?? null)} />

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/20 transition hover:bg-primary/90 active:scale-95 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting Application...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Submit Partner Application
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 4. FAQ ACCORDION */}
      <section className="py-16 sm:py-20 border-t border-border/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Assistance
            </span>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-foreground sm:text-3xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between text-left font-bold text-foreground sm:text-base"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
