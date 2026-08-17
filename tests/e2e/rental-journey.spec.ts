import { test, expect } from "@playwright/test";

test.describe("Premium Rental Journey", () => {
  test("complete customer rental journey from discovery to property details and visit modal", async ({
    page,
    isMobile,
  }) => {
    // 1. Visit rental discovery page for Hyderabad
    await page.goto("/rent/hyderabad", { waitUntil: "domcontentloaded" });

    // Verify title and listing cards render
    await expect(page.getByRole("heading", { name: /Rental Homes in Hyderabad/i })).toBeVisible({
      timeout: 15000,
    });

    // 2. Open first property card
    // The card CTA was renamed "View Details" -> "Get Owner Details". Matching
    // either keeps this asserting the journey rather than one wording.
    const viewDetailsLink = page
      .getByRole("link", { name: /View Details|Get Owner Details/i })
      .first();
    await expect(viewDetailsLink).toBeVisible({ timeout: 10000 });
    await viewDetailsLink.click();

    // 3. Verify on Property Detail Page
    await page.waitForURL(/\/properties\//, { timeout: 15000 });

    // The detail page now leads with an Overview section; the old "Transparent
    // Rental Terms" block was removed in the redesign. Asserting a section the
    // page still has keeps this checking that the detail page actually
    // rendered, rather than pinning one layout.
    await expect(page.getByRole("heading", { name: /Overview/i }).first()).toBeVisible({
      timeout: 15000,
    });

    // The "0% Zero Fee" badge is deliberately gone: it was a brokerage claim of
    // the same kind smoke.spec.ts bans, so it is not re-asserted here.

    // 4. Verify Schedule Visit Modal can be opened
    const scheduleBtn = page.getByRole("button", { name: /Schedule Visit/i }).first();
    await expect(scheduleBtn).toBeVisible({ timeout: 10000 });
    await scheduleBtn.click();

    // The scheduling step is headed "Schedule a Visit" since the redesign; it
    // was "Request a Property Visit". Still asserting that clicking the button
    // actually opens the scheduling UI.
    await expect(page.getByRole("heading", { name: /Schedule a Visit/i }).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("similar rentals are displayed on property detail page", async ({ page }) => {
    // Open a specific property detail page
    await page.goto("/properties/hyd-000", { waitUntil: "domcontentloaded" });

    // Verify Similar Rentals heading is present
    await expect(page.getByRole("heading", { name: /Similar Rentals You May Like/i })).toBeVisible({
      timeout: 15000,
    });
  });
});
