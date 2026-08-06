import { Sparkles, Home, Building2, Compass, Trees, Castle, Palette, Truck, Landmark, Smartphone } from "lucide-react";

const UPCOMING = [
  { title: "Buy Properties", category: "Real Estate Sales", desc: "Verified flats, independent houses, and villas for purchase across India.", icon: Home },
  { title: "Commercial Spaces", category: "Office & Retail", desc: "Office spaces, IT parks, retail shops, and commercial land listings.", icon: Building2 },
  { title: "Plots & Land", category: "Open Land", desc: "HMDA & DTCP approved residential and commercial plots.", icon: Compass },
  { title: "Farm Land", category: "Agricultural", desc: "Managed farm lands, agricultural acres, and resort plots.", icon: Trees },
  { title: "Villa Sales", category: "Luxury Homes", desc: "Gated community luxury villas with private gardens and swimming pools.", icon: Castle },
  { title: "Interior Design", category: "Home Services", desc: "Custom modular kitchens, wardrobe designs, and full home interiors.", icon: Palette },
  { title: "Packers & Movers", category: "Relocation", desc: "Hassle-free home relocation services with damage protection guarantee.", icon: Truck },
  { title: "Home Loans", category: "Financing", desc: "Pre-approved home loans from top partner banks at lowest interest rates.", icon: Landmark },
  { title: "Mobile Apps", category: "iOS & Android", desc: "Native mobile app with push alerts, offline maps, and 1-tap WhatsApp.", icon: Smartphone },
];

export function ComingSoonBadges({
  onSelectUpcoming,
}: {
  onSelectUpcoming?: (item: typeof UPCOMING[0]) => void;
}) {
  return (
    <section className="bg-secondary/30 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Product Roadmap
          </span>
          <h2 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">Coming Soon to Urban Properties</h2>
          <p className="mt-2 text-sm text-muted-foreground">We are actively building the complete real estate & home services ecosystem.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {UPCOMING.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => onSelectUpcoming?.(item)}
                className="group text-left relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    🚀 Launching Q4 2026
                  </span>
                </div>
                <p className="mt-3 text-[11px] font-semibold text-muted-foreground uppercase">{item.category}</p>
                <h3 className="mt-1 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
