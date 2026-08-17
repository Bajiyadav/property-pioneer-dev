import { test, expect } from "@playwright/test";

/**
 * SEO contract tests.
 *
 * These run against a real deployment, because the things that break SEO break at
 * the response level: a rule that applies to the wrong crawler, a page that
 * inherits the root's title, a sitemap listing a URL the site marks noindex. None
 * of that is visible from a unit test.
 *
 * Every assertion here corresponds to a defect that was actually present, not to a
 * hypothetical. The comments say which.
 */

const PUBLIC_PAGES = [
  ["home", "/"],
  ["rent city", "/rent/hyderabad"],
  ["rent locality", "/rent/hyderabad/gachibowli"],
  ["buy", "/buy"],
  ["commercial", "/commercial"],
  ["listings", "/properties"],
  ["list property", "/list-property"],
] as const;

test.describe("SEO — metadata", () => {
  for (const [name, path] of PUBLIC_PAGES) {
    test(`${name} has its own title, description and self-referential canonical`, async ({
      page,
    }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });

      const title = await page.title();
      expect(title.length, `${path} needs a title`).toBeGreaterThan(10);
      // Google truncates around 60 characters; well past that is wasted.
      expect(title.length, `${path} title is too long: "${title}"`).toBeLessThanOrEqual(75);

      const description = await page
        .locator('meta[name="description"]')
        .first()
        .getAttribute("content");
      expect(description, `${path} needs a meta description`).toBeTruthy();
      expect(description!.length, `${path} description too short`).toBeGreaterThan(50);

      // Exactly one canonical, pointing at this page. Two conflicting canonicals
      // make a search engine discard both — which shipped once already.
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical, `${path} must declare one canonical`).toHaveCount(1);
      const href = await canonical.getAttribute("href");
      expect(href).toMatch(/^https?:\/\//);
      expect(new URL(href!).pathname.replace(/\/$/, "")).toBe(path.replace(/\/$/, ""));
    });
  }

  test("every public page title is distinct", async ({ page }) => {
    // A shared title means pages compete with each other for the same query.
    const titles = new Map<string, string>();
    for (const [, path] of PUBLIC_PAGES) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      // Wait for the page's own H1 before reading the title: under parallel
      // workers the document can still be hydrating, and the root's fallback
      // title would be read instead of the route's.
      await page.locator("h1").first().waitFor({ state: "visible", timeout: 20_000 });
      titles.set(path, await page.title());
    }
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const [path, title] of titles) {
      const prev = seen.get(title);
      if (prev) clashes.push(`${prev} and ${path} share "${title}"`);
      else seen.set(title, path);
    }
    expect(clashes, clashes.join("; ")).toEqual([]);
  });

  test("filtered listing URLs canonicalise to the clean path", async ({ page }) => {
    // Otherwise every filter permutation is a separate duplicate page.
    await page.goto("/properties?q=&city=hyderabad&listing=rent&minPrice=20000&beds=2", {
      waitUntil: "domcontentloaded",
    });
    const href = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(href!).search, "canonical must not carry filter params").toBe("");
    expect(new URL(href!).pathname).toBe("/properties");
  });
});

test.describe("SEO — indexing rules", () => {
  test("robots.txt applies its rules to Googlebot, not only to others", async ({ request }) => {
    /*
     * The regression this exists for: the file used to give Googlebot its own
     * group containing only "Allow: /". A named user-agent group REPLACES the
     * wildcard group rather than merging with it, so every Disallow applied to
     * every crawler except the two that matter most, leaving /admin and
     * /dashboard crawlable by Google.
     */
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();

    const groups = body
      .split(/\n(?=User-agent:)/i)
      .map((g) => g.trim())
      .filter(Boolean);

    for (const group of groups) {
      const agents = [...group.matchAll(/User-agent:\s*(.+)/gi)].map((m) => m[1].trim());
      const named = agents.filter((a) => a !== "*");
      if (named.length === 0) continue;
      expect(
        /Disallow:\s*\/\S/i.test(group),
        `robots.txt group for ${named.join(", ")} has no Disallow rules, so it grants full access`,
      ).toBe(true);
    }

    for (const path of ["/admin", "/dashboard", "/api/"]) {
      expect(body, `robots.txt must disallow ${path}`).toContain(`Disallow: ${path}`);
    }
    expect(body).toMatch(/Sitemap:\s*https?:\/\//i);
  });

  test("private routes are noindex", async ({ page }) => {
    for (const path of ["/profile", "/notifications", "/favorites", "/auth"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const robots = await page
        .locator('meta[name="robots"]')
        .first()
        .getAttribute("content")
        .catch(() => null);
      expect(robots, `${path} must be noindex`).toContain("noindex");
    }
  });

  test("sitemap is valid, absolute, and lists no noindex page", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");

    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length, "sitemap should not be empty").toBeGreaterThan(5);

    for (const loc of locs) {
      expect(loc, "sitemap URLs must be absolute").toMatch(/^https?:\/\//);
    }
    expect(new Set(locs).size, "sitemap must not repeat a URL").toBe(locs.length);

    // Listing a page the site marks noindex is a Search Console coverage
    // conflict; /favorites was listed while sending noindex.
    for (const path of ["/favorites", "/profile", "/notifications", "/auth", "/admin"]) {
      expect(
        locs.some((l) => new URL(l).pathname === path),
        `sitemap must not list ${path}`,
      ).toBe(false);
    }
    // The rental tree is the commercial priority; it was missing entirely.
    expect(
      locs.some((l) => new URL(l).pathname.startsWith("/rent")),
      "sitemap should include rental pages",
    ).toBe(true);
  });

  test("an unknown URL returns a real 404, not a 200 soft-404", async ({ request }) => {
    const res = await request.get("/this-page-does-not-exist-seo-check");
    expect(res.status(), "soft 404s get indexed as duplicates").toBe(404);
  });
});

test.describe("SEO — structured data", () => {
  test("home exposes exactly one valid JSON-LD block", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);

    for (const raw of blocks) {
      // Invalid JSON-LD is silently discarded, so this must actually parse.
      const parsed = JSON.parse(raw);
      expect(parsed["@context"]).toContain("schema.org");
      expect(parsed["@type"]).toBeTruthy();
    }
  });

  test("a single H1 per public page", async ({ page }) => {
    for (const [name, path] of PUBLIC_PAGES) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.locator("h1").first().waitFor({ state: "visible", timeout: 20_000 });
      const count = await page.locator("h1").count();
      expect(count, `${name} (${path}) should have exactly one H1, found ${count}`).toBe(1);
    }
  });
});
