import { createFileRoute, Link } from "@tanstack/react-router";
import { PropertyDetailPage } from "@/modules/property/pages/PropertyDetailPage";
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
import {
  fetchProperty,
  formatPrice,
  type Property,
} from "@/modules/property/services/propertyQueries";
import { useFavorites } from "@/modules/property/hooks/useFavorites";
import { submitEnquiry } from "@/modules/enquiry/services/enquiryService";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { PropertyBadges } from "@/modules/property/components/PropertyBadges";
import { PropertyStatus } from "@/modules/property/components/PropertyStatus";
import { WhatsAppButton } from "@/modules/property/components/WhatsAppButton";
import { ScheduleVisitModal } from "@/components/dialogs/ScheduleVisitModal";
import { EmiCalculatorModal } from "@/components/dialogs/EmiCalculatorModal";
import { ReportListingModal } from "@/components/dialogs/ReportListingModal";
import { StateView } from "@/components/feedback/StateView";
import {
  APP_NAME,
  APP_URL,
  APP_LOGO,
  getCanonicalUrl,
  extractIdFromSlug,
  generatePropertySlug,
} from "@/config/app";

const propertyQueryOptions = (slugOrId: string) => {
  const id = extractIdFromSlug(slugOrId);
  return queryOptions({ queryKey: ["property", id], queryFn: () => fetchProperty(id) });
};

export const Route = createFileRoute("/properties/$id")({
  loader: ({ params, context }) => {
    const id = extractIdFromSlug(params.id);
    return context.queryClient.ensureQueryData(propertyQueryOptions(id)).catch(() => null);
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: `Listing unavailable — ${APP_NAME}` },
          { name: "description", content: `This listing is no longer available on ${APP_NAME}.` },
          { property: "og:title", content: `Listing unavailable — ${APP_NAME}` },
          {
            property: "og:description",
            content: `This listing is no longer available on ${APP_NAME}.`,
          },
          { property: "og:site_name", content: APP_NAME },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const canonicalSlug = generatePropertySlug(loaderData);
    const url = getCanonicalUrl(`/properties/${canonicalSlug}`);

    // Formatting the title: ₹45 L | 2 BHK Apartment in Kondapur — SEEDHA
    const formattedPrice = loaderData.price
      ? formatPrice(loaderData.price, loaderData.listing_type || "sale")
      : "";
    const propType = loaderData.property_type
      ? loaderData.property_type.replace("_", " ")
      : "Property";
    const beds = loaderData.bedrooms ? `${loaderData.bedrooms} BHK ` : "";
    const loc = loaderData.locality
      ? `${loaderData.locality}, ${loaderData.city}`
      : loaderData.city;
    const title = `${formattedPrice ? formattedPrice + " | " : ""}${beds}${propType} in ${loc} — ${APP_NAME}`;

    // Formatting the description: Check out this beautiful 2 BHK Apartment for sale in Kondapur, Hyderabad for ₹45 L. View photos, details, and contact the owner directly on SEEDHA.
    const forWhat = loaderData.listing_type === "rent" ? "rent" : "sale";
    const description = `Check out this beautiful ${beds}${propType} for ${forWhat} in ${loc}${formattedPrice ? " for " + formattedPrice : ""}. View photos, details, and contact the owner directly on ${APP_NAME}.`;

    const image = loaderData.images?.[0];
    const isPublic = loaderData.is_approved === true || loaderData.status === "available";
    const robots = isPublic ? "index, follow" : "noindex, nofollow";
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
        { name: "robots", content: robots },
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
  component: PropertyDetailPage,
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <StateView
        type="server_error"
        title="We couldn't load this property"
        description="Please check your connection and try again."
        action={{
          label: "Retry",
          onClick: () => {
            if (typeof window !== "undefined") window.location.reload();
          },
          variant: "primary",
        }}
        secondaryAction={{
          label: "Browse Verified Homes",
          href: "/properties?q=&city=All+India&listing=rent&minPrice=0&maxPrice=0&beds=0",
          variant: "outline",
        }}
      />
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <StateView
        type="empty"
        title="This property is no longer available"
        description="It may have been rented, sold, or unlisted by the owner."
        action={{
          label: "Browse Verified Homes",
          href: "/properties?q=&city=All+India&listing=rent&minPrice=0&maxPrice=0&beds=0",
          variant: "primary",
        }}
      />
    </div>
  ),
});
