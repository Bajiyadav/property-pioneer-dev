import { APP_NAME, APP_URL, APP_LOGO, getCanonicalUrl, generatePropertySlug } from "@/config/app";

export interface PropertyStructuredDataProps {
  property: {
    id: string;
    title: string;
    description: string;
    price: number;
    city: string;
    bedrooms: number;
    bathrooms: number;
    area_sqft: number;
    images: string[];
    property_type?: string | null;
    listing_type?: string | null;
    locality?: string | null;
    video_url?: string | null;
    created_at?: string;
  };
}

export function PropertyStructuredData({ property }: PropertyStructuredDataProps) {
  const canonicalSlug = generatePropertySlug(property);
  const propertyUrl = getCanonicalUrl(`/properties/${canonicalSlug}`);

  const isCommercial = property.property_type?.toLowerCase() === "commercial";
  const schemaType = isCommercial
    ? "CommercialProperty"
    : property.property_type?.toLowerCase() === "apartment"
      ? "Apartment"
      : "House";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    url: propertyUrl,
    about: {
      "@type": schemaType,
      name: property.title,
      image: property.images,
      address: {
        "@type": "PostalAddress",
        // Coarse only — the exact streetAddress is sensitive and intentionally
        // omitted from public structured data (it is gated behind a matching
        // location via /api/public/properties/$id/location).
        addressLocality: property.locality || property.city,
        addressRegion: property.city,
        addressCountry: "IN",
      },
      numberOfBedrooms: property.bedrooms || undefined,
      numberOfBathroomsTotal: property.bathrooms || undefined,
      floorSize: property.area_sqft
        ? { "@type": "QuantitativeValue", value: property.area_sqft, unitCode: "FTK" }
        : undefined,
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
    ...(property.video_url
      ? {
          video: {
            "@type": "VideoObject",
            name: `${property.title} Video Tour`,
            description: `Walkthrough video tour of ${property.title}`,
            thumbnailUrl: property.images?.[0] || `${APP_URL}/hero.jpg`,
            uploadDate: property.created_at || "2026-08-01T09:00:00.000Z",
            contentUrl: property.video_url,
          },
        }
      : {}),
  };

  const breadcrumbListJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: APP_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isCommercial
          ? `Commercial in ${property.city}`
          : `${property.listing_type === "sale" ? "Buy" : "Rent"} in ${property.city}`,
        item: getCanonicalUrl(
          isCommercial
            ? `/commercial/${property.city.toLowerCase()}`
            : `/${property.listing_type === "sale" ? "buy" : "rent"}/${property.city.toLowerCase()}`,
        ),
      },
      ...(property.locality
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: property.locality,
              item: getCanonicalUrl(
                isCommercial
                  ? `/commercial/${property.city.toLowerCase()}/${property.locality.toLowerCase().replace(/\s+/g, "-")}`
                  : `/${property.listing_type === "sale" ? "buy" : "rent"}/${property.city.toLowerCase()}/${property.locality.toLowerCase().replace(/\s+/g, "-")}`,
              ),
            },
            {
              "@type": "ListItem",
              position: 4,
              name: property.title,
              item: propertyUrl,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 3,
              name: property.title,
              item: propertyUrl,
            },
          ]),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListJsonLd) }}
      />
    </>
  );
}
