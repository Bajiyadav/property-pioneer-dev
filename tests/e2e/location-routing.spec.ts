import { test, expect } from "@playwright/test";

test.describe("Location Discovery Routing", () => {
  test.describe.configure({ mode: "serial" });

  test("can navigate to a city route and see properties", async ({ page }) => {
    await page.goto("/rent/hyderabad", { waitUntil: "domcontentloaded" });

    // Check that the UI acknowledges the city
    await expect(page.getByRole("heading", { name: /Rental Homes in Hyderabad/i })).toBeVisible({
      timeout: 15000,
    });

    // Should display properties
    const propertyCards = page.locator('a[href*="/properties/"]');
    await expect(propertyCards.first()).toBeVisible({ timeout: 15000 });
  });

  test("can navigate to a locality route and see properties", async ({ page }) => {
    await page.goto("/rent/hyderabad/gachibowli", { waitUntil: "domcontentloaded" });

    // Check that the UI acknowledges the locality and city
    await expect(
      page.getByRole("heading", { name: /Rentals in Gachibowli, Hyderabad/i }),
    ).toBeVisible({ timeout: 15000 });

    // Should display properties
    const propertyCards = page.locator('a[href*="/properties/"]');
    await expect(propertyCards.first()).toBeVisible({ timeout: 15000 });
  });

  test("location picker navigates to the correct locality route", async ({ page }) => {
    await page.goto("/rent/hyderabad", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Rental Homes in Hyderabad/i })).toBeVisible({
      timeout: 15000,
    });

    // Open LocationPicker
    const locationBtn = page.getByRole("button", { name: /Select location/i });
    await expect(locationBtn).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000); // Wait for React hydration
    await locationBtn.click();

    // Search for a locality
    const searchInput = page.getByRole("textbox", { name: /Search location/i });
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill("Madhapur");

    // Click the result
    const resultBtn = page.getByRole("button", { name: /Madhapur/i }).first();
    await expect(resultBtn).toBeVisible();
    await resultBtn.click();

    // Wait for URL to change to the locality route
    await page.waitForURL(/\/rent\/hyderabad\/madhapur/, { timeout: 15000 });

    // Ensure the title updates
    await expect(
      page.getByRole("heading", { name: /Rentals in Madhapur, Hyderabad/i }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("search parameters are preserved across reloads on locality route", async ({
    page,
    isMobile,
  }) => {
    // Go to a locality route with search params
    await page.goto("/rent/hyderabad/kondapur?minPrice=20000&beds=2", {
      waitUntil: "domcontentloaded",
    });

    if (isMobile) {
      const filtersBtn = page.getByRole("button", { name: /Filters/i });
      await expect(filtersBtn).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(1000); // Wait for React hydration
      await filtersBtn.click();
    }

    // Ensure the filters are applied to the inputs in SearchUI
    const minPriceInput = page.getByRole("spinbutton", { name: /Minimum price/i }).first();
    await expect(minPriceInput).toBeVisible({ timeout: 15000 });
    await expect(minPriceInput).toHaveValue("20000");

    const bedsBtn = page.getByRole("button", { name: "2+" }).first();
    // It should have the active class, meaning its background is primary
    await expect(bedsBtn).toHaveClass(/bg-primary/);
  });
});
