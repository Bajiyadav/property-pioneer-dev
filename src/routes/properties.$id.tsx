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
import { TurnstileWidget } from "@/shared/components/TurnstileWidget";
import { PropertyBadges } from "@/modules/property/components/PropertyBadges";
import { PropertyStatus } from "@/modules/property/components/PropertyStatus";
import { WhatsAppButton } from "@/modules/property/components/WhatsAppButton";
import { ScheduleVisitModal } from "@/shared/components/dialogs/ScheduleVisitModal";
import { EmiCalculatorModal } from "@/shared/components/dialogs/EmiCalculatorModal";
import { ReportListingModal } from "@/shared/components/dialogs/ReportListingModal";
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
          {
            property: "og:description",
            content: `This listing is no longer available on ${APP_NAME}.`,
          },
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
  component: PropertyDetailPage,
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">
        We couldn't load this listing on Urban Properties.
      </p>
      <Link
        to="/properties"
        search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
        className="mt-6 inline-block text-sm font-medium text-primary underline"
      >
        Back to browse
      </Link>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Listing not found</h1>
      <p className="mt-2 text-muted-foreground">
        This home is no longer listed on Urban Properties.
      </p>
      <Link
        to="/properties"
        search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
        className="mt-6 inline-block text-sm font-medium text-primary underline"
      >
        Back to browse
      </Link>
    </div>
  ),
});
