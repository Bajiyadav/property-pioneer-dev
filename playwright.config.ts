import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against a deployed URL (preview or production) rather than a local
 * server: the app is SSR + Supabase-backed, so testing the real deployment is
 * what actually proves a release is safe to promote.
 */
const baseURL = process.env.E2E_BASE_URL ?? "https://property-pioneer-dev.vercel.app";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retries and a modest worker cap: the target is a serverless deployment, so
  // a burst of parallel cold starts produces flakes that are not app defects.
  retries: 2,
  workers: 2,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: { baseURL, trace: "on-first-retry", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
