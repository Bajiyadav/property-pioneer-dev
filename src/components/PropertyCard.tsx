import { Link } from "@tanstack/react-router";
import { Heart, MapPin, BedDouble, Bath, Maximize } from "lucide-react";
import { type Property, formatPrice } from "@/lib/properties";
import { useFavorites } from "@/lib/useFavorites";

export function PropertyCard({ property }: { property: Property }) {
  const { has, toggle } = useFavorites();
  const saved = has(property.id);
  const cover = property.images[0] ?? "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200";

  return (
    <Link
      to="/properties/$id"
      params={{ id: property.id }}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={cover}
          alt={property.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground backdrop-blur">
            For {property.listing_type}
          </span>
          {property.is_featured && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
              Featured
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle(property.id);
          }}
          aria-label={saved ? "Remove from saved" : "Save"}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground backdrop-blur transition hover:bg-background"
        >
          <Heart
            className="h-4 w-4"
            fill={saved ? "currentColor" : "none"}
            style={saved ? { color: "var(--primary)" } : undefined}
          />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight text-foreground">
            {property.title}
          </h3>
        </div>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {property.address}, {property.city}
        </p>
        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><BedDouble className="h-4 w-4" />{property.bedrooms} bd</span>
          <span className="inline-flex items-center gap-1"><Bath className="h-4 w-4" />{property.bathrooms} ba</span>
          <span className="inline-flex items-center gap-1"><Maximize className="h-4 w-4" />{property.area_sqft} ft²</span>
        </div>
        <div className="mt-auto pt-3">
          <span className="font-[family-name:var(--font-display)] text-xl font-semibold text-foreground">
            {formatPrice(property.price, property.listing_type)}
          </span>
        </div>
      </div>
    </Link>
  );
}