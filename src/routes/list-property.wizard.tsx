import { createFileRoute } from "@tanstack/react-router";
import { ListingWizard } from "@/modules/owner/components/ListingWizard/ListingWizard";
import { z } from "zod";

const wizardSearchSchema = z.object({
  propertyType: z.enum(["Residential", "Commercial"]).optional().catch("Residential"),
  intent: z.enum(["Rent", "Sell", "PG/Co-living"]).optional().catch("Rent"),
  // No `phone` here on purpose. It used to be a search param, which put the
  // owner's mobile number in the URL, in browser history and in request logs,
  // and it arrived JSON-quoted. It now travels in sessionStorage — see
  // LISTING_PHONE_KEY in routes/list-property.tsx.
});

export const Route = createFileRoute("/list-property/wizard")({
  validateSearch: wizardSearchSchema,
  component: ListPropertyWizardPage,
});

function ListPropertyWizardPage() {
  const search = Route.useSearch();
  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      <ListingWizard initialData={search} />
    </div>
  );
}
