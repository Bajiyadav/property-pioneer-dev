import { createFileRoute } from "@tanstack/react-router";
import { HomeLoansView } from "@/modules/loans/components/HomeLoansView";

export const Route = createFileRoute("/home-loans")({
  head: () => ({
    meta: [
      {
        title: "Home Loans & EMI Calculator | Compare Bank Rates | Seedha Properties",
      },
      {
        name: "description",
        content:
          "Calculate monthly home loan EMIs, check loan eligibility, and compare benchmark interest rates from SBI, HDFC, ICICI, and Axis Bank with zero processing hassles on Seedha Properties.",
      },
    ],
  }),
  component: HomeLoansView,
});
