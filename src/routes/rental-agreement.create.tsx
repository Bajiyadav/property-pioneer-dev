/**
 * Seedha Properties — Create Rental Agreement Wizard Route
 */

import { createFileRoute } from "@tanstack/react-router";
import { AgreementWizard } from "@/modules/rental-agreements/components/wizard/AgreementWizard";
import { APP_NAME, getCanonicalUrl } from "@/config/app";

export const Route = createFileRoute("/rental-agreement/create")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/rental-agreement/create");
    return {
      meta: [
        { title: `Create Rental Agreement — ${APP_NAME}` },
        {
          name: "description",
          content:
            "Draft a legally valid, customized rental agreement online in 10 minutes with instant draft autosave.",
        },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: CreateRentalAgreementPage,
});

function CreateRentalAgreementPage() {
  return <AgreementWizard />;
}
