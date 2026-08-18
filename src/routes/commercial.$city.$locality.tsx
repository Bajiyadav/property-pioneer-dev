import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProperties } from "@/modules/property/services/propertyQueries";
import type { PropertySearchParams } from "@/modules/property/services/propertyQueries";
import { SearchUI } from "@/modules/property/components/SearchUI";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/commercial/$city/$locality")({
  validateSearch: (search: Record<string, unknown>): PropertySearchParams => ({
    q: search.q as string | undefined,
    minPrice: Number(search.minPrice) || undefined,
    maxPrice: Number(search.maxPrice) || undefined,
    beds: Number(search.beds) || undefined,
    baths: Number(search.baths) || undefined,
    type: search.type as string | undefined,
    sort: search.sort as PropertySearchParams["sort"],
  }),
  head: ({ params }) => {
    const city = params.city.charAt(0).toUpperCase() + params.city.slice(1).replace("-", " ");
    const locSplit = params.locality
      .split("-")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    const locality = locSplit;
    const canonicalUrl = getCanonicalUrl(`/commercial/${params.city}/${params.locality}`);
    const title = `Commercial Properties in ${locality}, ${city} | ${APP_NAME}`;
    const description = `Explore commercial properties, office spaces, and retail shops for rent or sale in ${locality}, ${city}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: getOgImageUrl() },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: CommercialLocalityPage,
});

function CommercialLocalityPage() {
  const { city, locality } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/commercial/$city/$locality" });

  const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).replace("-", " ");
  const formattedLocality = locality
    .split("-")
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Ensure city, locality, and listing are injected for the API
  const apiSearch = {
    ...search,
    city: formattedCity,
    locality: formattedLocality,
    type: "commercial",
  };

  const { data: all = [], isLoading } = useQuery({
    queryKey: ["properties", apiSearch],
    queryFn: () => fetchProperties(apiSearch),
    staleTime: 5 * 60 * 1000,
  });

  const onSearchChange = (patch: Partial<PropertySearchParams>) => {
    navigate({
      search: (prev: PropertySearchParams) => ({ ...prev, ...patch }) as PropertySearchParams,
    });
  };

  return (
    <SearchUI
      properties={all}
      isLoading={isLoading}
      search={{ ...search, city: formattedCity, locality: formattedLocality, type: "commercial" }}
      onSearchChange={onSearchChange}
      title={`Commercial Properties in ${formattedLocality}, ${formattedCity}`}
      subtitle={`Verified commercial spaces, shops, and offices in ${formattedLocality}.`}
      baseUrl={`/commercial/${city}/${locality}`}
    />
  );
}
