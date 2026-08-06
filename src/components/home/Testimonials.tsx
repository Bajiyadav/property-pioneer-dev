import { Star, Quote, CheckCircle2 } from "lucide-react";

const REVIEWS = [
  {
    name: "Rahul Sharma",
    role: "Tenant",
    city: "Jaipur",
    type: "2 BHK Flat",
    rating: 5,
    comment: "Found a fully furnished 2 BHK in Malviya Nagar without paying a single rupee in brokerage! Connected directly with the owner on WhatsApp within 10 minutes.",
  },
  {
    name: "Priya Verma",
    role: "Property Owner",
    city: "Lucknow",
    type: "Independent House",
    rating: 5,
    comment: "Listed my Gomti Nagar house on Urban Rental Flats and received 5 verified tenant inquiries on the first day. Best zero-brokerage platform for Tier-2 cities.",
  },
  {
    name: "Anand Kulkarni",
    role: "Tenant",
    city: "Indore",
    type: "1 BHK Apartment",
    rating: 5,
    comment: "Smooth experience! The digital rental agreement generator saved me a lot of hassle with stamp papers. Highly recommended for students and bachelors.",
  },
];

export function Testimonials() {
  return (
    <section className="bg-secondary/40 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Customer Stories</p>
          <h2 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">Loved by Thousands Across India</h2>
          <div className="mt-2 flex items-center justify-center gap-1 text-amber-500 text-sm font-semibold">
            <Star className="h-4 w-4 fill-current" />
            <span>4.9 / 5 Average Rating from 12,000+ Reviews</span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {REVIEWS.map((rev) => (
            <div key={rev.name} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground italic">"{rev.comment}"</p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1">
                    {rev.name} <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{rev.role} • {rev.city}</p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold text-foreground">{rev.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
