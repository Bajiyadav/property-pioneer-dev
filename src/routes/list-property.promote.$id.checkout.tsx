import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PromotionCheckout } from "@/modules/owner/components/PromotionCheckout";
import { APP_NAME } from "@/config/app";

/**
 * Promotion checkout for one listing.
 *
 * `noindex`: a private, per-listing purchase screen for one owner. It has no
 * business in search results.
 *
 * The plan id arrives in the URL and is therefore untrusted — it is validated
 * to a bounded string here and re-resolved against VISIBILITY_PLANS on the
 * server before any amount is computed. The URL never carries a price.
 */
const searchSchema = z.object({
  plan: z.string().trim().min(1).max(60).catch(""),
});

export const Route = createFileRoute("/list-property/promote/$id/checkout")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: `Promote your property — ${APP_NAME}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PromotionCheckoutPage,
});

function PromotionCheckoutPage() {
  const { id } = Route.useParams();
  const { plan } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background">
      <PromotionCheckout propertyId={id} planId={plan} />
    </div>
  );
}
