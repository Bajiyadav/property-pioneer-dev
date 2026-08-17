import { test, expect, type Page } from "@playwright/test";

const SEARCH = "?q=&city=&listing=&minPrice=0&maxPrice=0&beds=0";

/** Console errors that are environmental noise rather than app defects. */
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (/Failed to load resource|401|403|429|Minified React error #418/.test(t)) return;
    errors.push(t);
  });
  page.on("pageerror", (e) => {
    if (/Minified React error #418/.test(e.message)) return;
    errors.push(e.message);
  });
  return errors;
}

test.describe("public routes", () => {
  const routes = [
    ["/", /Seedha Properties/i],
    [`/properties${SEARCH}`, /Properties|Browse|Homes/i],
    ["/buy", /Buy/i],
    ["/commercial", /Commercial/i],
    // /villas, /plots and /farm-lands were removed as routes in dfd7b38. They
    // are intentionally absent here rather than asserted-and-failing; restore
    // both the routes and these entries together if the pages come back.
    ["/favorites", /Saved/i],
    ["/blog", /Blog|Insight/i],
    ["/help", /help/i],
    ["/agents", /Agent|Partner/i],
  ] as const;

  for (const [path, expected] of routes) {
    test(`renders ${path}`, async ({ page }) => {
      const errors = collectConsoleErrors(page);
      const res = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `${path} should return 2xx`).toBeLessThan(400);
      await expect(page.locator("body")).toContainText(expected);
      await expect(page.locator("body")).not.toContainText(/didn't load|ReferenceError/i);
      expect(errors, `console errors on ${path}`).toEqual([]);
    });
  }

  test("404 page renders for an unknown route", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.locator("body")).toContainText(/Page not found/i);
  });

  test("footer copyright is present and correct", async ({ page }) => {
    await page.goto("/");
    // Not a pinned year: the notice is derived from the current date, so
    // hard-coding one here would re-introduce the staleness this checks for.
    await expect(page.locator("footer").last()).toContainText(
      `© ${new Date().getFullYear()} Seedha Properties. All Rights Reserved.`,
    );
  });

  // The homepage used to render its own footer on top of the global one, so
  // visitors saw the brand blurb, the columns and the copyright twice.
  test("renders exactly one footer on every page", async ({ page }) => {
    for (const path of ["/", `/properties${SEARCH}`, "/buy", "/help"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("footer"), `${path} should have one footer`).toHaveCount(1);
      const copies = await page
        .getByText(`© ${new Date().getFullYear()} Seedha Properties. All Rights Reserved.`)
        .count();
      expect(copies, `${path} should show the copyright once`).toBe(1);
    }
  });
});

