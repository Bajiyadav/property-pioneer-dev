import { createFileRoute } from "@tanstack/react-router";
import { HomeLoansView } from "@/modules/loans/components/HomeLoansView";

export const Route = createFileRoute("/home-loans")({
  head: () => ({
    meta: [
      {
        title: "Home Loans | Eligibility, EMI Calculator & Lender Options | Seedha Properties",
      },
      {
        name: "description",
        content:
          "Explore home loans, estimate borrowing limits with our indicative eligibility checker, calculate monthly EMIs, review document checklists, and compare verified Indian bank options on Seedha Properties.",
      },
    ],
  }),
  component: HomeLoansView,
});
