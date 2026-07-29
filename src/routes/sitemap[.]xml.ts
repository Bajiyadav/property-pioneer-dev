import { createFileRoute } from "@tanstack/react-router";

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
        const origin = new URL(request.url).origin;

        const staticPaths = ["/", "/properties", "/favorites"];
        const entries: Array<{ loc: string; lastmod?: string; priority: string }> =
          staticPaths.map((p) => ({
            loc: `${origin}${p}`,
            priority: p === "/" ? "1.0" : "0.8",
          }));

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await (supabaseAdmin as any)
            .from("properties")
            .select("id, updated_at")
            .eq("is_approved", true)
            .order("updated_at", { ascending: false })
            .limit(5000);

          for (const row of (data ?? []) as Array<{ id: string; updated_at: string }>) {
            entries.push({
              loc: `${origin}/properties/${row.id}`,
              lastmod: new Date(row.updated_at).toISOString(),
              priority: "0.7",
            });
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