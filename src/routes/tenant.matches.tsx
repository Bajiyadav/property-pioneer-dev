import { createFileRoute } from "@tanstack/react-router";
import { TenantSearch } from "@/modules/tenant/components/TenantSearch";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

interface TenantMatchesSearch {
  city?: string;
  locality?: string;
  budget_min?: number;
  budget_max?: number;
}

export const Route = createFileRoute("/tenant/matches")({
  validateSearch: (search: Record<string, unknown>): TenantMatchesSearch => {
    return {
      city: typeof search.city === "string" ? search.city : undefined,
      locality: typeof search.locality === "string" ? search.locality : undefined,
      budget_min:
        typeof search.budget_min === "number"
          ? search.budget_min
          : typeof search.budget_min === "string"
            ? parseInt(search.budget_min, 10)
            : undefined,
      budget_max:
        typeof search.budget_max === "number"
          ? search.budget_max
          : typeof search.budget_max === "string"
            ? parseInt(search.budget_max, 10)
            : undefined,
    };
  },
  head: () => {
    const canonicalUrl = getCanonicalUrl("/tenant/matches");
    const title = `Your Smart Property Matches — ${APP_NAME}`;
    const description =
      "Browse properties matched to your preferred locality, budget, layout, and office commute with AI compatibility scores.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex, nofollow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: getOgImageUrl() },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: TenantMatchesPage,
});

function TenantMatchesPage() {
  const search = Route.useSearch();
  return (
    <div className="min-h-screen bg-neutral-50/80 dark:bg-background pt-20 pb-16">
      <TenantSearch
        initialProfile={{
          primary_city: search.city,
          primary_locality: search.locality,
          budget_min: search.budget_min,
          budget_max: search.budget_max,
        }}
      />
    </div>
  );
}
