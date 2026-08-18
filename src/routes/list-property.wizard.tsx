import { createFileRoute } from "@tanstack/react-router";
import { ListingWizard } from "@/modules/owner/components/ListingWizard/ListingWizard";
import { z } from "zod";

const wizardSearchSchema = z.object({
  propertyType: z.enum(["Residential", "Commercial"]).catch("Residential"),
  intent: z.enum(["Rent", "Sell", "PG/Co-living"]).catch("Rent"),
});

export const Route = createFileRoute("/list-property/wizard")({
  validateSearch: (search: Record<string, unknown>) => {
    const rawType = typeof search.propertyType === "string" ? search.propertyType : "";
    const rawIntent = typeof search.intent === "string" ? search.intent : "";
    return {
      propertyType: (rawType === "Commercial" ? "Commercial" : "Residential") as
        "Residential" | "Commercial",
      intent: (rawIntent === "Sell"
        ? "Sell"
        : rawIntent === "PG/Co-living"
          ? "PG/Co-living"
          : "Rent") as "Rent" | "Sell" | "PG/Co-living",
    };
  },
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
