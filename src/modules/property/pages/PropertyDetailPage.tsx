import { Link, notFound, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import { beginPropertyViewTimer } from "@/modules/analytics/services/tracking";
import { useAuthSession } from "@/hooks/useAuthSession";
import { toast } from "sonner";
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Maximize,
  MapPin,
  Heart,
  Mail,
  User,
  CheckCircle2,
  Calendar,
  FileText,
  Share2,
  Phone,
  ShieldCheck,
  Sparkles,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Play,
  Building2,
  Compass,
  Wifi,
  Zap,
  Car,
  Building,
  Check,
  Copy,
  X,
  Scale,
  Sparkle,
  Clock,
  Shield,
  TrainTrack,
  GraduationCap,
  Hospital,
  HelpCircle,
  ChevronDown,
  Video,
} from "lucide-react";
import {
  fetchProperty,
  formatPrice,
  type Property,
} from "@/modules/property/services/propertyQueries";
import { useFavorites } from "@/modules/property/hooks/useFavorites";
import { StatCard } from "@/modules/property/components/PropertyStatCard";
import { EnquiryForm } from "@/modules/property/components/PropertyEnquiryForm";
import { PropertyStructuredData } from "@/modules/property/components/PropertyStructuredData";
import { RoomCard } from "@/modules/property/components/PropertyDisplayAtoms";
import { PropertyImageBranding } from "@/shared/components/PropertyImageBranding";
import { PropertyWatermark } from "@/shared/components/PropertyWatermark";
import { VideoPlayer } from "@/shared/components/ui/VideoPlayer";
import { PropertyBadges } from "@/modules/property/components/PropertyBadges";
import { PropertyStatus } from "@/modules/property/components/PropertyStatus";
import { WhatsAppButton } from "@/modules/property/components/WhatsAppButton";
import { ScheduleVisitModal } from "@/modules/interactions/components/ScheduleVisitModal";
import { EmiCalculatorModal } from "@/shared/components/dialogs/EmiCalculatorModal";
import { ReportListingModal } from "@/shared/components/dialogs/ReportListingModal";
import { SimilarProperties } from "@/modules/property/components/SimilarProperties";
import { APP_NAME, extractIdFromSlug } from "@/config/app";

