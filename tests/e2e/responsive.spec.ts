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

  /**
   * Element-level overflow, which the document-level check above cannot see.
   *
   * This gap shipped a real bug: the rupee price in the property card's stat row
   * escaped its column and spilled out of the card on phones, while every test
   * here stayed green. The reason is that `documentElement.scrollWidth` only
   * grows when overflow reaches the page. A child overflowing inside a container
   * that clips, or that simply has room to absorb it, leaves the document width
   * completely honest — so a page-level assertion reports a healthy layout for
   * visibly broken UI.
   *
   * Comparing each value's own `scrollWidth` to its `clientWidth` is what
   * actually catches it: they diverge the moment content is wider than the box
   * that holds it, whether or not the page notices.
   */
  for (const width of [320, 360, 375, 414]) {
    test(`property card stat values fit their columns @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/properties${SEARCH}`, { waitUntil: "domcontentloaded" });

      const values = page.locator('[data-testid="stat-value"]');
      await values.first().waitFor({ state: "visible", timeout: 15_000 });

      const overflowing = await values.evaluateAll((nodes) =>
        nodes
          .map((n) => ({
            text: (n.textContent ?? "").trim(),
            scroll: n.scrollWidth,
            client: n.clientWidth,
          }))
          // 1px of slack for sub-pixel rounding; anything more is real overflow.
          .filter((m) => m.scroll > m.client + 1),
      );

      expect(overflowing, `values wider than their column: ${JSON.stringify(overflowing)}`).toEqual(
        [],
      );
    });
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
