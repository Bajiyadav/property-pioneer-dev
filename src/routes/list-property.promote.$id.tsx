import { createFileRoute } from "@tanstack/react-router";
import { PromoteListing } from "@/modules/owner/components/PromoteListing";
import { APP_NAME } from "@/config/app";

/**
 * Step 9 — the optional visibility offer, reached from the submission screen.
 *
 * `noindex`: a private, per-listing offer page for one owner.
 */
export const Route = createFileRoute("/list-property/promote/$id")({
  head: () => ({
    meta: [
      { title: `Promote your listing — ${APP_NAME}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PromotePage,
});

function PromotePage() {
  const { id } = Route.useParams();
  return (
    <div className="min-h-screen bg-background">
      <PromoteListing propertyId={id} />
    </div>
  );
}