export function PropertyDetailPage() {
  const { id: slugOrId } = useParams({ strict: false }) as { id: string };
  const id = extractIdFromSlug(slugOrId);
  const { has, toggle } = useFavorites();
  const { user } = useAuthSession();
  const tenantId = user?.id || "anonymous-tenant";

  // One view row per visit, filed on the way out so `time_spent` is measured
  // rather than guessed. No-ops entirely without analytics consent.
  useEffect(() => {
    if (!id) return;
    return beginPropertyViewTimer(id);
  }, [id]);

  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [emiOpen, setEmiOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const videoSectionRef = useRef<HTMLDivElement>(null);

  const {
    data: property,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchProperty(id as string),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  // Keyboard navigation for full-screen media lightbox
  useEffect(() => {
    if (!lightboxOpen || !property?.images?.length) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") {
        setActiveImg((prev) => (prev > 0 ? prev - 1 : property.images.length - 1));
      }
      if (e.key === "ArrowRight") {
        setActiveImg((prev) => (prev < property.images.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, property?.images]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const shareTitle = property?.title || "Rental Property on Seedha Properties";
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out this verified rental property: ${shareTitle}`,
          url,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success("Property link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }, [property?.title]);

  // Keyboard navigation for fullscreen lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") {
        setActiveImg((prev) => (prev > 0 ? prev - 1 : (property?.images.length || 1) - 1));
      }
      if (e.key === "ArrowRight") {
        setActiveImg((prev) => (prev < (property?.images.length || 1) - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, property?.images.length]);

  const scrollToVideo = useCallback(() => {
    if (videoSectionRef.current) {
      videoSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="h-12 w-48 animate-pulse rounded-full bg-muted" />
        <div className="mt-6 h-[480px] animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  if (isError || !property) throw notFound();

  const saved = has(property.id);
  const isRental = property.listing_type === "rent";
  const estimatedDeposit = isRental && property.price ? property.price * 2 : null;

  const faqs = [
    {
      q: "Is there any brokerage or platform commission on this property?",
      a: "No. Seedha Properties charges no platform commission for browsing or contacting listing owners.",
    },
    {
      q: "How do I schedule an in-person or video visit?",
      a: "Click the 'Schedule Visit' button to choose your preferred date and time slot. Your request will be directly sent to the verified owner.",
    },
    {
      q: "What is the security deposit and notice period?",
      a: `Standard security deposit for this rental is ₹${(property.price * 2).toLocaleString("en-IN")} (2 months rent) with a 1-month notice period prior to move-out.`,
    },
    {
      q: "Are the property video tours authentic?",
      a: "Yes, every uploaded video tour is moderated and verified before appearing publicly on Seedha Properties.",
    },
  ];
  return (
    <div className="min-h-screen bg-background pb-28">
      <PropertyStructuredData property={property} />

      {/* 1. STICKY SUMMARY BAR */}
      <div className="sticky top-[60px] md:top-[72px] z-30 border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/properties"
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary/50 text-foreground hover:bg-secondary hover:text-primary transition-all shrink-0 shadow-xs"
              title="Back to Listings"
              aria-label="Back to Listings"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-foreground line-clamp-1">
                {property.title}
              </h1>
              <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" /> {property.locality || property.city}
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8 divide-x divide-border shrink-0">
            <div className="flex flex-col items-center px-4">
              <span className="text-xl font-bold text-foreground">
                ₹{property.price.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Rent
              </span>
            </div>
            <div className="flex flex-col items-center px-4">
              <span className="text-xl font-bold text-foreground">
                {property.area_sqft || "N/A"}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Sq.Ft
              </span>
            </div>
            <div className="flex flex-col items-center px-4">
              <span className="text-xl font-bold text-foreground">
                {estimatedDeposit ? `₹${estimatedDeposit.toLocaleString("en-IN")}` : "N/A"}
              </span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Deposit
              </span>
            </div>
            <div className="pl-4">
              <button className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-2.5 rounded shadow-sm transition">
                Apply Loan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. BREADCRUMBS */}
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition">
            Home
          </Link>
          <span>/</span>
          {property.property_type?.toLowerCase() === "commercial" ? (
            <>
              <Link
                to="/commercial/$city"
                params={{ city: property.city.toLowerCase().replace(/\s+/g, "-") }}
                className="capitalize hover:text-foreground transition"
              >
                Commercial in {property.city}
              </Link>
              {property.locality && (
                <>
                  <span>/</span>
                  <Link
                    to="/commercial/$city/$locality"
                    params={{
                      city: property.city.toLowerCase().replace(/\s+/g, "-"),
                      locality: property.locality.toLowerCase().replace(/\s+/g, "-"),
                    }}
                    className="hover:text-foreground transition"
                  >
                    {property.locality}
                  </Link>
                </>
              )}
            </>
          ) : property.listing_type === "sale" ? (
            <>
              <Link
                to="/buy/$city"
                params={{ city: property.city.toLowerCase().replace(/\s+/g, "-") }}
                className="capitalize hover:text-foreground transition"
              >
                Buy in {property.city}
              </Link>
              {property.locality && (
                <>
                  <span>/</span>
                  <Link
                    to="/buy/$city/$locality"
                    params={{
                      city: property.city.toLowerCase().replace(/\s+/g, "-"),
                      locality: property.locality.toLowerCase().replace(/\s+/g, "-"),
                    }}
                    className="hover:text-foreground transition"
                  >
                    {property.locality}
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link
                to="/rent/$city"
                params={{ city: property.city.toLowerCase().replace(/\s+/g, "-") }}
                className="capitalize hover:text-foreground transition"
              >
                Rent in {property.city}
              </Link>
              {property.locality && (
                <>
                  <span>/</span>
                  <Link
                    to="/rent/$city/$locality"
                    params={{
                      city: property.city.toLowerCase().replace(/\s+/g, "-"),
                      locality: property.locality.toLowerCase().replace(/\s+/g, "-"),
                    }}
                    className="hover:text-foreground transition"
                  >
                    {property.locality}
                  </Link>
                </>
              )}
            </>
          )}
          <span>/</span>
          <span className="font-medium text-foreground truncate max-w-[200px]">
            {property.title}
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 mt-2">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* LEFT COLUMN: Gallery & Overview */}
          <div className="flex-1 w-full lg:w-2/3 flex flex-col gap-6">
            {/* Mosaic Gallery */}
            <div className="relative grid grid-cols-3 gap-1 rounded-sm overflow-hidden h-[300px] sm:h-[450px] bg-muted">
              {/* Main Image */}
              <div
                className="col-span-2 relative h-full group cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              >
                <img
                  src={property.images[0]}
                  alt={(() => {
                    const furnishing = property.furnishing_status
                      ? `${property.furnishing_status} `
                      : "";
                    const type = property.property_type || "property";
                    const beds = property.bedrooms ? `${property.bedrooms} BHK ` : "";
                    const action = property.listing_type === "sale" ? "for sale" : "for rent";
                    const loc = property.locality ? `in ${property.locality}` : "";
                    const city = property.city
                      ? `${property.locality ? ", " : "in "}${property.city}`
                      : "";
                    return `${beds}${furnishing}${type} ${action} ${loc}${city} - exterior view`;
                  })()}
                  className="w-full h-full object-cover transition duration-300 group-hover:opacity-90"
                />
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                  <span className="bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 backdrop-blur-sm">
                    <Maximize2 className="w-3.5 h-3.5" /> Photos
                  </span>
                  <span className="bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 backdrop-blur-sm">
                    <MapPin className="w-3.5 h-3.5" /> Location
                  </span>
                  {property.video_url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToVideo();
                      }}
                      className="bg-black/70 hover:bg-black/80 text-white text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 backdrop-blur-sm transition cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Video Tour
                    </button>
                  )}
                </div>
              </div>
              {/* Right Images */}
              <div className="col-span-1 grid grid-rows-2 gap-1 h-full">
                <div
                  className="relative h-full group cursor-pointer"
                  onClick={() => setLightboxOpen(true)}
                >
                  <img
                    src={property.images[1] || property.images[0]}
                    alt={(() => {
                      const furnishing = property.furnishing_status
                        ? `${property.furnishing_status} `
                        : "";
                      const type = property.property_type || "property";
                      const beds = property.bedrooms ? `${property.bedrooms} BHK ` : "";
                      const action = property.listing_type === "sale" ? "for sale" : "for rent";
                      const loc = property.locality ? `in ${property.locality}` : "";
                      const city = property.city
                        ? `${property.locality ? ", " : "in "}${property.city}`
                        : "";
                      return `${beds}${furnishing}${type} ${action} ${loc}${city} - interior view`;
                    })()}
                    className="w-full h-full object-cover transition duration-300 group-hover:opacity-90"
                  />
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(property.id);
                      }}
                      className="bg-black/60 text-white px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 hover:bg-black/80 backdrop-blur-sm"
                    >
                      <Heart className="w-3.5 h-3.5" fill={saved ? "currentColor" : "none"} />
                      <span className="hidden sm:inline">Shortlist</span>
                    </button>
                  </div>
                </div>
                <div
                  className="relative h-full group cursor-pointer"
                  onClick={() => setLightboxOpen(true)}
                >
                  <img
                    src={property.images[2] || property.images[0]}
                    alt={(() => {
                      const furnishing = property.furnishing_status
                        ? `${property.furnishing_status} `
                        : "";
                      const type = property.property_type || "property";
                      const beds = property.bedrooms ? `${property.bedrooms} BHK ` : "";
                      const action = property.listing_type === "sale" ? "for sale" : "for rent";
                      const loc = property.locality ? `in ${property.locality}` : "";
                      const city = property.city
                        ? `${property.locality ? ", " : "in "}${property.city}`
                        : "";
                      return `${beds}${furnishing}${type} ${action} ${loc}${city} - alternative view`;
                    })()}
                    className="w-full h-full object-cover transition duration-300 group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition duration-300 group-hover:bg-black/60">
                    <span className="text-white text-3xl font-bold">
                      +{Math.max(0, property.images.length - 2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Nearby Tags */}
            <div className="flex items-center gap-2 flex-wrap text-sm border border-border/60 p-3 rounded-sm bg-card shadow-sm">
              <span className="font-semibold text-muted-foreground mr-1 text-xs">Nearby:</span>
              <span className="bg-secondary px-2.5 py-1 rounded text-xs text-foreground border border-border/50">
                Sundar Nagar Colony
              </span>
              <span className="bg-secondary px-2.5 py-1 rounded text-xs text-foreground border border-border/50">
                Kondapur
              </span>
              <span className="bg-secondary px-2.5 py-1 rounded text-xs text-foreground border border-border/50">
                Red Fox Hotel
              </span>
              <span className="bg-secondary px-2.5 py-1 rounded text-xs text-foreground border border-border/50">
                Yashoda Hospitals
              </span>
              <span className="bg-secondary px-2.5 py-1 rounded text-xs text-foreground border border-border/50">
                JNTU College
              </span>
            </div>

            {/* Overview */}
            <div className="border border-border/60 rounded-sm bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold border-b-2 border-rose-500 pb-2 inline-block mb-4">
                Overview
              </h2>
              <p className="whitespace-pre-line text-sm text-foreground/80 leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Video Tour Section */}
            {property.video_url && (
              <div
                ref={videoSectionRef}
                className="border border-border/60 rounded-sm bg-card p-6 shadow-sm scroll-mt-24"
              >
                <h2 className="text-lg font-bold border-b-2 border-rose-500 pb-2 inline-block mb-4">
                  Video Tour
                </h2>
                <div className="relative overflow-hidden rounded-xl bg-black/5 shadow-md border border-border/40">
                  <VideoPlayer src={property.video_url} poster={property.images[0]} />
                </div>
              </div>
            )}

            {/* Activity */}
            <div className="border border-border/60 rounded-sm bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold border-b-2 border-rose-500 pb-2 inline-block mb-4">
                Activity On This Property
              </h2>
              <div className="flex items-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-50 rounded-full text-rose-500">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">142</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-50 rounded-full text-rose-500">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">24</p>
                    <p className="text-xs text-muted-foreground">Shortlists</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-50 rounded-full text-rose-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">12</p>
                    <p className="text-xs text-muted-foreground">Contacts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Details Grid & CTAs */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="border border-border/60 rounded-sm bg-card shadow-sm">
              <div className="grid grid-cols-2">
                <div className="flex items-start gap-3 p-4 border-b border-r border-border/60">
                  <BedDouble className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{property.bedrooms} BHK</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Room Type</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border-b border-border/60">
                  <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{property.property_type}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Property Type</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border-b border-r border-border/60">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Any</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Preferred Tenant</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border-b border-border/60">
                  <CheckCircle2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Immediately</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Possession</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border-b border-r border-border/60">
                  <Car className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Available</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Parking</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border-b border-border/60">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">1-3 Years</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Age of Building</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border-r border-border/60">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Yes</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Balcony</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border-border/60">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Today</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Posted On</p>
                  </div>
                </div>
              </div>

              <div className="p-4 flex gap-3 border-t border-border/60 border-dashed bg-secondary/5">
                <button
                  onClick={() => setEnquiryOpen(true)}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 text-sm rounded shadow transition"
                >
                  Contact
                </button>
                <button
                  onClick={() => setScheduleOpen(true)}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 text-sm rounded shadow transition"
                >
                  Schedule Visit
                </button>
              </div>

              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-t border-border/60">
                <div className="flex items-start gap-2 mb-3">
                  <Shield className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-xs font-medium text-emerald-900 dark:text-emerald-100 leading-tight">
                    Report what was not correct in this property
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReportOpen(true)}
                    className="flex-1 text-xs font-semibold bg-background border border-border px-3 py-2 rounded hover:bg-secondary transition"
                  >
                    Listed by Broker
                  </button>
                  <button
                    onClick={() => setReportOpen(true)}
                    className="flex-1 text-xs font-semibold bg-background border border-border px-3 py-2 rounded hover:bg-secondary transition"
                  >
                    Rented Out
                  </button>
                </div>
              </div>
            </div>

            {enquiryOpen && (
              <div className="rounded-sm border border-border/60 bg-card p-4 shadow-sm">
                <h3 className="font-bold mb-4">Send Message to Owner</h3>
                <EnquiryForm
                  propertyId={property.id}
                  ownerId={property.owner_id || property.id}
                  tenantId={tenantId}
                  onSent={() => setEnquiryOpen(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* 5. SIMILAR RENTALS RECOMMENDATION SECTION */}
        <div className="mt-12">
          <SimilarProperties currentProperty={property} />
        </div>

        {/* MODAL COMPONENTS */}
        <EmiCalculatorModal
          isOpen={emiOpen}
          onClose={() => setEmiOpen(false)}
          initialPrice={property.listing_type === "sale" ? property.price : property.price * 250}
        />

        <ReportListingModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          propertyTitle={property.title}
        />

        <ScheduleVisitModal
          propertyId={property.id}
          propertyTitle={property.title}
          ownerId={property.owner_id || property.id}
          tenantId={tenantId}
          isOpen={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
        />
      </main>

      {/* 7. FULLSCREEN LIGHTBOX MODAL */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl shadow-2xl">
            <img
              src={property.images[activeImg]}
              alt=""
              className="max-h-[85vh] max-w-[90vw] object-contain"
            />
            <PropertyWatermark size="lg" position="bottom-right" />
          </div>

          {property.images.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActiveImg((prev) => (prev > 0 ? prev - 1 : property.images.length - 1))
                }
                className="absolute left-6 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() =>
                  setActiveImg((prev) => (prev < property.images.length - 1 ? prev + 1 : 0))
                }
                className="absolute right-6 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
