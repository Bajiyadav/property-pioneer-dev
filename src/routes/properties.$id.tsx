import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
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
  GraduationCap,
  Hospital,
  Building,
  Check,
  Copy,
  X,
  Scale,
  Sparkle,
  Clock,
  Shield,
  TrainTrack,
} from "lucide-react";
import { fetchProperty, formatPrice } from "@/lib/properties";
import { useFavorites } from "@/lib/useFavorites";
import { submitEnquiry } from "@/lib/enquiries";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { PropertyBadges } from "@/components/PropertyBadges/PropertyBadges";
import { PropertyStatus } from "@/components/PropertyStatus/PropertyStatus";
import { WhatsAppButton } from "@/components/WhatsAppButton/WhatsAppButton";
import { ScheduleVisitModal } from "@/components/modals/ScheduleVisitModal";
import { RentalAgreementModal } from "@/components/modals/RentalAgreementModal";

import { APP_NAME, APP_URL, APP_LOGO, getCanonicalUrl } from "@/config/app";

const propertyQueryOptions = (id: string) =>
  queryOptions({ queryKey: ["property", id], queryFn: () => fetchProperty(id) });

export const Route = createFileRoute("/properties/$id")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(propertyQueryOptions(params.id)).catch(() => null),
  head: ({ params, loaderData }) => {
    const url = getCanonicalUrl(`/properties/${params.id}`);
    if (!loaderData) {
      return {
        meta: [
          { title: `Listing unavailable — ${APP_NAME}` },
          { name: "description", content: `This listing is no longer available on ${APP_NAME}.` },
          { property: "og:title", content: `Listing unavailable — ${APP_NAME}` },
          { property: "og:description", content: `This listing is no longer available on ${APP_NAME}.` },
          { property: "og:site_name", content: APP_NAME },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.title} — ${APP_NAME}`;
    const description = `${loaderData.bedrooms} BHK in ${loaderData.city} on ${APP_NAME}. View photos, details, and enquire.`;
    const image = loaderData.images?.[0];
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:site_name", content: APP_NAME },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image && image.startsWith("https://")
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: PropertyDetail,
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">We couldn't load this listing on Urban Properties.</p>
      <Link to="/properties" search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }} className="mt-6 inline-block text-sm font-medium text-primary underline">
        Back to browse
      </Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Listing not found</h1>
      <p className="mt-2 text-muted-foreground">This home is no longer listed on Urban Properties.</p>
      <Link to="/properties" search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }} className="mt-6 inline-block text-sm font-medium text-primary underline">
        Back to browse
      </Link>
    </div>
  ),
});

function PropertyDetail() {
  const { id } = Route.useParams();
  const { has, toggle } = useFavorites();
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchProperty(id),
  });

  const handleShare = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("Property link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }, []);

  const handleCompare = useCallback(() => {
    setComparing(true);
    toast.success("Added to Property Comparison slot!");
    setTimeout(() => setComparing(false), 1500);
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <PropertyStructuredData property={property} />

      {/* 1. PRESTIGE STICKY BACK NAVIGATION & BREADCRUMBS BAR */}
      <nav aria-label="Breadcrumbs and navigation" className="sticky top-16 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/properties"
            search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
            className="group inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-card/80 px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:scale-[1.02] hover:border-primary hover:bg-card hover:shadow-md"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:-translate-x-0.5">
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
            <span>Back to Properties</span>
          </Link>

          {/* Breadcrumbs */}
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
            <Link to="/" className="hover:text-foreground transition">Home</Link>
            <span>/</span>
            <span className="capitalize">{property.listing_type}</span>
            <span>/</span>
            <span>{property.city}</span>
            <span>/</span>
            <span className="font-medium text-foreground truncate max-w-[200px]">{property.title}</span>
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
              <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified Owner
              </span>
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5" /> 0% Brokerage
              </span>
              <span className="rounded-full bg-purple-600/10 px-3 py-1 text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> Verified Property
              </span>
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-md">
              REF: UP-HYD-{property.id.slice(0, 6).toUpperCase()}
            </span>
          </div>

          <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-extrabold text-foreground sm:text-4xl lg:text-5xl">
            {property.title}
          </h1>
          
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground sm:text-base">
            <MapPin className="h-4 w-4 text-primary" /> {property.address}, {property.city}, Telangana
          </p>

          {/* 3. QUICK ACTION BAR */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-border/40 pt-6">
            <button
              onClick={() => {
                toggle(property.id);
                toast.success(saved ? "Removed from saved" : "Saved to your favorites");
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
              {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
              {copiedLink ? "Copied!" : "Share"}
            </button>

            <button
              onClick={handleCompare}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs font-semibold text-foreground transition hover:scale-105 hover:bg-secondary"
            >
              <Scale className="h-4 w-4" />
              {comparing ? "Comparing…" : "Compare"}
            </button>

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

        {/* 4. GALLERY */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-border/50 bg-card p-3 shadow-sm">
          <div className="relative overflow-hidden rounded-2xl bg-muted">
            <img
              src={property.images[activeImg] ?? property.images[0]}
              alt={property.title}
              className="aspect-[16/9] w-full object-cover transition-all duration-300 sm:aspect-[21/9]"
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
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  <Play className="h-3.5 w-3.5" /> Video Tour Ready
                </span>
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
                  className={`h-20 w-32 flex-none overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-background transition ${
                    i === activeImg ? "ring-primary scale-105" : "ring-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. PROPERTY INFORMATION & SIDEBAR GRID */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Main Info Columns */}
          <div className="space-y-8">
            {/* OVERVIEW CARD */}
            <section className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-foreground">Property Overview</h2>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard icon={<BedDouble className="h-5 w-5 text-primary" />} label="Bedrooms" value={`${property.bedrooms} BHK`} />
                <StatCard icon={<Bath className="h-5 w-5 text-primary" />} label="Bathrooms" value={`${property.bathrooms} Baths`} />
                <StatCard icon={<Maximize className="h-5 w-5 text-primary" />} label="Super Area" value={`${property.area_sqft} sq.ft`} />
                <StatCard icon={<Building className="h-5 w-5 text-primary" />} label="Furnishing" value="Semi-Furnished" />
              </div>
            </section>

            {/* AMENITIES */}
            <section className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-foreground">Premium Amenities</h2>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { name: "24/7 Security & CCTV", icon: Shield },
                  { name: "High-Speed Wi-Fi Ready", icon: Wifi },
                  { name: "100% Power Backup", icon: Zap },
                  { name: "Covered Car Parking", icon: Car },
                  { name: "Elevator Access", icon: Building2 },
                  { name: "Gated Community", icon: CheckCircle2 },
                ].map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 rounded-2xl border border-border/40 bg-secondary/30 p-3.5 text-xs font-semibold text-foreground">
                      <IconComp className="h-4 w-4 text-primary" />
                      <span>{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* HYDERABAD NEIGHBORHOOD ACCESS */}
            <section className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Transit & Connectivity</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Key landmarks around {property.city}</p>
                </div>
                <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ★ 9.4/10 Liveability Score
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ConnectivityItem icon={<TrainTrack className="h-4 w-4 text-blue-500" />} title="Raidurg Metro Station" dist="1.2 km (5 mins)" />
                <ConnectivityItem icon={<Building className="h-4 w-4 text-purple-500" />} title="Mindspace IT Park" dist="0.8 km (3 mins)" />
                <ConnectivityItem icon={<Hospital className="h-4 w-4 text-rose-500" />} title="AIG Hospitals" dist="1.5 km (6 mins)" />
                <ConnectivityItem icon={<GraduationCap className="h-4 w-4 text-amber-500" />} title="Oakridge International" dist="1.8 km (7 mins)" />
              </div>
            </section>

            {/* DESCRIPTION */}
            <section className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-foreground">About This Property</h2>
              <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
                {property.description}
              </p>
            </section>
          </div>

          {/* Sidebar Financial & Contact Panel */}
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
                    Zero Brokerage
                  </span>
                )}
              </div>

              {property.listing_type === "rent" && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-border/40 pt-4">
                  <div>
                    <span className="text-muted-foreground">Security Deposit</span>
                    <p className="font-bold text-foreground mt-0.5">₹{(property.price * 2).toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Notice Period</span>
                    <p className="font-bold text-foreground mt-0.5">1 Month</p>
                  </div>
                </div>
              )}

              <div className="my-6 h-px bg-border/40" />

              {/* Owner Trust Widget */}
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-600/30 bg-emerald-600/5 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Direct Owner Property</p>
                  <p className="text-[11px] text-muted-foreground">Verified ID • 100% Zero Brokerage</p>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="mt-6 space-y-3">
                <WhatsAppButton propertyId={property.id} className="w-full h-12 text-sm font-bold shadow-sm" />
                
                <button
                  onClick={() => setScheduleOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-xs font-bold text-primary-foreground transition hover:brightness-110 shadow-md"
                >
                  <Calendar className="h-4 w-4" /> Schedule Visit Walkthrough
                </button>

                <button
                  onClick={() => setAgreementOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-emerald-600/40 bg-emerald-600/10 px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition hover:bg-emerald-600/20"
                >
                  <FileText className="h-4 w-4" /> Generate Digital Agreement
                </button>

                <button
                  onClick={() => setEnquiryOpen((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 px-4 py-3 text-xs font-bold text-foreground transition hover:bg-secondary"
                >
                  <Mail className="h-4 w-4" /> Email Owner Directly
                </button>
              </div>

              {enquiryOpen && (
                <EnquiryForm
                  propertyId={property.id}
                  onSent={() => setEnquiryOpen(false)}
                />
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* LIGHTBOX MODAL */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          
          <img
            src={property.images[activeImg]}
            alt=""
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />

          {property.images.length > 1 && (
            <>
              <button
                onClick={() => setActiveImg((prev) => (prev > 0 ? prev - 1 : property.images.length - 1))}
                className="absolute left-6 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => setActiveImg((prev) => (prev < property.images.length - 1 ? prev + 1 : 0))}
                className="absolute right-6 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}

      {/* MODALS */}
      <ScheduleVisitModal
        propertyTitle={property.title}
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />
      <RentalAgreementModal
        isOpen={agreementOpen}
        onClose={() => setAgreementOpen(false)}
      />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-secondary/30 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}</div>
      <p className="mt-2 text-xs text-muted-foreground font-medium">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function ConnectivityItem({ icon, title, dist }: { icon: React.ReactNode; title: string; dist: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-secondary/30 p-3.5">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-xs font-semibold text-foreground">{title}</span>
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">{dist}</span>
    </div>
  );
}

function EnquiryForm({ propertyId, onSent }: { propertyId: string; onSent: () => void }) {
  const mountedAt = useRef<number>(Date.now());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [token, setToken] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, [propertyId]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (sending) return;
        setSending(true);
        const result = await submitEnquiry({
          propertyId,
          name,
          phone,
          message,
          company,
          elapsedMs: Math.min(Date.now() - mountedAt.current, 1000 * 60 * 60 * 6),
          turnstileToken: token,
        });
        setSending(false);
        if (result.ok) {
          toast.success("Enquiry sent — the owner will get back to you.");
          onSent();
        } else {
          toast.error(result.error);
        }
      }}
      className="mt-4 grid gap-2"
    >
      {/* Honeypot — hidden from humans, tempting to bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <input required value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Your name" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="Phone" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <textarea required rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} placeholder="I'm interested in this home…" className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <TurnstileWidget onToken={setToken} className="[&>*]:max-w-full" />
      <button type="submit" disabled={sending} className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:brightness-110 disabled:opacity-60">
        {sending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}

function PropertyStructuredData({
  property,
}: {
  property: {
    id: string;
    title: string;
    description: string;
    price: number;
    city: string;
    address: string;
    bedrooms: number;
    bathrooms: number;
    area_sqft: number;
    images: string[];
  };
}) {
  const propertyUrl = getCanonicalUrl(`/properties/${property.id}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: property.title,
    description: property.description,
    image: property.images,
    url: propertyUrl,
    numberOfBedrooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize: { "@type": "QuantitativeValue", value: property.area_sqft, unitCode: "FTK" },
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city,
      addressCountry: "IN",
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "INR",
      url: propertyUrl,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: APP_NAME,
        url: APP_URL,
        logo: APP_LOGO,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}