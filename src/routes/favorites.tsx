import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { fetchProperties } from "@/modules/property/services/propertyQueries";
import { PropertyCard } from "@/modules/property/components/PropertyCard";
import { useFavorites } from "@/modules/property/hooks/useFavorites";

import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/favorites")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/favorites");
    const ogImage = getOgImageUrl();
    const title = `Your saved homes — ${APP_NAME}`;
    const description = `Homes you've saved to revisit later on ${APP_NAME}.`;
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
        { name: "robots", content: "noindex" },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: FavoritesPage,
});

function FavoritesPage() {
  const { ids } = useFavorites();
  const { data: all = [], isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: () => fetchProperties(),
    staleTime: 5 * 60 * 1000,
  });
  const saved = all.filter((p) => ids.includes(p.id));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Saved homes</h1>
      <p className="mt-1 text-muted-foreground">
        {isLoading ? "Loading…" : `${saved.length} ${saved.length === 1 ? "home" : "homes"} saved`}
      </p>

      <div className="mt-8">
        {saved.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/80 p-12 text-center bg-card/50">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
              <Heart className="h-7 w-7" />
            </div>
            <p className="mt-4 text-lg font-extrabold text-foreground">
              You haven't saved any properties yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Tap the heart icon on any property card to save your favorite homes and compare them
              easily.
            </p>
            <Link
              to="/properties"
              search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
              className="mt-6 inline-flex items-center rounded-xl bg-emerald-600 px-6 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
            >
              Explore Properties
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
