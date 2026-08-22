import { createFileRoute } from "@tanstack/react-router";
import { HomeLoansPage } from "./home-loans";

export const Route = createFileRoute("/loans")({
  head: () => ({
    meta: [
      {
        title: "Home Loans & EMI Calculator | Seedha Properties",
      },
      {
        name: "description",
        content:
          "Calculate monthly home loan EMIs and check eligibility across leading Indian banks with zero brokerage.",
      },
    ],
  }),
  component: HomeLoansPage,
});
