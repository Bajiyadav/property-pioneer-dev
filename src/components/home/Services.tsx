import { FileText, Truck, Landmark, Palette, Paintbrush, Sparkles, ShieldCheck, UserCheck } from "lucide-react";

const SERVICES = [
  { title: "Rental Agreement", desc: "Digital legal agreement with e-stamping delivered in 10 mins.", icon: FileText, badge: "Popular" },
  { title: "Packers & Movers", desc: "Safe, hassle-free home relocation at guaranteed lowest prices.", icon: Truck, badge: "Instant Quote" },
  { title: "Home Loans", desc: "Compare best interest rates from top partner banks.", icon: Landmark, badge: "Low Interest" },
  { title: "Interior Design", desc: "Custom modular kitchens and home interiors from verified pros.", icon: Palette, badge: "Free Design" },
  { title: "Home Painting", desc: "Professional painting services with 1-year service warranty.", icon: Paintbrush, badge: "Express" },
  { title: "Deep Cleaning", desc: "Full home deep cleaning, bathroom & kitchen sanitization.", icon: Sparkles, badge: "Sanitized" },
  { title: "Legal Verification", desc: "Property title check and legal documentation assistance.", icon: ShieldCheck, badge: "Verified" },
  { title: "Tenant Verification", desc: "Instant Aadhaar, PAN, and police verification reports.", icon: UserCheck, badge: "Instant" },
];

export function Services() {
  return (
    <section className="bg-secondary/40 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Complete Ecosystem</p>
          <h2 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">Real Estate & Home Services</h2>
          <p className="mt-2 text-sm text-muted-foreground">Everything you need before, during, and after moving in.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-primary/50">
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-foreground">{s.badge}</span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
