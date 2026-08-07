import { APP_NAME, APP_URL, APP_LOGO, getCanonicalUrl } from "@/config/app";

export function PropertyStructuredData({
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
