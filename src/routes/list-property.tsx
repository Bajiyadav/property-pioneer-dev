import { createFileRoute } from "@tanstack/react-router";
import { ListingWizard } from "@/modules/owner/components/ListingWizard/ListingWizard";

export const Route = createFileRoute("/list-property")({
  component: ListPropertyPage,
});

function ListPropertyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      <ListingWizard />
    </div>
  );
}
