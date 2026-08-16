import { Link, notFound, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
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
import { ScheduleVisitModal } from "@/shared/components/dialogs/ScheduleVisitModal";
import { EmiCalculatorModal } from "@/shared/components/dialogs/EmiCalculatorModal";
import { ReportListingModal } from "@/shared/components/dialogs/ReportListingModal";
import { SimilarProperties } from "@/modules/property/components/SimilarProperties";
import { APP_NAME } from "@/config/app";

export function PropertyDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { has, toggle } = useFavorites();
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
    const shareTitle = property?.title || "Rental Property on Urban Properties";
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
      a: "No. Urban Properties charges no platform commission for browsing or contacting listing owners.",
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
      a: "Yes, every uploaded video tour is moderated and verified before appearing publicly on Urban Properties.",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <PropertyStructuredData property={property} />

      {/* 1. STICKY BACK NAVIGATION & BREADCRUMBS BAR */}
      <nav
        aria-label="Breadcrumbs and navigation"
        className="sticky top-16 z-30 border-b border-border/40 bg-background/85 backdrop-blur-xl transition-all"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/properties"
            search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
            className="group inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary hover:bg-card"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:-translate-x-0.5">
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
            <span>Back to Browse</span>
          </Link>

          {/* Breadcrumbs */}
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
            <Link to="/" className="hover:text-foreground transition">
              Home
            </Link>
            <span>/</span>
            <Link
              to="/rent/$city"
              params={{ city: property.city.toLowerCase() }}
              className="capitalize hover:text-foreground transition"
            >
              {property.city}
            </Link>
            {property.locality && (
              <>
                <span>/</span>
                <Link
                  to="/rent/$city/$locality"
                  params={{
                    city: property.city.toLowerCase(),
                    locality: property.locality.toLowerCase().replace(/\s+/g, "-"),
                  }}
                  className="hover:text-foreground transition"
                >
                  {property.locality}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="font-medium text-foreground truncate max-w-[200px]">
              {property.title}
            </span>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {/* 2. PROPERTY HEADER */}
        <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                For {property.listing_type}
              </span>
              <span className="rounded-full bg-secondary px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-foreground">
                {property.property_type}
              </span>
              <PropertyBadges property={property} />
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-md">
              REF: UP-HYD-{property.id.slice(0, 6).toUpperCase()}
            </span>
          </div>

          <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-extrabold text-foreground sm:text-3xl lg:text-4xl">
            {property.title}
          </h1>

          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground sm:text-base">
            <MapPin className="h-4 w-4 text-primary flex-none" />
            <span>
              {property.locality ? `${property.locality}, ` : ""}
              {property.address ? `${property.address}, ` : ""}
              {property.city}, Telangana
            </span>
          </p>

          {/* Quick Action Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-border/40 pt-6">
            <button
              onClick={() => {
                toggle(property.id);
                toast.success(saved ? "Removed from saved homes" : "Saved to your favorites");
              }}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition hover:scale-105 ${
                saved
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/50 text-foreground hover:bg-secondary"
              }`}
            >
              <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
              {saved ? "Saved" : "Save"}
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-foreground transition hover:scale-105 hover:bg-secondary"
            >
              {copiedLink ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {copiedLink ? "Copied!" : "Share"}
            </button>

            {property.video_url && (
              <button
                onClick={scrollToVideo}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-4 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition hover:bg-emerald-600/20 hover:scale-105"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Watch Video Tour
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setScheduleOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition hover:brightness-110 hover:scale-105"
              >
                <Calendar className="h-4 w-4" /> Schedule Visit
              </button>
            </div>
          </div>
        </div>

        {/* 3. HERO PHOTO GALLERY */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-border/50 bg-card p-3 shadow-sm">
          <div className="relative overflow-hidden rounded-2xl bg-muted">
            <PropertyImageBranding
              src={property.images[activeImg] ?? property.images[0]}
              alt={property.title}
              watermarkSize="lg"
              watermarkPosition="top-right"
              containerClassName="aspect-[16/9] w-full sm:aspect-[21/9]"
              imageClassName="transition-all duration-300"
            />

            {/* Gallery Control Badges */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
              <span className="rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                📷 {activeImg + 1} of {property.images.length} Photos
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-black/90 transition"
                >
                  <Maximize2 className="h-3.5 w-3.5" /> Expand Lightbox
                </button>
                {property.video_url && (
                  <button
                    onClick={scrollToVideo}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-emerald-600 transition"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" /> Video Tour
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          {property.images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {property.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative h-20 w-32 flex-none overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-background transition ${
                    i === activeImg
                      ? "ring-primary scale-105"
                      : "ring-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <PropertyImageBranding
                    src={src}
                    alt=""
                    watermarkSize="xs"
                    watermarkPosition="bottom-right"
                    containerClassName="h-full w-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. MAIN DETAILS & SIDEBAR CONVERSION GRID */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Main Info Stack */}
          <div className="space-y-8">
            {/* RENTAL TERMS & SPECIFICATIONS */}
            <section className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-foreground">Transparent Rental Terms</h2>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                  icon={<BedDouble className="h-5 w-5 text-primary" />}
                  label="Bedrooms"
                  value={`${property.bedrooms} BHK`}
                />
                <StatCard
                  icon={<Bath className="h-5 w-5 text-primary" />}
                  label="Bathrooms"
                  value={`${property.bathrooms} Baths`}
                />
                <StatCard
                  icon={<Maximize className="h-5 w-5 text-primary" />}
                  label="Super Area"
                  value={`${property.area_sqft} sq.ft`}
                />
                <StatCard
                  icon={<Building className="h-5 w-5 text-primary" />}
                  label="Property Type"
                  value={property.property_type || "Apartment"}
                />
                <StatCard
                  icon={<Clock className="h-5 w-5 text-primary" />}
                  label="Available From"
                  value="Immediate Move-in"
                />
                <StatCard
                  icon={<Shield className="h-5 w-5 text-primary" />}
                  label="Security Deposit"
                  value={
                    estimatedDeposit ? `₹${estimatedDeposit.toLocaleString("en-IN")}` : "2 Months"
                  }
                />
                <StatCard
                  icon={<Car className="h-5 w-5 text-primary" />}
                  label="Parking"
                  value="Covered Space"
                />
                <StatCard
                  icon={<BadgeCheck className="h-5 w-5 text-emerald-600" />}
                  label="Brokerage"
                  value="0% Zero Fee"
                />
              </div>
            </section>

            {/* VIDEO TOUR (When Available) */}
            {property.video_url && (
              <section
                ref={videoSectionRef}
                className="overflow-hidden rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:p-8"
              >
                <div className="flex items-center justify-between pb-4">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Play className="h-5 w-5 text-emerald-500 fill-current" /> High-Definition Video
                    Tour
                  </h2>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-600/10 px-3 py-1 rounded-full">
                    Verified Walkthrough
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Experience a real room-by-room video walkthrough of this home before scheduling an
                  in-person visit.
                </p>
                <div className="overflow-hidden rounded-2xl border border-border">
                  <VideoPlayer src={property.video_url} poster={property.images[0]} />
                </div>
              </section>
            )}

            {/* ROOM BREAKDOWN */}
            <section className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-foreground">Interior Highlights & Layout</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <RoomCard
                  title="Living Area & Family Lounge"
                  desc="Well-ventilated living space with ample natural daylight, premium flooring, and modern lighting fixtures."
                  image={property.images[0]}
                />
                <RoomCard
                  title="Master Bedroom"
                  desc="Spacious bedroom suite with attached bathroom and large windows overlooking the locality."
                  image={property.images[1] ?? property.images[0]}
                />
                {property.images.length > 2 && (
                  <RoomCard
                    title="Secondary Bedroom / Study"
                    desc="Versatile room suitable for kids, guests, or an organized work-from-home setup."
                    image={property.images[2] ?? property.images[0]}
                  />
                )}
                {property.images.length > 3 && (
                  <RoomCard
                    title="Modular Kitchen & Dining"
                    desc="Efficient modular layout with stone countertops, utility connection, and ample storage cabinets."
                    image={property.images[3] ?? property.images[0]}
                  />
                )}
              </div>
            </section>

            {/* AMENITIES & FEATURES */}
            <section className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-foreground">Amenities & Features</h2>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { name: "24/7 Security & CCTV", icon: Shield },
                  { name: "100% Power Backup", icon: Zap },
                  { name: "Covered Parking", icon: Car },
                  { name: "High-Speed Internet Ready", icon: Wifi },
                  { name: "Elevator Access", icon: Building2 },
                  { name: "24/7 Water Supply", icon: CheckCircle2 },
                  { name: "Vastu Compliant", icon: Compass },
                  { name: "Gated Peaceful Community", icon: Sparkles },
                  { name: "Waste Disposal", icon: CheckCircle2 },
                ].map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-2xl border border-border/40 bg-secondary/30 p-3.5 text-xs font-semibold text-foreground"
                    >
                      <IconComp className="h-4 w-4 text-primary flex-none" />
                      <span>{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* VERIFIED LOCATION & NEARBY TRANSIT / HUBS */}
            {(property.locality ||
              property.landmark ||
              property.metro_station ||
              property.it_park ||
              property.college ||
              property.hospital) && (
              <section className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Location & Nearby Hubs
                </h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {property.locality && (
                    <div className="flex items-start gap-3 rounded-2xl border border-border/40 bg-secondary/30 p-4">
                      <Compass className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Locality</p>
                        <p className="text-sm font-bold text-foreground">{property.locality}</p>
                      </div>
                    </div>
                  )}

                  {property.landmark && (
                    <div className="flex items-start gap-3 rounded-2xl border border-border/40 bg-secondary/30 p-4">
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Landmark</p>
                        <p className="text-sm font-bold text-foreground">{property.landmark}</p>
                      </div>
                    </div>
                  )}

                  {property.metro_station && (
                    <div className="flex items-start gap-3 rounded-2xl border border-border/40 bg-secondary/30 p-4">
                      <TrainTrack className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Metro Transit</p>
                        <p className="text-sm font-bold text-foreground">
                          {property.metro_station}
                        </p>
                      </div>
                    </div>
                  )}

                  {property.it_park && (
                    <div className="flex items-start gap-3 rounded-2xl border border-border/40 bg-secondary/30 p-4">
                      <Building2 className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">IT & Business Park</p>
                        <p className="text-sm font-bold text-foreground">{property.it_park}</p>
                      </div>
                    </div>
                  )}

                  {property.hospital && (
                    <div className="flex items-start gap-3 rounded-2xl border border-border/40 bg-secondary/30 p-4">
                      <Hospital className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Healthcare</p>
                        <p className="text-sm font-bold text-foreground">{property.hospital}</p>
                      </div>
                    </div>
                  )}

                  {property.college && (
                    <div className="flex items-start gap-3 rounded-2xl border border-border/40 bg-secondary/30 p-4">
                      <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Education</p>
                        <p className="text-sm font-bold text-foreground">{property.college}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* DESCRIPTION */}
            <section className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-foreground">About This Property</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground text-sm sm:text-base">
                {property.description}
              </p>
            </section>

            {/* FAQ SECTION */}
            <section className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" /> Frequently Asked Questions
              </h2>
              <div className="mt-6 divide-y divide-border/40">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="flex w-full items-center justify-between text-left text-sm font-semibold text-foreground"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          openFaq === idx ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>
                    {openFaq === idx && (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* SIDEBAR CONVERSION PANEL */}
          <aside className="space-y-6 lg:sticky lg:top-32 lg:h-fit">
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-lg sm:p-8">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                {property.listing_type === "rent" ? "Monthly Rent" : "Asking Price"}
              </span>

              <div className="mt-2 flex items-baseline justify-between">
                <p className="font-[family-name:var(--font-display)] text-3xl font-black text-foreground sm:text-4xl">
                  {formatPrice(property.price, property.listing_type)}
                </p>
                {property.listing_type === "rent" && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-600/10 px-2.5 py-1 rounded-full">
                    No Platform Fee
                  </span>
                )}
              </div>

              {property.listing_type === "rent" && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-border/40 pt-4">
                  <div>
                    <span className="text-muted-foreground">Security Deposit</span>
                    <p className="font-bold text-foreground mt-0.5">
                      ₹{(property.price * 2).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Notice Period</span>
                    <p className="font-bold text-foreground mt-0.5">1 Month</p>
                  </div>
                </div>
              )}

              <div className="my-6 h-px bg-border/40" />

              {/* Verified Owner Trust Widget */}
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-600/30 bg-emerald-600/5 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Verified Direct Owner</p>
                  <p className="text-[11px] text-muted-foreground">
                    Connect directly with the landlord. No middlemen or broker fee.
                  </p>
                </div>
              </div>

              {/* Conversion Action Buttons */}
              <div className="mt-6 space-y-3">
                <WhatsAppButton
                  propertyId={property.id}
                  className="w-full h-12 text-sm font-bold shadow-sm"
                />

                <button
                  onClick={() => setScheduleOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-xs font-bold text-primary-foreground transition hover:brightness-110 shadow-md active:scale-95"
                >
                  <Calendar className="h-4 w-4" /> Schedule Visit Walkthrough
                </button>

                {property.video_url && (
                  <button
                    onClick={scrollToVideo}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition hover:bg-emerald-600/20"
                  >
                    <Play className="h-4 w-4 fill-current" /> Watch Video Tour
                  </button>
                )}

                <button
                  onClick={() => setEnquiryOpen((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 px-4 py-3 text-xs font-bold text-foreground transition hover:bg-secondary"
                >
                  <Mail className="h-4 w-4" /> Email Owner Directly
                </button>

                <button
                  onClick={() => setEmiOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-transparent px-4 py-2.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                >
                  <Scale className="h-3.5 w-3.5" /> Rent Budget & Expense Calculator
                </button>

                <button
                  onClick={() => setReportOpen(true)}
                  className="w-full text-center text-[11px] font-medium text-muted-foreground hover:text-rose-500 transition pt-2 block"
                >
                  🚩 Report inaccurate details or broker spam
                </button>
              </div>

              {enquiryOpen && (
                <div className="mt-4 border-t border-border/40 pt-4">
                  <EnquiryForm propertyId={property.id} onSent={() => setEnquiryOpen(false)} />
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* 5. SIMILAR RENTALS RECOMMENDATION SECTION */}
        <SimilarProperties currentProperty={property} />

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
          isOpen={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
        />
      </main>

      {/* 6. MOBILE STICKY BOTTOM CONVERSION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-xl shadow-2xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">Rent</span>
            <p className="text-base font-extrabold text-foreground">
              {formatPrice(property.price, property.listing_type)}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <WhatsAppButton propertyId={property.id} className="h-10 px-3 text-xs font-bold" />
            <button
              onClick={() => setScheduleOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition active:scale-95"
            >
              <Calendar className="h-3.5 w-3.5" /> Schedule Visit
            </button>
          </div>
        </div>
      </div>

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
