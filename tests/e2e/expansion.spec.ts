import { test, expect, type Page } from "@playwright/test";

/**
 * Bangalore expansion experience.
 *
 * These cards exist to inform rather than decorate, so the assertions check for
 * real content sections and a working CTA — not merely that a modal opened.
 */

/**
 * Opens the Bangalore expansion modal from the homepage.
 *
 * `toBeVisible` succeeds as soon as the SSR markup paints, which is before React
 * has hydrated — a click at that instant does nothing. Retrying the click until
 * the dialog actually appears is what makes this reliable against a serverless
 * deployment with cold starts.
 */
async function openExpansionModal(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const card = page.getByRole("button", { name: /Bangalore/ }).first();
  await expect(card).toBeVisible({ timeout: 30_000 });

  await expect(async () => {
    await card.click({ timeout: 5_000 });
    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 4_000 });
  }).toPass({ timeout: 60_000 });
}

test.describe("Bangalore expansion", () => {
  // Serial: parallel cold starts against a serverless target produce flakes
  // that are not product defects.
  test.describe.configure({ mode: "serial" });

  test("the roadmap exposes expandable feature cards, not decoration", async ({ page }) => {
    await openExpansionModal(page);
    const cards = page.locator('button[aria-label*="open details"]');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(10);
  });

  test("a feature card opens a detail modal with real content", async ({ page }) => {
    await openExpansionModal(page);
    await page.locator('button[aria-label*="open details"]').first().click();

    const detail = page.locator('[role="dialog"]').last();
    await expect(detail).toBeVisible();
    for (const section of ["What we provide", "What you get"]) {
      await expect(detail.getByText(section, { exact: false })).toBeVisible();
    }
    // Availability is always stated so nothing reads as readier than it is.
    await expect(detail.getByText(/Available now|Being rolled out|Planned/i).first()).toBeVisible();
  });

  test("Escape closes the detail modal, then the parent", async ({ page }) => {
    await openExpansionModal(page);
    await page.locator('button[aria-label*="open details"]').first().click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(2);
    // Radix animates dialogs out, so let the open transition settle before
    // asserting on counts — otherwise the exit animation is still on screen.
    await expect(page.locator('[role="dialog"]').last()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator('[role="dialog"]')).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });

  test("a corridor link runs a real search with results", async ({ page }) => {
    await openExpansionModal(page);
    await page
      .getByRole("link", { name: /Koramangala/ })
      .first()
      .click();
    await page.waitForURL(/q=Koramangala/, { timeout: 30_000 });
    await expect(page.locator('a[href*="/properties/"]').first()).toBeVisible({ timeout: 30_000 });
  });

  test("a corridor with no inventory says so honestly", async ({ page }) => {
    await openExpansionModal(page);
    await page
      .getByRole("link", { name: /Whitefield/ })
      .first()
      .click();
    await page.waitForURL(/q=Whitefield/, { timeout: 30_000 });
    await expect(page.getByText(/No properties found in Whitefield yet/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: /View all properties/i })).toBeVisible();
  });
});
