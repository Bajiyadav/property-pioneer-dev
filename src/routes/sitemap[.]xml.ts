import { createFileRoute } from "@tanstack/react-router";
import { APP_URL } from "@/config/app";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = APP_URL || new URL(request.url).origin;

        // Only paths that actually resolve. /villas, /plots and /farm-lands
        // were removed as routes but left here, so the sitemap was handing
        // search engines three URLs that return 404 — worse than not listing
        // them, because it invites crawling and then fails.
        // `/favorites` was listed here while its own route sends
        // `robots: noindex`. Submitting a page and then telling the crawler to
        // ignore it wastes crawl budget and is reported as a coverage conflict in
        // Search Console, so it is out. The other authenticated surfaces
        // (/profile, /notifications) were never listed and stay unlisted.
        const staticPaths = [
          "/",
          "/rent",
          "/buy",
          "/commercial",
          "/properties",
          "/agents",
          "/help",
          "/blog",
          "/privacy-policy",
          "/terms-of-service",
          "/cookie-policy",
          "/refund-policy",
        ];
        const entries: Array<{ loc: string; lastmod?: string; priority: string }> = staticPaths.map(
          (p) => ({
            loc: `${origin}${p}`,
            priority: p === "/" ? "1.0" : "0.8",
          }),
        );

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("properties")
            .select("id, updated_at, city, listing_type")
            .eq("is_approved", true)
            .order("updated_at", { ascending: false })
            .limit(5000);

          const rows = (data ?? []) as Array<{
            id: string;
            updated_at: string;
            city: string | null;
            listing_type: string | null;
          }>;

          for (const row of rows) {
            entries.push({
              loc: `${origin}/properties/${row.id}`,
              lastmod: new Date(row.updated_at).toISOString(),
              priority: "0.7",
            });
          }

          /*
           * City landing pages, derived from inventory rather than declared.
           *
           * The whole /rent/{city} and /rent/{city}/{locality} tree was missing
           * from this file, so the rental pages — the ones the business most wants
           * ranked — were reachable only by crawling links.
           *
           * They are generated from properties that actually exist rather than
           * from the CITIES config. A config-driven list would emit a page for
           * every one of the 13 configured cities, and a rental page for a city
           * with no rentals is a thin page: it invites a crawl, returns nothing
           * useful, and drags down the quality signal for the pages that do have
           * inventory. If a city has no approved listing, it does not belong in
           * the sitemap yet.
           */
          const slug = (v: string) =>
            v
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-");

          /*
           * A city needs real depth before it is worth submitting.
           *
           * Deriving pages from inventory alone still produced /rent/mumbai and
           * /rent/gurugram off a single listing each. One property is technically
           * real inventory, but the page it renders is thin: a crawler is invited
           * in and finds almost nothing, which is a weak quality signal applied
           * across the whole site rather than just that URL.
           *
           * The threshold only governs the SITEMAP. These pages stay live, stay
           * crawlable and stay linked — they are simply not submitted until they
           * can carry a result. They appear automatically once inventory grows,
           * with no code change.
           */
          const MIN_INVENTORY_FOR_SITEMAP = 3;

          const rentCities = new Map<string, number>();
          const saleCities = new Map<string, number>();
          for (const row of rows) {
            if (!row.city) continue;
            const bucket = row.listing_type === "sale" ? saleCities : rentCities;
            const key = slug(row.city);
            bucket.set(key, (bucket.get(key) ?? 0) + 1);
          }

          for (const [city, count] of rentCities) {
            if (count < MIN_INVENTORY_FOR_SITEMAP) continue;
            entries.push({ loc: `${origin}/rent/${city}`, priority: "0.9" });
          }
          for (const [city, count] of saleCities) {
            if (count < MIN_INVENTORY_FOR_SITEMAP) continue;
            entries.push({ loc: `${origin}/buy/${city}`, priority: "0.9" });
          }

          /*
           * Locality pages, same rule. `locality` ships in a later migration than
           * the base columns, so it is queried separately: naming a column that
           * does not exist makes PostgREST reject the WHOLE query, which would
           * empty the sitemap rather than merely omit localities.
           */
          try {
            const { data: locRows } = await supabaseAdmin
              .from("properties")
              .select("city, locality, listing_type")
              .eq("is_approved", true)
              .not("locality", "is", null)
              .limit(5000);

            const localityCounts = new Map<string, number>();
            for (const row of (locRows ?? []) as Array<{
              city: string | null;
              locality: string | null;
              listing_type: string | null;
            }>) {
              if (!row.city || !row.locality) continue;
              const base = row.listing_type === "sale" ? "buy" : "rent";
              const path = `/${base}/${slug(row.city)}/${slug(row.locality)}`;
              localityCounts.set(path, (localityCounts.get(path) ?? 0) + 1);
            }
            for (const [path, count] of localityCounts) {
              if (count < MIN_INVENTORY_FOR_SITEMAP) continue;
              entries.push({ loc: `${origin}${path}`, priority: "0.9" });
            }
          } catch (localityError) {
            // Sitemap stays valid without locality pages.
            console.error("[sitemap] locality pass skipped", localityError);
          }
        } catch (error) {
          console.error("[sitemap] property fetch failed", error);
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${escapeXml(e.loc)}</loc>${
        e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""
      }<priority>${e.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
