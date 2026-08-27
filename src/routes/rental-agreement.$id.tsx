/**
 * Seedha Properties — View Individual Rental Agreement Route
 */

import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, AlertCircle } from "lucide-react";
import { fetchRentalAgreementById } from "@/modules/rental-agreements/services/agreementService";
import { AgreementDocumentPreview } from "@/modules/rental-agreements/components/AgreementDocumentPreview";
import { APP_NAME, getCanonicalUrl } from "@/config/app";

export const Route = createFileRoute("/rental-agreement/$id")({
  head: () => {
    return {
      meta: [
        { title: `Rental Agreement Deed — ${APP_NAME}` },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  component: ViewAgreementPage,
});

function ViewAgreementPage() {
  const { id } = useParams({ from: "/rental-agreement/$id" });

  const {
    data: agreement,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["rental-agreement", id],
    queryFn: () => fetchRentalAgreementById(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Agreement Not Found</h1>
        <p className="text-xs text-muted-foreground">
          The requested rental agreement does not exist or you do not have permission to view it.
        </p>
        <Link
          to="/my-agreements"
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition hover:brightness-105"
        >
          Return to My Agreements
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb (Hidden on Print) */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            to="/my-agreements"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to My Agreements</span>
          </Link>
        </div>

        {/* Agreement Document Sheet */}
        <AgreementDocumentPreview
          data={{
            agreementType: agreement.agreement_type,
            tenantType: agreement.tenant_type,
            ownerDetails: agreement.owner_details,
            tenants: agreement.tenants,
            propertyDetails: agreement.property_details,
            rentalTerms: agreement.rental_terms,
            clauses: agreement.clauses,
            customTerms: agreement.custom_terms || [],
          }}
          agreementNumber={agreement.agreement_number}
          status={agreement.status}
        />
      </div>
    </div>
  );
}
