import { createFileRoute } from "@tanstack/react-router";
import { APP_URL, generatePropertySlug } from "@/config/app";

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

        const staticPaths = [
          "/",
          "/rent",
          "/buy",
          "/commercial",
          "/properties",
          "/agents",
          "/help",
          "/blog",
          "/home-loans",
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

          /*
           * Base columns only in this query, and `locality` fetched separately
           * below.
           *
           * `locality` arrives in a migration that is not yet applied to the live
           * database. PostgREST rejects an ENTIRE select when one column is
           * missing, so naming it here did not merely omit locality pages — it
           * failed the whole query, the catch swallowed the error, and the live
           * sitemap silently collapsed from 47 URLs to the 12 static paths. Every
           * property page and every city page disappeared from search engines
           * while the endpoint still returned a valid 200 XML document.
           *
           * That is the worst shape of failure available here: no error surface,
           * no alert, and a sitemap that looks healthy. Keeping the required
           * columns in one query and the optional one in another means a missing
           * migration costs a section rather than everything.
           */
          const { data, error: baseError } = await supabaseAdmin
            .from("properties")
            .select("id, updated_at, city, listing_type, bedrooms, property_type, title")
            .eq("is_approved", true)
            .order("updated_at", { ascending: false })
            .limit(5000);

          if (baseError) {
            // Logged loudly: an empty sitemap is a silent SEO outage.
            console.error("[sitemap] base property query failed", baseError);
          }

          const rows = (data ?? []) as Array<{
            id: string;
            updated_at: string;
            city: string | null;
            listing_type: string | null;
            bedrooms: number | null;
            property_type: string | null;
            title: string | null;
            locality?: string | null;
          }>;

          // Add individual property pages with friendly slugs
          for (const row of rows) {
            const slug = generatePropertySlug({
              id: row.id,
              title: row.title,
              bedrooms: row.bedrooms,
              property_type: row.property_type,
              listing_type: row.listing_type,
              locality: row.locality,
              city: row.city,
            });
            entries.push({
              loc: `${origin}/properties/${slug}`,
              lastmod: new Date(row.updated_at).toISOString(),
              priority: "0.7",
            });
          }

          /*
           * Optional enrichment. If the column is absent this fails alone, the
           * rows keep their base data, and only locality pages are skipped.
           */
          try {
            const { data: locRows } = await supabaseAdmin
              .from("properties")
              .select("id, locality")
              .eq("is_approved", true)
              .limit(5000);
            const byId = new Map((locRows ?? []).map((r) => [r.id, r.locality]));
            for (const row of rows) row.locality = byId.get(row.id) ?? null;
          } catch (localityError) {
            console.error("[sitemap] locality enrichment skipped", localityError);
          }

          const slugify = (v: string) =>
            v
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-");

          const MIN_INVENTORY_FOR_SITEMAP = 3;

          // Inventory counters for rent, sale, commercial
          const rentCities = new Map<string, number>();
          const buyCities = new Map<string, number>();
          const commercialCities = new Map<string, number>();

          const rentLocalities = new Map<string, number>();
          const buyLocalities = new Map<string, number>();
          const commercialLocalities = new Map<string, number>();

          for (const row of rows) {
            if (!row.city) continue;
            const cityKey = slugify(row.city);

            // Determine listing category
            /*
             * Classified from `property_type` only.
             *
             * This also matched `description.includes("office")`, which is a
             * phrase residential rentals use constantly — "10 minutes from the
             * office parks", "ideal for office-goers". Any such flat was filed
             * under /commercial/{city}/{locality}, so the sitemap advertised a
             * residential listing at a commercial URL and pointed the crawler at
             * a page that does not contain it. A title substring match had the
             * same problem in a milder form.
             *
             * `property_type` is the field the listing wizard actually sets, from
             * a fixed set, so it is the one authoritative signal available here.
             */
            const type = row.property_type?.toLowerCase() ?? "";
            const isCommercial =
              type === "commercial" ||
              type === "office" ||
              type === "shop" ||
              type === "warehouse" ||
              type === "showroom";

            if (isCommercial) {
              commercialCities.set(cityKey, (commercialCities.get(cityKey) ?? 0) + 1);
              if (row.locality) {
                const locKey = `/${cityKey}/${slugify(row.locality)}`;
                commercialLocalities.set(locKey, (commercialLocalities.get(locKey) ?? 0) + 1);
              }
            } else if (row.listing_type === "sale") {
              buyCities.set(cityKey, (buyCities.get(cityKey) ?? 0) + 1);
              if (row.locality) {
                const locKey = `/${cityKey}/${slugify(row.locality)}`;
                buyLocalities.set(locKey, (buyLocalities.get(locKey) ?? 0) + 1);
              }
            } else {
              // Default to rent
              rentCities.set(cityKey, (rentCities.get(cityKey) ?? 0) + 1);
              if (row.locality) {
                const locKey = `/${cityKey}/${slugify(row.locality)}`;
                rentLocalities.set(locKey, (rentLocalities.get(locKey) ?? 0) + 1);
              }
            }
          }

          // Emit Rent city and locality pages
          for (const [city, count] of rentCities) {
            if (count < MIN_INVENTORY_FOR_SITEMAP) continue;
            entries.push({ loc: `${origin}/rent/${city}`, priority: "0.9" });
          }
          for (const [path, count] of rentLocalities) {
            if (count < MIN_INVENTORY_FOR_SITEMAP) continue;
            entries.push({ loc: `${origin}/rent${path}`, priority: "0.9" });
          }

          // Emit Buy (Sale) city and locality pages
          for (const [city, count] of buyCities) {
            if (count < MIN_INVENTORY_FOR_SITEMAP) continue;
            entries.push({ loc: `${origin}/buy/${city}`, priority: "0.9" });
          }
          for (const [path, count] of buyLocalities) {
            if (count < MIN_INVENTORY_FOR_SITEMAP) continue;
            entries.push({ loc: `${origin}/buy${path}`, priority: "0.9" });
          }

          // Emit Commercial city and locality pages
          for (const [city, count] of commercialCities) {
            if (count < MIN_INVENTORY_FOR_SITEMAP) continue;
            entries.push({ loc: `${origin}/commercial/${city}`, priority: "0.9" });
          }
          for (const [path, count] of commercialLocalities) {
            if (count < MIN_INVENTORY_FOR_SITEMAP) continue;
            entries.push({ loc: `${origin}/commercial${path}`, priority: "0.9" });
          }
        } catch (error) {
          console.error("[sitemap] property sitemap compilation failed", error);
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
