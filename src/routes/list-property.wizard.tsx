import { createFileRoute } from "@tanstack/react-router";
import { ListingWizard } from "@/modules/owner/components/ListingWizard/ListingWizard";
import { z } from "zod";

const wizardSearchSchema = z.object({
  propertyType: z.enum(["Residential", "Commercial"]).optional().catch("Residential"),
  intent: z.enum(["Rent", "Sell", "PG/Co-living"]).optional().catch("Rent"),
  phone: z.string().optional(),
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
