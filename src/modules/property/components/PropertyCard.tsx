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
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { type Property, formatPriceCompact } from "@/modules/property/services/propertyQueries";
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images =
    Array.isArray(property.images) && property.images.length > 0
      ? property.images
      : [DEFAULT_PROPERTY_COVER];

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

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const isRental = property.listing_type === "rent";
  const estimatedDeposit = isRental && property.price ? property.price * 2 : null;
  const locationLabel = property.locality
    ? `${property.locality}, ${property.city}`
    : property.address
      ? `${property.address}, ${property.city}`
      : property.city || "Hyderabad";

  // Mock furnishing status
  const furnishingStatus =
    property.price > 40000
      ? "Fully Furnished"
      : property.price > 25000
        ? "Semi Furnished"
        : "Unfurnished";

  return (
    <div className="group relative flex flex-col sm:flex-row overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/40">
      {/* 1. IMAGE CONTAINER */}
      <div className="relative w-full sm:w-[280px] shrink-0 aspect-[4/3] sm:aspect-auto overflow-hidden bg-muted group/carousel">
        <Link
          to="/properties/$id"
          params={{ id: property.id }}
          className="block h-full w-full"
          tabIndex={-1}
          aria-hidden="true"
        >
          {images[0] === DEFAULT_PROPERTY_COVER &&
          (!property.images || property.images.length === 0) ? (
            <div className="h-full w-full flex flex-col items-center justify-center bg-secondary text-muted-foreground border-b sm:border-b-0 sm:border-r border-border/50">
              <ImageIcon className="h-12 w-12 opacity-50 mb-2" />
              <span className="text-xs font-semibold uppercase tracking-widest bg-background/80 px-3 py-1 rounded-full shadow-sm">
                Request Photos
              </span>
            </div>
          ) : (
            <PropertyImageBranding
              src={images[currentImageIndex]}
              alt={`${property.title || "Rental home"} - Image ${currentImageIndex + 1}`}
              loading="lazy"
              watermarkSize="sm"
              watermarkPosition="bottom-right"
              containerClassName="h-full w-full"
              imageClassName="transition-transform duration-700 ease-out group-hover:scale-105 object-cover h-full"
            />
          )}
        </Link>

        {/* Carousel Controls */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground backdrop-blur-md shadow-md opacity-0 transition-opacity group-hover/carousel:opacity-100 hover:bg-background"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 text-foreground backdrop-blur-md shadow-md opacity-0 transition-opacity group-hover/carousel:opacity-100 hover:bg-background"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {/* Image Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 max-w-[75%] z-10 pointer-events-none">
          <PropertyBadges property={property} size="sm" />
          {property.video_url && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-md border border-white/20">
              <Play className="h-3 w-3 fill-current" /> Video Tour
            </span>
          )}
        </div>
      </div>

      {/* 2. CARD CONTENT (Right Side) */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-3">
          <div>
            <Link
              to="/properties/$id"
              params={{ id: property.id }}
              className="group-hover:text-primary transition-colors block"
            >
              <h3 className="line-clamp-1 text-lg sm:text-xl font-bold text-foreground">
                {property.title || "Property in Hyderabad"}
              </h3>
            </Link>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground line-clamp-1">
              <MapPin className="h-4 w-4 flex-none text-primary" />
              <span>{locationLabel}</span>
            </p>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleFavoriteToggle}
              aria-label={saved ? "Remove from saved homes" : "Save this property"}
              className={`grid h-9 w-9 place-items-center rounded-md border transition-all ${saved ? "border-primary bg-primary/10" : "border-border bg-transparent hover:bg-secondary"}`}
            >
              <Heart
                className="h-4 w-4 transition-colors"
                fill={saved ? "currentColor" : "none"}
                style={saved ? { color: "oklch(0.55 0.22 27)" } : undefined}
              />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label={copied ? "Link copied" : "Copy link to this property"}
              className="grid h-9 w-9 place-items-center rounded-md border border-border bg-transparent hover:bg-secondary transition-all"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Share2 className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/*
          Financials & Specs Row — three equal columns.

          The price used to overflow this row on a phone, escaping past the
          divider and out of the card. The cause was NOT the font size; it was a
          CSS Grid default that is easy to miss:

            A grid item's `min-width` is `auto`, which means a `1fr` track will
            NOT shrink below its content's min-content width. So a long value
            like "₹1,50,000/mo" forced its track wider than the third it was
            allotted, and the excess spilled out of the container.

          `min-w-0` on each cell is the actual fix — it lets the track hold its
          share. `truncate` is the belt-and-braces guarantee: if a value is ever
          longer than expected, it is clipped with an ellipsis INSIDE the cell
          instead of escaping it. Both are load-bearing; removing either brings
          the overflow back.

          The rest is legibility on a small screen: the value steps down a size
          below `sm`, spacing tightens, and `tabular-nums` gives digits equal
          width so the three columns align instead of jittering per listing.

          `data-testid="stat-value"` is what the element-level overflow test in
          tests/e2e/responsive.spec.ts asserts against — the page-level check
          there cannot see this class of bug, because a card overflowing its own
          box does not make the document any wider.
        */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4 rounded-md border border-border/50 bg-secondary/10 py-3 sm:py-4">
          <div className="flex min-w-0 flex-col items-center justify-center border-r border-border/50 px-1 text-center sm:px-2">
            <span
              data-testid="stat-value"
              className="w-full truncate text-base font-bold tabular-nums text-foreground sm:text-xl"
            >
              {formatPriceCompact(property.price, property.listing_type)}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
              Rent/Month
            </span>
          </div>
          <div className="flex min-w-0 flex-col items-center justify-center border-r border-border/50 px-1 text-center sm:px-2">
            <span
              data-testid="stat-value"
              className="w-full truncate text-base font-bold tabular-nums text-foreground sm:text-xl"
            >
              {estimatedDeposit
                ? formatPriceCompact(estimatedDeposit, property.listing_type)
                : "N/A"}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
              Deposit
            </span>
          </div>
          <div className="flex min-w-0 flex-col items-center justify-center px-1 text-center sm:px-2">
            <span
              data-testid="stat-value"
              className="w-full truncate text-base font-bold tabular-nums text-foreground sm:text-xl"
            >
              {property.area_sqft || "N/A"}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
              Builtup (Sq.ft)
            </span>
          </div>
        </div>

        {/* Feature Tags */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 font-medium text-foreground">
            <BedDouble className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            {property.bedrooms} BHK
          </span>
          <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 font-medium text-foreground">
            <Bath className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            {property.bathrooms} Baths
          </span>
          <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 font-medium text-foreground">
            {furnishingStatus}
          </span>
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 border border-emerald-200">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            No Commission
          </span>
        </div>

        {/* Footer Actions */}
        <div className="mt-auto pt-5 flex items-center justify-end">
          <Link
            to="/properties/$id"
            params={{ id: property.id }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-primary hover:bg-primary/90 px-6 py-2.5 text-sm font-bold text-primary-foreground transition-all shadow-sm"
          >
            Get Owner Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
