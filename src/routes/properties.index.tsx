import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchProperties } from "@/modules/property/services/propertyQueries";
import type { PropertySearchParams } from "@/modules/property/services/propertyQueries";
import { recordRecentSearch } from "@/modules/dashboard/services/dashboardData";
import { SearchUI } from "@/modules/property/components/SearchUI";

import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/properties/")({
  validateSearch: (search: Record<string, unknown>): PropertySearchParams => ({
    q: search.q as string | undefined,
    city: search.city as string | undefined,
    locality: search.locality as string | undefined,
    listing: search.listing as string | undefined,
    minPrice: Number(search.minPrice) || undefined,
    maxPrice: Number(search.maxPrice) || undefined,
    beds: Number(search.beds) || undefined,
    baths: Number(search.baths) || undefined,
    type: search.type as string | undefined,
    sort: search.sort as PropertySearchParams["sort"],
    page: Number(search.page) || undefined,
    limit: Number(search.limit) || undefined,
  }),
  head: () => {
    const canonicalUrl = getCanonicalUrl("/properties");
    const ogImage = getOgImageUrl();
    const title = `Browse homes — ${APP_NAME}`;
    const description = "Search rentals and homes for sale by city, price, and bedrooms.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: APP_NAME },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
        { name: "robots", content: "index, follow" },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: PropertiesPage,
});

function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/properties" });

  const { data: all = [], isLoading } = useQuery({
    queryKey: ["properties", search],
    queryFn: () => fetchProperties(search),
    staleTime: 5 * 60 * 1000,
  });

  // Feeds the customer dashboard's "Recent searches" panel.
  useEffect(() => {
    recordRecentSearch({
      q: search.q,
      city: search.city,
      listing: search.listing,
      minPrice: search.minPrice,
      maxPrice: search.maxPrice,
      beds: search.beds,
    });
  }, [search]);

  const onSearchChange = (patch: Partial<PropertySearchParams>) => {
    navigate({ search: (prev) => ({ ...prev, ...patch }) as PropertySearchParams });
  };

  const locationLabel = search.locality || search.q;
  const pageTitle = locationLabel
    ? `Properties in ${locationLabel}${search.city && search.city !== locationLabel ? `, ${search.city}` : ""}`
    : search.city
      ? `Properties in ${search.city}`
      : "All Properties";

  const pageSubtitle = locationLabel
    ? `Showing verified 0% brokerage listings matching "${locationLabel}".`
    : search.city
      ? `Discover direct-owner homes across ${search.city}.`
      : "Discover homes across all our active cities.";

  return (
    <SearchUI
      properties={all}
      isLoading={isLoading}
      search={search}
      onSearchChange={onSearchChange}
      title={pageTitle}
      subtitle={pageSubtitle}
      baseUrl="/properties"
    />
  );
}
