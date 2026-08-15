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
    const viewDetailsLink = page.getByRole("link", { name: /View Details/i }).first();
    await expect(viewDetailsLink).toBeVisible({ timeout: 10000 });
    await viewDetailsLink.click();

    // 3. Verify on Property Detail Page
    await page.waitForURL(/\/properties\/hyd-/, { timeout: 15000 });

    // Verify Transparent Rental Terms section exists
    await expect(page.getByRole("heading", { name: /Transparent Rental Terms/i })).toBeVisible({
      timeout: 15000,
    });

    // Verify Brokerage 0% Zero Fee badge is displayed
    await expect(page.getByText(/0% Zero Fee/i).first()).toBeVisible({ timeout: 10000 });

    // 4. Verify Schedule Visit Modal can be opened
    const scheduleBtn = page.getByRole("button", { name: /Schedule Visit/i }).first();
    await expect(scheduleBtn).toBeVisible({ timeout: 10000 });
    await scheduleBtn.click();

    // Verify Schedule Visit dialog appears
    await expect(page.getByRole("heading", { name: /Request a Property Visit/i })).toBeVisible({
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
