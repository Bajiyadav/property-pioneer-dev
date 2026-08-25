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
import { generatePropertySlug } from "@/config/app";
import { useFavorites } from "@/modules/property/hooks/useFavorites";
import { PropertyBadges } from "@/modules/property/components/PropertyBadges";
import { PropertyStatus } from "@/modules/property/components/PropertyStatus";
import {
  PropertyImageBranding,
  DEFAULT_PROPERTY_COVER,
} from "@/modules/property/components/PropertyImageBranding";
import { InquiryPhoneModal } from "@/modules/tenant/components/InquiryPhoneModal";

export function PropertyCard({ property }: { property: Property }) {
  const { has, toggle } = useFavorites();
  const saved = has(property.id);
  const [copied, setCopied] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  // Coarse location only — the exact street address is gated (never in the
  // public payload), so cards show locality/city, not the street address.
  const locationLabel = property.locality
    ? `${property.locality}, ${property.city}`
    : property.city || "Hyderabad";

  // Mock furnishing status
  const furnishingStatus =
    property.price > 40000
      ? "Fully Furnished"
      : property.price > 25000
        ? "Semi Furnished"
        : "Unfurnished";

  /*
   * Card layout is VERTICAL at every width, deliberately.
   *
   * The root was `flex-col sm:flex-row`, putting the image beside the details from
   * 640px up. All six places that render this card put it in a multi-column grid
   * (`sm:grid-cols-2`, `lg:grid-cols-3`), so above 640px the card is only about
   * 300-350px wide. The image is a fixed `w-[280px] shrink-0`, which left roughly
   * 70px for the title, price and button — and because the root also sets
   * `overflow-hidden`, the result was not a visible break but a silent clip:
   * "Sunlit 2BHK" rendered as "Sunli...", the price as "₹...", the button as
   * "Get Deta...".
   *
   * A side-by-side card needs a full-width row to live in, and nothing here
   * provides one. `overflow-hidden` stays, because it is what rounds the image
   * corners — so the clip has to be prevented by the layout rather than absorbed.
   */
  /*
   * There is no layout variant, deliberately.
   *
   * A `layout` prop was added with a "responsive" default that resolved to the
   * horizontal branch. No call site passed it, so every card on the site went
   * back to image-left/details-right inside a multi-column grid — the exact
   * failure described above, and this time the columns were narrow enough that
   * the three stat labels printed on top of each other ("RENT/MDEPOSIT") and the
   * button read "Get Ow… Det…".
   *
   * A variant whose default breaks every consumer is worse than no variant. If a
   * horizontal card is ever genuinely needed, it needs a full-width row to live
   * in, and that container should be built and tested at the same time.
   */
  const rootClasses =
    "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-500/40";

  const imageClasses =
    "relative w-full shrink-0 aspect-[4/3] overflow-hidden bg-muted group/carousel";

  return (
    <div className={rootClasses}>
      {/* 1. IMAGE CONTAINER */}
      <div className={imageClasses}>
        <Link
          to="/properties/$id"
          params={{ id: generatePropertySlug(property) }}
          className="block h-full w-full"
          tabIndex={-1}
          aria-hidden="true"
        >
          {images[0] === DEFAULT_PROPERTY_COVER &&
          (!property.images || property.images.length === 0) ? (
            <div className="h-full w-full flex flex-col items-center justify-center bg-secondary text-muted-foreground border-b border-border/50">
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

      {/* 2. CARD CONTENT */}
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-3.5">
          <div className="min-w-0 flex-1">
            <Link
              to="/properties/$id"
              params={{ id: generatePropertySlug(property) }}
              className="group-hover:text-primary transition-colors block"
            >
              <h3 className="line-clamp-1 text-base sm:text-lg font-extrabold text-foreground tracking-tight hover:text-primary transition-colors">
                {property.title || "Property in Hyderabad"}
              </h3>
            </Link>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground line-clamp-1">
              <MapPin className="h-3.5 w-3.5 flex-none text-primary" />
              <span>{locationLabel}</span>
            </p>
          </div>

          {/* Top Right Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleFavoriteToggle}
              aria-label={saved ? "Remove from saved homes" : "Save this property"}
              className={`grid h-8 w-8 place-items-center rounded-xl border transition-all ${saved ? "border-primary/30 bg-primary/10" : "border-border/60 bg-transparent hover:bg-secondary"}`}
            >
              <Heart
                className="h-3.5 w-3.5 transition-colors"
                fill={saved ? "currentColor" : "none"}
                style={saved ? { color: "oklch(0.55 0.22 27)" } : undefined}
              />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label={copied ? "Link copied" : "Copy link to this property"}
              className="grid h-8 w-8 place-items-center rounded-xl border border-border/60 bg-transparent hover:bg-secondary transition-all"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Financials & Specs Row */}
        <div
          data-testid="stat-row"
          className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-border/40 bg-secondary/15 py-3 text-center"
        >
          <div className="flex min-w-0 flex-col items-center justify-center border-r border-border/40 px-1 text-center">
            <span
              data-testid="stat-value"
              className="w-full truncate font-[family-name:var(--font-display)] text-base font-extrabold tabular-nums text-primary"
            >
              {formatPriceCompact(property.price, property.listing_type)}
            </span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Rent/Month
            </span>
          </div>
          <div className="flex min-w-0 flex-col items-center justify-center border-r border-border/40 px-1 text-center">
            <span
              data-testid="stat-value"
              className="w-full truncate font-[family-name:var(--font-display)] text-base font-extrabold tabular-nums text-foreground"
            >
              {estimatedDeposit
                ? formatPriceCompact(estimatedDeposit, property.listing_type)
                : "N/A"}
            </span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Deposit
            </span>
          </div>
          <div className="flex min-w-0 flex-col items-center justify-center px-1 text-center">
            <span
              data-testid="stat-value"
              className="w-full truncate font-[family-name:var(--font-display)] text-base font-extrabold tabular-nums text-foreground"
            >
              {property.area_sqft || "N/A"}
            </span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Builtup (Sq.ft)
            </span>
          </div>
        </div>

        {/* Feature Tags */}
        <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-bold text-muted-foreground">
          <span className="inline-flex items-center rounded-full bg-secondary/50 px-2.5 py-1 border border-border/30">
            <BedDouble className="mr-1.5 h-3.5 w-3.5 text-primary" />
            {property.bedrooms} BHK
          </span>
          <span className="inline-flex items-center rounded-full bg-secondary/50 px-2.5 py-1 border border-border/30">
            <Bath className="mr-1.5 h-3.5 w-3.5 text-primary" />
            {property.bathrooms} Baths
          </span>
          <span className="inline-flex items-center rounded-full bg-secondary/50 px-2.5 py-1 border border-border/30">
            {furnishingStatus}
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            No Commission
          </span>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3.5 border-t border-border/30 flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground bg-secondary/30 px-2.5 py-1.5 rounded-lg border border-border/20">
            Direct Owner Listing
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof window !== "undefined" && !localStorage.getItem("supabase.auth.token")) {
                toast.info("Sign in to unlock direct owner contact without brokerage", {
                  description: "0% Brokerage — connect directly with verified owners upon login.",
                  duration: 4000,
                });
              }
              setIsModalOpen(true);
            }}
            className="group/btn inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-4.5 py-2 text-xs font-bold text-white transition-all shadow-sm hover:shadow-md hover:translate-y-[-1px] active:translate-y-0 cursor-pointer"
          >
            <span>Get Owner Details</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
      <InquiryPhoneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        propertyId={property.id}
        propertyTitle={property.title || "Property in Hyderabad"}
      />
    </div>
  );
}
