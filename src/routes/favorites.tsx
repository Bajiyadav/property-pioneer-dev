import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { fetchProperties } from "@/lib/properties";
import { PropertyCard } from "@/components/PropertyCard";
import { useFavorites } from "@/lib/useFavorites";

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
    queryFn: fetchProperties,
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
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Heart className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-lg font-semibold text-foreground">Nothing saved yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap the heart on any listing to save it.
            </p>
            <Link
              to="/properties"
              search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
              className="mt-5 inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Browse homes
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
