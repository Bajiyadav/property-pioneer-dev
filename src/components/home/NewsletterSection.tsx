import { useState } from "react";
import { Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    toast.success("Subscribed to Urban Properties Hyderabad updates!");
  };

  return (
    <section className="bg-secondary/40 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-[var(--shadow-card)] text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Hyderabad Housing Market Digest
          </span>
          <h2 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">Stay Ahead of Premium Rental Deals</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get weekly curated zero-brokerage rental listings in Gachibowli, Madhapur & Kondapur delivered directly to your inbox.
          </p>

          {subscribed ? (
            <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600">
              <CheckCircle2 className="h-5 w-5" /> You're subscribed! We'll send you new Hyderabad listings weekly.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <div className="relative w-full">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 shadow"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
