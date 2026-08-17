/**
 * Legal pages and the consent gate, end to end.
 *
 * These four URLs returned 404 in production while the footer linked to all of
 * them — a broken link and a compliance gap at the same time. This suite exists
 * so that cannot regress silently.
 */
import { test, expect, type Page } from "@playwright/test";

const LEGAL_PAGES = [
  ["/privacy-policy", "Privacy Policy"],
  ["/terms-of-service", "Terms of Service"],
  ["/cookie-policy", "Cookie Policy"],
  ["/refund-policy", "Refund Policy"],
] as const;

async function consentState(page: Page) {
  return page.evaluate(() => localStorage.getItem("up_cookie_consent"));
}

test.describe("Legal pages", () => {
  for (const [path, heading] of LEGAL_PAGES) {
    test(`${path} resolves and renders its policy`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} must not 404`).toBeLessThan(400);
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible({
        timeout: 20000,
      });
      // A policy page with no body is not a policy.
      const text = await page.locator("body").innerText();
      expect(text.length).toBeGreaterThan(600);
      await expect(page.getByText("Effective", { exact: false }).first()).toBeVisible();
    });
  }

  test("the footer links to every policy and each one resolves", async ({ page }) => {
    await page.goto("/");
    for (const [path, heading] of LEGAL_PAGES) {
      const link = page.locator(`footer a[href="${path}"]`).first();
      await expect(link, `footer should link to ${path}`).toHaveCount(1);
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible({
        timeout: 20000,
      });
    }
  });
});

test.describe("Consent gate", () => {
  test("asks before collecting, and both choices are one click away", async ({ page }) => {
    await page.goto("/");
    const banner = page.getByTestId("consent-banner");
    await expect(banner).toBeVisible({ timeout: 20000 });

    // Neither option may be buried — a reject that is harder to reach than
    // accept is not a free choice.
    await expect(page.getByTestId("consent-accept")).toBeVisible();
    await expect(page.getByTestId("consent-reject")).toBeVisible();

    expect(await consentState(page), "nothing stored before a decision").toBeNull();
  });

  test("rejecting is recorded and the banner stays gone", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("consent-reject").click();

    await expect(page.getByTestId("consent-banner")).toHaveCount(0);
    const stored = await consentState(page);
    expect(stored).toContain("rejected");

    await page.reload();
    await expect(page.getByTestId("consent-banner")).toHaveCount(0);
  });

  test("accepting is recorded", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("consent-accept").click();
    await expect(page.getByTestId("consent-banner")).toHaveCount(0);
    expect(await consentState(page)).toContain("accepted");
  });

  test("declining means no tracking request is ever sent", async ({ page }) => {
    const trackingCalls: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (
        req.method() === "POST" &&
        (url.includes("/rest/v1/property_views") || url.includes("/rest/v1/search_history"))
      ) {
        trackingCalls.push(url);
      }
    });

    await page.goto("/");
    await page.getByTestId("consent-reject").click();

    // Browse the pages that would otherwise record activity.
    await page.goto("/properties?q=&city=Hyderabad&listing=rent&minPrice=0&maxPrice=0&beds=0");
    await page.waitForTimeout(2500);
    await page.goto("/properties/hyd-000");
    await page.waitForTimeout(2500);

    expect(trackingCalls, "a declined visitor must generate no tracking writes").toEqual([]);
  });
});
