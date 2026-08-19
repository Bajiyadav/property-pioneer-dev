import { createFileRoute } from "@tanstack/react-router";
import { ListingWizard } from "@/modules/owner/components/ListingWizard/ListingWizard";
import { z } from "zod";

const wizardSearchSchema = z.object({
  propertyType: z.enum(["Residential", "Commercial"]).catch("Residential"),
  intent: z.enum(["Rent", "Sell", "PG/Co-living"]).catch("Rent"),
});

export interface WizardSearch {
  propertyType: "Residential" | "Commercial";
  intent: "Rent" | "Sell" | "PG/Co-living";
  city?: string;
  locality?: string;
  prefilled?: boolean;
  step?: number;
}

export const Route = createFileRoute("/list-property/wizard")({
  validateSearch: (search: Record<string, unknown>): WizardSearch => {
    const rawType = typeof search.propertyType === "string" ? search.propertyType : "";
    const rawIntent = typeof search.intent === "string" ? search.intent : "";
    const rawCity = typeof search.city === "string" ? search.city : undefined;
    const rawLocality = typeof search.locality === "string" ? search.locality : undefined;
    const rawPrefilled =
      search.prefilled === true || search.prefilled === "true" ? true : undefined;
    const rawStep =
      typeof search.step === "number"
        ? search.step
        : typeof search.step === "string"
          ? parseInt(search.step, 10)
          : undefined;

    return {
      propertyType: (rawType === "Commercial" ? "Commercial" : "Residential") as
        "Residential" | "Commercial",
      intent: (rawIntent === "Sell"
        ? "Sell"
        : rawIntent === "PG/Co-living"
          ? "PG/Co-living"
          : "Rent") as "Rent" | "Sell" | "PG/Co-living",
      ...(rawCity ? { city: rawCity } : {}),
      ...(rawLocality ? { locality: rawLocality } : {}),
      ...(rawPrefilled !== undefined ? { prefilled: rawPrefilled } : {}),
      ...(rawStep !== undefined ? { step: rawStep } : {}),
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
