import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchProperties } from "@/modules/property/services/propertyQueries";
import type { PropertySearchParams } from "@/modules/property/services/propertyQueries";
import { SearchUI } from "@/modules/property/components/SearchUI";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/buy/$city/")({
  validateSearch: (search: Record<string, unknown>): PropertySearchParams => ({
    q: search.q as string | undefined,
    locality: search.locality as string | undefined,
    minPrice: Number(search.minPrice) || undefined,
    maxPrice: Number(search.maxPrice) || undefined,
    beds: Number(search.beds) || undefined,
    baths: Number(search.baths) || undefined,
    type: search.type as string | undefined,
    sort: search.sort as PropertySearchParams["sort"],
  }),
  head: ({ params }) => {
    const city = params.city.charAt(0).toUpperCase() + params.city.slice(1).replace("-", " ");
    const canonicalUrl = getCanonicalUrl(`/buy/${params.city}`);
    const title = `Properties & Flats for Sale in ${city} | ${APP_NAME}`;
    const description = `Find the best residential properties, flats, and houses for sale in ${city}.`;
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
  component: BuyCityPage,
});

function BuyCityPage() {
  const { city } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/buy/$city/" });

  const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).replace("-", " ");

  // Ensure city and listing are injected for the API
  const apiSearch = {
    ...search,
    city: formattedCity,
    listing: "sale",
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
      search={{ ...search, city: formattedCity, listing: "sale" }}
      onSearchChange={onSearchChange}
      title={`Properties for Sale in ${formattedCity}`}
      subtitle={`Explore active verified homes and apartments for sale in ${formattedCity}.`}
      baseUrl={`/buy/${city}`}
    />
  );
}
