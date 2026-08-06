import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";

export function FooterLinks() {
  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <BrandMark />
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground max-w-sm">
              India's premier real estate ecosystem for Rent, Buy, Commercial, Villas, Apartments, PG & Plots in Tier-2, Tier-3 & Metro cities. Zero brokerage, 100% verified owners.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              © {new Date().getFullYear()} Urban Properties. All rights reserved.
            </p>
          </div>

          {/* Cities */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Popular Cities</h3>
            <ul className="mt-3 grid gap-2 text-xs text-muted-foreground">
              <li><Link to="/properties" search={{ q: "", city: "Jaipur", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }} className="hover:text-foreground">Flats in Jaipur</Link></li>
              <li><Link to="/properties" search={{ q: "", city: "Lucknow", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }} className="hover:text-foreground">Flats in Lucknow</Link></li>
              <li><Link to="/properties" search={{ q: "", city: "Indore", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }} className="hover:text-foreground">Flats in Indore</Link></li>
              <li><Link to="/properties" search={{ q: "", city: "Hyderabad", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }} className="hover:text-foreground">Flats in Hyderabad</Link></li>
              <li><Link to="/properties" search={{ q: "", city: "Vizag", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }} className="hover:text-foreground">Flats in Vizag</Link></li>
            </ul>
          </div>

          {/* Property Types */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Categories</h3>
            <ul className="mt-3 grid gap-2 text-xs text-muted-foreground">
              <li><Link to="/properties" search={{ listing: "rent", q: "", city: "Hyderabad", minPrice: 0, maxPrice: 0, beds: 0 }} className="hover:text-foreground">Flats for Rent</Link></li>
              <li><Link to="/buy" className="hover:text-foreground">Residential Homes (Buy)</Link></li>
              <li><Link to="/commercial" className="hover:text-foreground">Commercial & Tech Parks</Link></li>
              <li><Link to="/plots" className="hover:text-foreground">Plots & Land</Link></li>
              <li><Link to="/villas" className="hover:text-foreground">Luxury Gated Villas</Link></li>
              <li><Link to="/pg-hostels" className="hover:text-foreground">PG & Co-Living</Link></li>
              <li><Link to="/farm-lands" className="hover:text-foreground">Managed Farm Lands</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Company</h3>
            <ul className="mt-3 grid gap-2 text-xs text-muted-foreground">
              <li><Link to="/auth" className="hover:text-foreground">Post Property Free</Link></li>
              <li><Link to="/favorites" className="hover:text-foreground">Saved Homes</Link></li>
              <li><Link to="/home-services" className="hover:text-foreground">Digital Rental Agreement</Link></li>
              <li><Link to="/home-services" className="hover:text-foreground">Packers & Movers</Link></li>
              <li><Link to="/auth" className="hover:text-foreground">Sign In / Register</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
