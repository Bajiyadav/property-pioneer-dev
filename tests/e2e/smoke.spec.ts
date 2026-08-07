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
    ["/", /Urban Properties/i],
    [`/properties${SEARCH}`, /Browse Homes/i],
    ["/buy", /Buy/i],
    ["/commercial", /Commercial/i],
    ["/villas", /Villa/i],
    ["/plots", /Plot/i],
    ["/farm-lands", /Farm/i],
    ["/home-services", /Home Services/i],
    ["/favorites", /Saved/i],
    ["/blog", /Blog|Insight/i],
    ["/help", /help/i],
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
    await expect(page.locator("footer").last()).toContainText(
      "© 2022 Urban Properties. All Rights Reserved.",
    );
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
