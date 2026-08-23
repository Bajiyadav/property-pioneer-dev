import { createFileRoute } from "@tanstack/react-router";
import { SubmissionStatus } from "@/modules/owner/components/SubmissionStatus";
import { APP_NAME } from "@/config/app";

/**
 * Step 8 of the owner workflow — the screen the wizard lands on after submit.
 *
 * `noindex`: this is a private, per-listing status page for one owner. It has no
 * business in search results, and the listing itself is not public until an
 * admin approves it.
 */
export const Route = createFileRoute("/list-property/submitted/$id")({
  head: () => ({
    meta: [
      { title: `Listing submitted — ${APP_NAME}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SubmittedPage,
});

function SubmittedPage() {
  const { id } = Route.useParams();
  return (
    <div className="min-h-screen bg-background">
      <SubmissionStatus propertyId={id} />
    </div>
  );
}
