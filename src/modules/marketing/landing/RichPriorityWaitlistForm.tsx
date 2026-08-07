import { useState } from "react";
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function RichPriorityWaitlistForm({
  defaultCategory = "Residential Homes",
}: {
  defaultCategory?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [budget, setBudget] = useState("₹50L - ₹1 Cr");
  const [propertyType, setPropertyType] = useState(defaultCategory);
  const [locality, setLocality] = useState("");
  const [intent, setIntent] = useState("Self-Use");
  const [timeline, setTimeline] = useState("1-3 Months");
  const [contactMethod, setContactMethod] = useState("WhatsApp");

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Welcome to Urban Properties Priority VIP Access!");
    }, 600);
  };

  return (
    <section id="early-access" className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-primary/40 bg-card p-6 sm:p-10 shadow-2xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" /> Founder VIP Early Access
          </span>
          <h2 className="mt-3 text-2xl font-black text-foreground sm:text-3xl">
            Join the Priority Member Waitlist
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
            Get 48-hour early priority access to verified direct owner listings in {city} with zero
            brokerage and free digital agreements.
          </p>
        </div>

        {submitted ? (
          <div className="mt-8 rounded-3xl border border-emerald-600/30 bg-emerald-600/10 p-8 text-center space-y-4">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-600 text-white shadow-lg">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-extrabold text-foreground">
              VIP Founder Membership Confirmed!
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              You are assigned <strong className="text-foreground">Priority Pass #1,428</strong> for{" "}
              {city}. We will send your early access invite via{" "}
              <strong className="text-foreground">{contactMethod}</strong> to{" "}
              <strong className="text-foreground">{phone}</strong>.
            </p>
            <div className="rounded-2xl border border-border/40 bg-background/60 p-4 text-xs font-mono max-w-xs mx-auto text-left">
              <p className="text-muted-foreground">
                Category: <span className="font-bold text-foreground">{propertyType}</span>
              </p>
              <p className="text-muted-foreground">
                Budget: <span className="font-bold text-foreground">{budget}</span>
              </p>
              <p className="text-muted-foreground">
                Timeline: <span className="font-bold text-foreground">{timeline}</span>
              </p>
            </div>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow"
            >
              Update Waitlist Preferences
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Mobile Number (SMS Alert)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-semibold text-muted-foreground">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="98765 43210"
                    className="w-full rounded-xl border border-border bg-background pl-12 pr-4 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Target City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Hyderabad">Hyderabad (MVP Live)</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Pune">Pune</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Visakhapatnam">Visakhapatnam</option>
                  <option value="Vijayawada">Vijayawada</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Budget Range</label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="₹20K - ₹40K / mo">₹20K - ₹40K / mo (Rent)</option>
                  <option value="₹40K - ₹80K / mo">₹40K - ₹80K / mo (Rent)</option>
                  <option value="₹50L - ₹1 Cr">₹50L - ₹1 Cr (Buy)</option>
                  <option value="₹1 Cr - ₹2.5 Cr">₹1 Cr - ₹2.5 Cr (Buy)</option>
                  <option value="₹2.5 Cr+">₹2.5 Cr+ (Luxury)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Purpose / Intent
                </label>
                <select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Self-Use">Self-Use Family Living</option>
                  <option value="Investment">Rental Yield & Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Timeline</label>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Immediate">Immediate (Within 30 Days)</option>
                  <option value="1-3 Months">1 - 3 Months</option>
                  <option value="3-6 Months">3 - 6 Months</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary py-3.5 text-xs font-black text-primary-foreground shadow-lg transition hover:brightness-110 flex items-center justify-center gap-2"
            >
              {loading ? "Registering Priority Pass…" : "Register for VIP Priority Access"}{" "}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
