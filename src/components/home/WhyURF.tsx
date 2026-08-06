import {
  ShieldCheck, CheckCircle2, Zap, MessageSquare, Lock, PhoneCall, Sparkles, Award,
} from "lucide-react";

const BENEFITS = [
  { title: "Zero Brokerage", desc: "100% direct owner listings. Save up to ₹50,000+ in broker fees.", icon: ShieldCheck },
  { title: "Verified Owners", desc: "Phone, email, and Aadhaar identity verified owners for safe deals.", icon: CheckCircle2 },
  { title: "Verified Properties", desc: "Physical address and location check to eliminate fake listings.", icon: Award },
  { title: "AI-Powered Search", desc: "Find homes near your college, office, or landmark in under 5 seconds.", icon: Sparkles },
  { title: "WhatsApp First", desc: "Instant 1-tap WhatsApp connect with direct owners.", icon: MessageSquare },
  { title: "Fast Approval", desc: "Listings reviewed and approved within 2 hours of upload.", icon: Zap },
  { title: "Safe Payments", desc: "Secure online rent collection & digital receipts for HRA claims.", icon: Lock },
  { title: "Local Market Experts", desc: "Dedicated support team across Tier-2 & Tier-3 Indian cities.", icon: PhoneCall },
];

export function WhyURF() {
  return (
    <section className="bg-secondary/40 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Why Choose Us</p>
          <h2 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">The Smartest Way to Rent & Buy</h2>
          <p className="mt-2 text-sm text-muted-foreground">Built specifically for the needs of Indian renters and property owners.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {BENEFITS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
