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
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { type Property, formatPrice } from "@/modules/property/services/propertyQueries";
import { useFavorites } from "@/modules/property/hooks/useFavorites";
import { useAuthSession } from "@/hooks/useAuthSession";
import { PropertyBadges } from "@/modules/property/components/PropertyBadges";
import { LeadCaptureModal } from "@/shared/components/dialogs/LeadCaptureModal";
import {
  PropertyImageBranding,
  DEFAULT_PROPERTY_COVER,
} from "@/shared/components/PropertyImageBranding";

export function PropertyCard({ property }: { property: Property }) {
  const { has, toggle } = useFavorites();
  const { user } = useAuthSession();
  const saved = has(property.id);
  const [copied, setCopied] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [leadModalOpen, setLeadModalOpen] = useState(false);

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

  const handleGetOwnerDetails = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      e.stopPropagation();
      setLeadModalOpen(true);
    }
  };

  const isRental = property.listing_type === "rent";
  const estimatedDeposit = isRental && property.price ? property.price * 2 : null;
  const locationLabel = property.locality
    ? `${property.locality}, ${property.city}`
    : property.address
      ? `${property.address}, ${property.city}`
      : property.city || "Hyderabad";

  const furnishingStatus =
    property.furnishing_status
      ? property.furnishing_status.replace("-", " ")
      : property.price > 40000
        ? "Fully Furnished"
        : property.price > 25000
          ? "Semi Furnished"
          : "Unfurnished";

  const promoBadge = (property as any).promo_badge;

  return (
    <>
      <div className="group relative flex flex-col h-full overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/40 min-w-0">
        {/* 1. TOP IMAGE CONTAINER (Vertical Fixed Aspect Ratio) */}
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-muted group/carousel shrink-0">
          <Link
            to="/properties/$id"
            params={{ id: property.id }}
            className="block h-full w-full"
            tabIndex={-1}
            aria-hidden="true"
          >
            {images[0] === DEFAULT_PROPERTY_COVER &&
            (!property.images || property.images.length === 0) ? (
              <div className="h-full w-full flex flex-col items-center justify-center bg-secondary text-muted-foreground border-b border-border/50">
                <ImageIcon className="h-10 w-10 opacity-50 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-widest bg-background/80 px-2.5 py-0.5 rounded-full shadow-xs">
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
                imageClassName="transition-transform duration-700 ease-out group-hover:scale-105 object-cover h-full w-full"
              />
            )}
          </Link>

          {/* Carousel Arrows */}
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
              <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.slice(0, 5).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Top Left Floating Badges */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 max-w-[75%] z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-md backdrop-blur-md border border-white/20">
              <Zap className="h-3 w-3 fill-current" /> 0% Brokerage
            </span>

            {promoBadge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-md backdrop-blur-md border border-white/20">
                <Sparkles className="h-3 w-3" /> {promoBadge}
              </span>
            )}

            {property.is_featured && !promoBadge && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-600/90 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-md backdrop-blur-md border border-white/20">
                <Sparkles className="h-3 w-3" /> Featured
              </span>
            )}

            {((property as any).media_status === "verified" || property.property_verification_status === "verified") && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/90 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-md backdrop-blur-md border border-white/20">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </div>

          {/* Top Right Quick Actions */}
          <div className="absolute right-3 top-3 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={handleFavoriteToggle}
              aria-label={saved ? "Remove from saved homes" : "Save this property"}
              className="grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur-md text-foreground shadow-md transition hover:bg-background active:scale-95"
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
              aria-label="Share property"
              className="grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur-md text-foreground shadow-md transition hover:bg-background active:scale-95"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* 2. BOTTOM DETAILS CONTAINER (Clean Vertical Stack) */}
        <div className="flex flex-1 flex-col justify-between p-5 space-y-4 min-w-0">
          <div className="space-y-2">
            {/* Title & Locality */}
            <div>
              <Link
                to="/properties/$id"
                params={{ id: property.id }}
                className="group-hover:text-primary transition-colors block"
              >
                <h3 className="line-clamp-1 text-base sm:text-lg font-extrabold text-foreground">
                  {property.title || "Property in Hyderabad"}
                </h3>
              </Link>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground line-clamp-1">
                <MapPin className="h-3.5 w-3.5 flex-none text-primary" />
                <span className="font-medium">{locationLabel}</span>
              </p>
            </div>

            {/* Financial Highlights */}
            <div className="flex items-baseline justify-between pt-2 border-t border-border/40">
              <div>
                <span className="text-xl sm:text-2xl font-black text-foreground">
                  {formatPrice(property.price, property.listing_type)}
                </span>
              </div>
              {estimatedDeposit && (
                <span className="text-xs text-muted-foreground font-semibold">
                  Deposit: ₹{(estimatedDeposit / 1000).toFixed(0)}k
                </span>
              )}
            </div>

            {/* Specs Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
              <span className="inline-flex items-center gap-1 rounded-xl bg-secondary px-2.5 py-1 font-semibold text-foreground">
                <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                {property.bedrooms} BHK
              </span>
              <span className="inline-flex items-center gap-1 rounded-xl bg-secondary px-2.5 py-1 font-semibold text-foreground">
                <Bath className="h-3.5 w-3.5 text-muted-foreground" />
                {property.bathrooms} Bath
              </span>
              {property.area_sqft > 0 && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-secondary px-2.5 py-1 font-semibold text-foreground">
                  <Maximize className="h-3.5 w-3.5 text-muted-foreground" />
                  {property.area_sqft} sq.ft
                </span>
              )}
              <span className="inline-flex items-center rounded-xl bg-secondary/80 px-2.5 py-1 font-medium text-muted-foreground capitalize">
                {furnishingStatus}
              </span>
            </div>
          </div>

          {/* Full Width Action Button */}
          <div className="pt-2">
            <Link
              to="/properties/$id"
              params={{ id: property.id }}
              onClick={handleGetOwnerDetails}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/90 px-5 py-3 text-xs font-black text-primary-foreground shadow-md transition active:scale-95 cursor-pointer"
            >
              <span>Get Owner Contact</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Unauthenticated Lead Capture Gate */}
      <LeadCaptureModal
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        propertyId={property.id}
        propertyTitle={property.title}
        locality={property.locality || "Hyderabad"}
        actionType="contact_owner"
        onSuccess={() => {
          window.location.href = `/properties/${property.id}`;
        }}
      />
    </>
  );
}
