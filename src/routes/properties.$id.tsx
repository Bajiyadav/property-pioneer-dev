import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, BedDouble, Bath, Maximize, MapPin, Heart, Mail, User,
} from "lucide-react";
import { fetchProperty, formatPrice } from "@/lib/properties";
import { useFavorites } from "@/lib/useFavorites";
import { submitEnquiry } from "@/lib/enquiries";
import { TurnstileWidget } from "@/components/TurnstileWidget";

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
      <p className="mt-2 text-muted-foreground">We couldn't load this listing on Urban Rental Flats.</p>
      <Link to="/properties" search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }} className="mt-6 inline-block text-sm font-medium text-primary underline">
        Back to browse
      </Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Listing not found</h1>
      <p className="mt-2 text-muted-foreground">This home is no longer listed on Urban Rental Flats.</p>
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
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchProperty(id),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="h-[420px] animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }
  if (isError || !property) throw notFound();

  const saved = has(property.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <PropertyStructuredData property={property} />
      <Link
        to="/properties"
        search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to browse
      </Link>

      {/* Gallery */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl bg-muted sm:col-span-4">
          <img
            src={property.images[activeImg] ?? property.images[0]}
            alt={property.title}
            className="aspect-[16/10] w-full object-cover"
          />
          <button
            onClick={() => {
              toggle(property.id);
              toast.success(saved ? "Removed from saved" : "Saved");
            }}
            className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-sm font-semibold text-foreground shadow backdrop-blur hover:bg-background"
          >
            <Heart className="h-4 w-4" fill={saved ? "currentColor" : "none"} style={saved ? { color: "var(--primary)" } : undefined} />
            {saved ? "Saved" : "Save"}
          </button>
        </div>
        {property.images.length > 1 && (
          <div className="col-span-4 flex gap-3 overflow-x-auto pb-1">
            {property.images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`h-20 w-28 flex-none overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-background transition ${i === activeImg ? "ring-primary" : "ring-transparent"}`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
              For {property.listing_type}
            </span>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
              {property.property_type}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">{property.title}</h1>
          <p className="mt-2 flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" /> {property.address}, {property.city}
          </p>

          <div className="mt-6 flex flex-wrap gap-6 rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
            <Stat icon={<BedDouble className="h-5 w-5" />} label="Bedrooms" value={property.bedrooms} />
            <Stat icon={<Bath className="h-5 w-5" />} label="Bathrooms" value={property.bathrooms} />
            <Stat icon={<Maximize className="h-5 w-5" />} label="Area" value={`${property.area_sqft} ft²`} />
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-foreground">About this home</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
              {property.description}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <p className="text-sm text-muted-foreground">
              {property.listing_type === "rent" ? "Monthly rent" : "Asking price"}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-foreground">
              {formatPrice(property.price, property.listing_type)}
            </p>

            <div className="my-5 h-px bg-border" />

            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-secondary">
                <User className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Listed by owner</p>
                <p className="text-xs text-muted-foreground">Contact via enquiry</p>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              <button
                onClick={() => setEnquiryOpen((v) => !v)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                <Mail className="h-4 w-4" /> Send enquiry
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