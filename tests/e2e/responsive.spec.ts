import { test, expect } from "@playwright/test";

/**
 * Layout integrity across the width range real visitors actually use.
 *
 * Horizontal overflow is the failure that matters most on phones: it makes the
 * page pan sideways and pushes primary actions off-screen. Checked against the
 * document element rather than a screenshot so the assertion is deterministic.
 */
const WIDTHS = [320, 375, 390, 414, 768, 820, 1024, 1280, 1440];
const SEARCH = "?q=&city=&listing=&minPrice=0&maxPrice=0&beds=0";

const PAGES = [
  ["home", "/"],
  ["search", `/properties${SEARCH}`],
  ["auth", "/auth?redirect="],
  ["services", "/home-services"],
  ["help", "/help"],
] as const;

test.describe("responsive layout", () => {
  for (const width of WIDTHS) {
    for (const [name, path] of PAGES) {
      test(`${name} @ ${width}px has no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(600);

        const m = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
        }));
        // A couple of px of slack absorbs sub-pixel rounding.
        expect(m.scroll, `${m.scroll}px content in ${m.client}px viewport`).toBeLessThanOrEqual(
          m.client + 2,
        );
      });
    }
  }

  test("primary navigation stays reachable on the narrowest phone", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const cta = page.getByRole("link", { name: /List Property FREE/i }).first();
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    expect(box, "CTA must have a hit area").not.toBeNull();
    // Comfortable touch target height.
    expect(box!.height).toBeGreaterThanOrEqual(32);
  });
});
