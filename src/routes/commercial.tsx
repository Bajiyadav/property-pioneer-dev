import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Commercial spaces — a saved view of the real property search.
 *
 * This URL used to render a standalone marketing page that listed no
 * properties and asserted title-deed audits, RERA validation and a guaranteed
 * zero-brokerage model, none of which the platform performs. The URL is kept
 * working because it is public and linked, but it now resolves to the actual
 * filtered catalogue, so what a visitor sees is whatever inventory genuinely
 * exists — including none.
 */
export const Route = createFileRoute("/commercial")({
  beforeLoad: () => {
    throw redirect({
      to: "/properties",
      search: { ...{ q: "commercial", listing: "" }, city: "", minPrice: 0, maxPrice: 0, beds: 0 },
    });
  },
});
