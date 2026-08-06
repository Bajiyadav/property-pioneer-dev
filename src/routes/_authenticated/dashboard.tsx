import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProperties, formatPrice } from "@/lib/properties";
import { PropertyCard } from "@/components/PropertyCard";
import { Heart, Search, Clock, MessageSquare, MapPin, Building, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: CustomerDashboard,
});

function CustomerDashboard() {
  const navigate = useNavigate();
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  const hyderabadRentals = properties.filter(
    (p) =>
      (p.city && p.city.toLowerCase().includes("hyderabad")) ||
      (p.address && p.address.toLowerCase().includes("hyderabad"))
  );
  const recommended = hyderabadRentals.length > 0 ? hyderabadRentals : properties;

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Customer Dashboard
          </span>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">Welcome Back to Urban Properties</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your saved rentals, property inquiries, and Hyderabad search recommendations.</p>
        </div>
        <Link
          to="/properties"
          search={{ q: "Hyderabad", city: "Hyderabad", listing: "rent", minPrice: 0, maxPrice: 0, beds: 0 }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md transition hover:brightness-110"
        >
          <Search className="h-4 w-4" /> Explore Hyderabad Rentals
        </Link>
      </div>

      {/* Quick Dashboard Metric Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Saved Properties</span>
            <Heart className="h-5 w-5 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">3 Homes</p>
          <Link to="/favorites" className="mt-2 inline-block text-xs font-semibold text-primary underline">View Wishlist →</Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">My Enquiries</span>
            <MessageSquare className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">2 Active</p>
          <span className="mt-2 inline-block text-xs text-muted-foreground">Direct Owner WhatsApp</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Recently Viewed</span>
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">5 Listings</p>
          <span className="mt-2 inline-block text-xs text-muted-foreground">Gachibowli, Madhapur</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Verification Status</span>
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">Verified Tenant</p>
          <span className="mt-2 inline-block text-xs text-emerald-600 font-semibold">0% Brokerage Guaranteed</span>
        </div>
      </div>

      {/* Recommended Hyderabad Rentals */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Recommended Hyderabad Rentals</h2>
            <p className="text-xs text-muted-foreground">Curated direct owner flats in Gachibowli, Madhapur & Kondapur.</p>
          </div>
          <Link
            to="/properties"
            search={{ q: "Hyderabad", city: "Hyderabad", listing: "rent", minPrice: 0, maxPrice: 0, beds: 0 }}
            className="text-xs font-semibold text-primary underline"
          >
            See All Hyderabad Homes →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.slice(0, 3).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
