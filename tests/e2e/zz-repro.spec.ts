import { test } from "@playwright/test";
test("customer dashboard anatomy", async ({ page }) => {
  await page.goto("/auth");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.locator('input[type="email"]').fill(process.env.QA_CUSTOMER_EMAIL!);
  await page.locator('input[type="password"]').fill(process.env.QA_CUSTOMER_PASSWORD!);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/dashboard\/customer/, { timeout: 30000 });
  await page.waitForTimeout(6000);
  console.log("signout(any):", await page.locator('[data-testid="sidebar-signout"]').count());
  console.log("aside:", await page.locator("aside").count());
  console.log("buttons named sign out/logout:", await page.getByRole("button", { name: /sign out|logout/i }).count());
  console.log("profile menu:", await page.getByRole("button", { name: "User profile menu" }).count());
  console.log("h1s:", JSON.stringify(await page.locator("h1").allTextContents()));
  console.log("body(0-300):", (await page.locator("body").innerText()).slice(0,300).replace(/\n/g," | "));
});
