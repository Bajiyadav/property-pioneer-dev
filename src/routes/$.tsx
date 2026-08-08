import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/shared/components/BrandMark";
import { APP_NAME } from "@/config/app";

/**
 * Catch-all for unknown URLs.
 *
 * Known limitation: this responds 200, not 404. `setResponseStatus(404)` in
 * `beforeLoad` was verified to execute during SSR but the streaming render
 * handler overwrites the status afterwards, so the call was removed rather than
 * left in place looking effective. `robots: noindex` below keeps these URLs out
 * of the index in the meantime.
 */
export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: `Page not found — ${APP_NAME}` },
      {
        name: "description",
        content: `This page doesn't exist on ${APP_NAME}. Browse homes for rent and sale in Hyderabad.`,
      },
      { property: "og:title", content: `Page not found — ${APP_NAME}` },
      { property: "og:description", content: `This page doesn't exist on ${APP_NAME}.` },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: APP_NAME },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CatchAll,
});

function CatchAll() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
      <BrandMark />
      <h1 className="mt-6 font-serif text-3xl font-semibold text-foreground">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        The page you're looking for isn't here. Let's get you back to browsing homes.
      </p>
      <Link
        to="/properties"
        search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
        className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
      >
        Browse homes
      </Link>
    </div>
  );
}