test.describe("SEO", () => {
  test("home exposes canonical, JSON-LD and a single H1", async ({ page }) => {
    await page.goto("/");
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    expect(await canonical.getAttribute("href")).not.toContain("urbanproperties.in");
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("sitemap serves XML with entries", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain("<loc>");
  });
});

test.describe("access control", () => {
  const guarded = [
    "/dashboard",
    "/dashboard/customer",
    "/dashboard/owner",
    "/dashboard/agent",
    "/dashboard/admin",
    "/admin",
  ];

  for (const path of guarded) {
    test(`guest is redirected away from ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/\/auth/, { timeout: 30_000 });
      // The guard must never paint dashboard content before redirecting.
      await expect(page.locator("body")).not.toContainText(/Welcome back|Platform Admin HQ/i);
    });
  }
});

test.describe("property search", () => {
  test("listings load and a detail page opens", async ({ page }) => {
    await page.goto(`/properties${SEARCH}`);
    const cards = page.locator('a[href*="/properties/"]');
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });

    await cards.first().click();
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("body")).toContainText("₹");
  });
});

test.describe("accessibility basics", () => {
  test("no unlabelled inputs, unnamed buttons, or alt-less images on home", async ({ page }) => {
    await page.goto("/");
    const audit = await page.evaluate(() => {
      const inputs = [...document.querySelectorAll("input,select,textarea")];
      const buttons = [...document.querySelectorAll("button")];
      const images = [...document.querySelectorAll("img")];
      return {
        unlabelledInputs: inputs.filter(
          (i) =>
            !i.getAttribute("aria-label") &&
            !(i.id && document.querySelector(`label[for="${i.id}"]`)),
        ).length,
        unnamedButtons: buttons.filter(
          (b) => !(b.textContent?.trim() || b.getAttribute("aria-label") || b.title),
        ).length,
        altlessImages: images.filter((i) => !i.hasAttribute("alt")).length,
      };
    });
    expect(audit.unlabelledInputs).toBe(0);
    expect(audit.unnamedButtons).toBe(0);
    expect(audit.altlessImages).toBe(0);
  });
});

test.describe("product focus", () => {
  // Promotional sections removed in the final cleanup pass. Asserted so they
  // cannot quietly return: each advertised a service with no working flow.
  const REMOVED = [
    "Micro-Location",
    "Explore Homes Near",
    "Metro Stations",
    "Coaching Hubs",
    "Bus Terminals",
    "Grocery & Malls",
    "Electrician Services",
    "Plumbing Services",
    "Internet Setup",
    "Explore & Book Service",
    // Fabricated integrations and unearned claims removed in the credibility pass.
    "Powered by Gemini",
    "Urban AI",
    "Zero Brokerage",
    "0% Brokerage",
    "Aadhaar",
    "Launching Soon",
    "Download the Seedha Properties mobile app",
    "Pan-India",
    "Expanding Across India",
  ];

  test("homepage carries no removed promotional sections", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const body = await page.locator("body").innerText();
    for (const phrase of REMOVED) {
      expect(body, `"${phrase}" should be gone`).not.toContain(phrase);
    }
  });

  // Assertions on specific phrasings rather than bare keywords: /help may
  // legitimately say we do NOT verify RERA or title deeds, and /blog may list
  // "RERA compliance" as a planned guide topic. Only the affirmative claim is a
  // defect, because the platform performs none of these checks.
  const FALSE_CLAIMS = [
    /we verify (rera|title)/i,
    /title[- ]cleared/i,
    /title deed (audit|verification)/i,
    /verify .{0,30}(hmda|ghmc) approvals/i,
    /pre-?approv(ed|al) (in|from)/i,
    /bank partners/i,
    /aadhaar (identity )?verif/i,
    /government verified/i,
    /legally verified/i,
    /100% (verified|title|zero brokerage|direct owner verification)/i,
    /guarantee(s|d)? (zero|0%) brokerage/i,
  ];

  test("no page makes a verification or finance claim the platform cannot back", async ({
    page,
  }) => {
    for (const path of ["/", "/help", "/blog", "/auth"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      // textContent, not innerText: FAQ answers live inside collapsed
      // accordions and would otherwise go unchecked.
      const text = await page.evaluate(() => document.body.textContent ?? "");
      for (const claim of FALSE_CLAIMS) {
        expect(text, `${claim} must not appear on ${path}`).not.toMatch(claim);
      }
    }
  });

  test("a trending location chip runs a real search", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "Madhapur", exact: true }).first().click();
    await page.waitForURL(/\/properties\?.*q=Madhapur/, { timeout: 30_000 });
  });

  test("a search with no matches names the term and offers a way back", async ({ page }) => {
    // Deliberately a locality with no inventory. Madhapur was used here until
    // the Hyderabad catalogue was seeded and it started returning results —
    // the assertion belongs on a term that is genuinely empty.
    await page.goto(`/properties?q=Sriperumbudur&city=&listing=&minPrice=0&maxPrice=0&beds=0`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText(/No properties found in Sriperumbudur yet/i)).toBeVisible({
      timeout: 30_000,
    });
    const back = page.getByRole("link", { name: /View all properties/i });
    await expect(back).toBeVisible();
    await back.click();
    await expect(page.locator('a[href*="/properties/"]').first()).toBeVisible({ timeout: 30_000 });
  });
});
