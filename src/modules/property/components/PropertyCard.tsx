import { useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  Heart,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Play,
  Share2,
  Check,
  ArrowRight,
  ShieldCheck,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { type Property, formatPrice } from "@/modules/property/services/propertyQueries";
import { useFavorites } from "@/modules/property/hooks/useFavorites";
import { PropertyBadges } from "@/modules/property/components/PropertyBadges";
import { PropertyStatus } from "@/modules/property/components/PropertyStatus";
import {
  PropertyImageBranding,
  DEFAULT_PROPERTY_COVER,
} from "@/shared/components/PropertyImageBranding";

export function PropertyCard({ property }: { property: Property }) {
  const { has, toggle } = useFavorites();
  const saved = has(property.id);
  const [copied, setCopied] = useState(false);

  const cover =
    Array.isArray(property.images) && property.images[0]
      ? property.images[0]
      : DEFAULT_PROPERTY_COVER;

  const handleShare = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const url = `${window.location.origin}/properties/${property.id}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Listing link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      }
    },
    [property.id],
  );

  const handleFavoriteToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggle(property.id);
      toast.success(saved ? "Removed from saved homes" : "Added to your saved homes");
    },
    [saved, toggle, property.id],
  );

  const isRental = property.listing_type === "rent";
  const estimatedDeposit = isRental && property.price ? property.price * 2 : null;
  const locationLabel = property.locality
    ? `${property.locality}, ${property.city}`
    : property.address
      ? `${property.address}, ${property.city}`
      : property.city || "Hyderabad";

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-lift)] hover:-translate-y-1">
      {/* 1. IMAGE CONTAINER WITH BRANDING & BADGES */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Link
          to="/properties/$id"
          params={{ id: property.id }}
          className="block h-full w-full"
          tabIndex={-1}
          aria-hidden="true"
        >
          <PropertyImageBranding
            src={cover}
            alt={property.title || "Rental home in Hyderabad"}
            loading="lazy"
            watermarkSize="sm"
            watermarkPosition="bottom-right"
            containerClassName="h-full w-full"
            imageClassName="transition duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 max-w-[75%] z-10 pointer-events-none">
          <span className="rounded-full bg-background/90 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-foreground backdrop-blur shadow-sm">
            For {property.listing_type || "rent"}
          </span>
          {property.status && property.status !== "available" && (
            <PropertyStatus status={property.status} size="sm" />
          )}
          <PropertyBadges property={property} size="sm" />
        </div>

        {/* Video Tour Badge (Only shown when a real approved video exists) */}
        {property.video_url && (
          <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-md">
              <Play className="h-3 w-3 fill-current" /> Video Tour
            </span>
          </div>
        )}

        {/* Top Right Quick Actions (Save & Share) */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share property listing"
            className="grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground backdrop-blur shadow-sm transition hover:bg-background hover:scale-110 active:scale-95"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Share2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            )}
          </button>

          <button
            type="button"
            onClick={handleFavoriteToggle}
            aria-label={saved ? "Remove from saved homes" : "Save this property"}
            className="grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground backdrop-blur shadow-sm transition hover:bg-background hover:scale-110 active:scale-95"
          >
            <Heart
              className="h-4 w-4 transition-colors"
              fill={saved ? "currentColor" : "none"}
              style={saved ? { color: "var(--primary)" } : undefined}
            />
          </button>
        </div>
      </div>

      {/* 2. CARD CONTENT */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Price & Deposit Row */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-[family-name:var(--font-display)] text-xl font-bold text-foreground">
            {formatPrice(property.price, property.listing_type)}
          </span>
          {isRental && estimatedDeposit && (
            <span className="text-[11px] font-medium text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-md">
              Deposit: ₹{estimatedDeposit.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {/* Title */}
        <Link
          to="/properties/$id"
          params={{ id: property.id }}
          className="mt-2 group-hover:text-primary transition-colors"
        >
          <h3 className="line-clamp-1 font-[family-name:var(--font-display)] text-base font-semibold text-foreground">
            {property.title || "Hyderabad Property"}
          </h3>
        </Link>

        {/* Location */}
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground line-clamp-1">
          <MapPin className="h-3.5 w-3.5 flex-none text-primary" />
          <span>{locationLabel}</span>
        </p>

        {/* Key Rental Specifications */}
        <div className="mt-3 flex items-center gap-3 border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
            {property.bedrooms} BHK
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Bath className="h-3.5 w-3.5 text-muted-foreground" />
            {property.bathrooms} Ba
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Maximize className="h-3.5 w-3.5 text-muted-foreground" />
            {property.area_sqft} sqft
          </span>
          <span className="ml-auto text-[11px] capitalize text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded">
            {property.property_type || "Apartment"}
          </span>
        </div>

        {/* View Details CTA */}
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" /> 0% Brokerage
          </span>

          <Link
            to="/properties/$id"
            params={{ id: property.id }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground active:scale-95"
          >
            <span>View Details</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
