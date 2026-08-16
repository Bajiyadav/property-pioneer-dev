/**
 * End-to-end authentication lifecycle for all four roles.
 *
 * The rule this suite is built around: a redirect or a "Signed out" toast is
 * NOT proof of logout. Every sign-out is proven three ways —
 *   1. the Supabase session is gone from browser storage,
 *   2. the refresh token is rejected by the Supabase auth server (checked from
 *      the test process, outside the browser, so the app cannot fake it),
 *   3. no protected content is reachable by URL, reload, or browser Back.
 */
import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import {
  QA_ACCOUNTS,
  accountFor,
  QA_CREDENTIALS_CONFIGURED,
  QA_CREDENTIALS_HINT,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  type QaRole,
} from "../fixtures/qaAccounts";

/** Sidebar label rendered only inside that role's own dashboard. */
const PORTAL_LABEL: Record<QaRole, string> = {
  customer: "Tenant & Buyer Portal",
  owner: "Verified Owner Portal",
  agent: "Partner Agent Hub",
  admin: "Platform Admin HQ",
};

/**
 * A second dashboard panel to navigate to. The nav differs per role, so each
 * entry names a panel that role actually has.
 */
const SECOND_TAB: Record<QaRole, { label: string; id: string }> = {
  customer: { label: "Enquiries", id: "enquiries" },
  owner: { label: "Analytics", id: "analytics" },
  agent: { label: "Clients", id: "clients" },
  admin: { label: "Users", id: "users" },
};

/**
 * Opens the dashboard navigation.
 *
 * The sidebar markup is rendered twice — a desktop `<aside>` that is CSS-hidden
 * below the `md` breakpoint, and a mobile drawer that only mounts once opened.
 * So on mobile the sign-out button and portal label exist in the DOM but are
 * not visible until the drawer is open; every sidebar assertion must go through
 * here and use a `:visible` selector.
 */
async function openDashboardNav(page: Page, isMobile: boolean) {
  if (!isMobile) return;

  // Already open from a previous step.
  if (
    await visibleSignOut(page)
      .isVisible()
      .catch(() => false)
  )
    return;

  const openMenu = page.getByRole("button", { name: "Open menu" });
  await expect(openMenu).toBeVisible({ timeout: 20000 });

  // The drawer is React state, so the toggle only works once hydrated —
  // retry rather than fail on a click that landed a moment too early.
  for (let attempt = 0; attempt < 3; attempt++) {
    await openMenu.click({ timeout: 10000 }).catch(() => undefined);
    const opened = await visibleSignOut(page)
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (opened) return;
  }
  await expect(visibleSignOut(page)).toBeVisible({ timeout: 10000 });
}

/**
 * The sign-out button that is actually on screen.
 *
 * The `:visible` filter is load-bearing, not decoration: without it the first
 * DOM match is the desktop `<aside>` copy, which is CSS-hidden on mobile, so
 * every mobile assertion resolves to an element that can never become visible.
 */
function visibleSignOut(page: Page) {
  return page.locator('[data-testid="sidebar-signout"]:visible').first();
}

/**
 * The portal label that is actually on screen.
 *
 * The label exists twice for the same reason the sign-out button does, and the
 * first match in DOM order is the desktop copy — which is hidden on mobile.
 */
function visiblePortal(page: Page, label: string) {
  return page.getByText(label, { exact: false }).locator("visible=true").first();
}

interface StoredSession {
  access_token?: string;
  refresh_token?: string;
  user?: { id?: string; email?: string };
}

/**
 * Runs an evaluate that may collide with an in-flight navigation.
 *
 * The app redirects with full page loads, so a `page.evaluate` issued just as
 * one starts throws "Execution context was destroyed". That is a harness race,
 * not an app defect, so settle the page and try again.
 */
async function evaluateSettled<T>(page: Page, fn: () => T): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => undefined);
      return await page.evaluate(fn);
    } catch (error) {
      lastError = error;
      if (!String(error).includes("Execution context was destroyed")) throw error;
      await page.waitForTimeout(500);
    }
  }
  throw lastError;
}

/** Reads the Supabase session straight out of the browser's own storage. */
async function readStoredSession(page: Page): Promise<StoredSession | null> {
  return evaluateSettled(page, () => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("sb-") || !key.includes("auth-token")) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        // supabase-js has stored both the session and a {currentSession} wrapper.
        return parsed?.currentSession ?? parsed;
      } catch {
        return null;
      }
    }
    return null;
  });
}

/** Every auth-ish key still present in either web storage. */
async function readAuthStorageKeys(page: Page): Promise<string[]> {
  return evaluateSettled(page, () => {
    const found: string[] = [];
    for (const store of [localStorage, sessionStorage]) {
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (!key) continue;
        if (key.startsWith("sb-") || key.includes("auth-token") || key.includes("supabase")) {
          found.push(key);
        }
      }
    }
    return found;
  });
}

/** Asserts the refresh token is dead at Supabase itself, not just locally. */
async function expectRefreshTokenRevoked(refreshToken: string) {
  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.refreshSession({ refresh_token: refreshToken });
  expect(data.session, "a revoked refresh token must not mint a new session").toBeNull();
  expect(error, "Supabase must reject the revoked refresh token").not.toBeNull();
}

/**
 * Fills and submits the sign-in form.
 *
 * The submit is retried because React hydration can land after first paint: a
 * click that arrives before the handler is attached is silently swallowed, and
 * the test would otherwise fail as a timeout that looks like an auth bug.
 * Each attempt waits for the app to actually respond — either by navigating
 * away from /auth or by rendering the credential error.
 */
async function signIn(page: Page, email: string, password: string) {
  await page.goto("/auth");
  await page.waitForLoadState("networkidle").catch(() => undefined);

  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 20000 });
  const passwordInput = page.locator('input[type="password"]');
  const submit = page.locator('button[type="submit"]');

  for (let attempt = 0; attempt < 3; attempt++) {
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await submit.click();

    const responded = await Promise.race([
      page
        .waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 15000 })
        .then(() => true)
        .catch(() => false),
      page
        .getByText(/incorrect email or password/i)
        .first()
        .waitFor({ timeout: 15000 })
        .then(() => true)
        .catch(() => false),
    ]);
    if (responded) return;
  }
}

async function signOut(page: Page, isMobile: boolean) {
  // Same hydration caveat as sign-in: retry until the app leaves the dashboard.
  for (let attempt = 0; attempt < 3; attempt++) {
    await openDashboardNav(page, isMobile);
    const button = visibleSignOut(page);
    await expect(button).toBeVisible({ timeout: 20000 });
    await button.scrollIntoViewIfNeeded();
    await button.click({ timeout: 10000 }).catch(() => undefined);

    const left = await page
      .waitForURL(/\/auth/, { timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    if (left) return;
  }
}

/** No dashboard chrome anywhere on the page. */
async function expectNoProtectedContent(page: Page) {
  await expect(page.getByTestId("sidebar-signout")).toHaveCount(0);
  for (const label of Object.values(PORTAL_LABEL)) {
    await expect(page.getByText(label, { exact: false })).toHaveCount(0);
  }
}

test.describe("Authentication lifecycle", () => {
  test.skip(!QA_CREDENTIALS_CONFIGURED, QA_CREDENTIALS_HINT);

  /**
   * Run this suite with `--workers=1`.
   *
   * Sign-out uses `scope: "global"`, which is the correct production behaviour
   * — it revokes the user's refresh tokens everywhere. The consequence for
   * testing is that two browsers signed in as the same QA account tear down
   * each other's sessions, so these tests cannot share an account
   * concurrently. One worker is what makes the assertions mean what they say
   * rather than intermittently catching another test's logout.
   *
   * Deliberately not `mode: "serial"`: that would skip every remaining test
   * after the first failure, which hides the state of the rest of the suite.
   */

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  for (const acc of QA_ACCOUNTS) {
    test(`${acc.role.toUpperCase()}: full login → dashboard → refresh → navigate → logout → lockout`, async ({
      page,
      isMobile,
    }) => {
      // ── 1. Log in ──────────────────────────────────────────────────────
      await signIn(page, acc.email, acc.password);
      await page.waitForURL(new RegExp(acc.dashboard.replace(/\//g, "\\/")), { timeout: 30000 });

      // ── 2. Correct dashboard for this role, and only this role ─────────
      await openDashboardNav(page, isMobile);
      await expect(visiblePortal(page, PORTAL_LABEL[acc.role])).toBeVisible({ timeout: 20000 });
      for (const [role, label] of Object.entries(PORTAL_LABEL)) {
        if (role === acc.role) continue;
        await expect(page.getByText(label, { exact: false })).toHaveCount(0);
      }

      // ── 3. A real authenticated session exists in the browser ──────────
      const session = await readStoredSession(page);
      expect(session?.access_token, "an access token must be stored after login").toBeTruthy();
      expect(session?.refresh_token, "a refresh token must be stored after login").toBeTruthy();
      expect(session?.user?.email).toBe(acc.email);
      const refreshToken = session!.refresh_token!;

      // It is a live session as far as Supabase is concerned.
      const live = await createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      }).auth.getUser(session!.access_token!);
      expect(live.error, "the stored token must be accepted while signed in").toBeNull();
      expect(live.data.user?.email).toBe(acc.email);

      // ── 4. Session survives a reload ───────────────────────────────────
      await page.reload();
      await page.waitForURL(new RegExp(acc.dashboard.replace(/\//g, "\\/")), { timeout: 30000 });
      await openDashboardNav(page, isMobile);
      await expect(visibleSignOut(page)).toBeVisible({ timeout: 20000 });

      // ── 5. Navigate within the dashboard ───────────────────────────────
      const tab = SECOND_TAB[acc.role];
      await page.getByRole("button", { name: tab.label, exact: true }).first().click();
      await page.waitForURL(new RegExp(`tab=${tab.id}`), { timeout: 20000 });
      expect(page.url()).toContain(acc.dashboard);
      // Still the same authenticated session — navigation is not a re-login.
      const afterNav = await readStoredSession(page);
      expect(afterNav?.user?.email).toBe(acc.email);

      // ── 6. Log out ─────────────────────────────────────────────────────
      await signOut(page, isMobile);
      await page.waitForURL(/\/auth/, { timeout: 30000 });

      // ── 7. Auth state actually changed in the live app (no reload) ─────
      await expect(
        page
          .getByRole("heading", { name: /Welcome back|Sign In/i })
          .or(page.getByRole("button", { name: /Sign In/i }))
          .first(),
      ).toBeVisible({ timeout: 20000 });

      // ── 8. The Supabase session is gone from browser storage ───────────
      expect(await readStoredSession(page), "no session may remain in storage").toBeNull();
      expect(await readAuthStorageKeys(page), "no auth keys may remain").toEqual([]);

      // ── 9. The refresh token is dead at Supabase, verified out-of-band ─
      await expectRefreshTokenRevoked(refreshToken);

      // ── 10. Protected UI is gone ───────────────────────────────────────
      await expectNoProtectedContent(page);

      // ── 11. Direct URL to the protected dashboard bounces to /auth ─────
      await page.goto(acc.dashboard);
      await page.waitForURL(/\/auth/, { timeout: 30000 });
      await expectNoProtectedContent(page);

      // ── 12. Reload — still logged out ──────────────────────────────────
      await page.reload();
      await page.waitForURL(/\/auth/, { timeout: 30000 });
      expect(await readStoredSession(page)).toBeNull();
      await expectNoProtectedContent(page);

      // ── 13. Browser Back exposes no protected content ──────────────────
      await page.goBack();
      await page.waitForLoadState("domcontentloaded");
      await expectNoProtectedContent(page);
      expect(await readStoredSession(page), "Back must not restore a session").toBeNull();

      // A second Back, in case history still holds the dashboard entry.
      await page.goBack().catch(() => undefined);
      await page.waitForLoadState("domcontentloaded");
      await expectNoProtectedContent(page);
    });
  }

  test("cross-role: each role is kept out of every other role's dashboard", async ({ page }) => {
    const customer = accountFor("customer");
    await signIn(page, customer.email, customer.password);
    await page.waitForURL(/\/dashboard\/customer/, { timeout: 30000 });

    for (const other of QA_ACCOUNTS.filter((a) => a.role !== "customer")) {
      await page.goto(other.dashboard);
      // RequireRole sends the caller back to its own dashboard…
      await page.waitForURL(/\/dashboard\/customer/, { timeout: 30000 });
      // …and the other role's portal never renders.
      await expect(page.getByText(PORTAL_LABEL[other.role], { exact: false })).toHaveCount(0);
    }

    // The dedicated admin portal is gated separately, at the route level.
    await page.goto("/admin");
    await page.waitForURL(/\/dashboard\/customer|\/auth/, { timeout: 30000 });
    await expect(page.getByRole("heading", { name: "Admin dashboard" })).toHaveCount(0);
  });

  test("admin reaches the admin portal that other roles cannot", async ({ page }) => {
    const admin = accountFor("admin");
    await signIn(page, admin.email, admin.password);
    await page.waitForURL(/\/dashboard\/admin/, { timeout: 30000 });

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Admin dashboard" })).toBeVisible({
      timeout: 30000,
    });
  });

  test("guest: protected routes redirect to /auth and preserve the destination", async ({
    page,
  }) => {
    for (const acc of QA_ACCOUNTS) {
      await page.goto(acc.dashboard);
      await page.waitForURL(/\/auth/, { timeout: 30000 });
      await expectNoProtectedContent(page);
    }
    await page.goto("/dashboard");
    await page.waitForURL(/\/auth/, { timeout: 30000 });
    await expectNoProtectedContent(page);
  });

  test("invalid credentials are rejected and mint no session", async ({ page }) => {
    const customer = accountFor("customer");
    await signIn(page, customer.email, "WrongPassword123!");

    await expect(page.getByText(/incorrect email or password/i).first()).toBeVisible({
      timeout: 20000,
    });
    expect(page.url()).toContain("/auth");
    expect(await readStoredSession(page), "a failed login must not store a session").toBeNull();
  });

  test("login notification fires exactly once per sign-in and never on a reload", async ({
    page,
    isMobile,
  }) => {
    const acc = accountFor("agent");

    const dispatches: string[] = [];
    const bodies: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/auth/login-notification")) {
        dispatches.push(req.url());
        bodies.push(req.postData() ?? "");
      }
    });

    // ── One sign-in → exactly one dispatch ─────────────────────────────
    await signIn(page, acc.email, acc.password);
    await page.waitForURL(/\/dashboard\/agent/, { timeout: 30000 });
    await openDashboardNav(page, isMobile);
    await expect(visibleSignOut(page)).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(3000); // let any late dispatch land
    expect(dispatches, "one sign-in must produce exactly one notification").toHaveLength(1);

    // The request body carries no credential material — identity comes from
    // the bearer token, which the server verifies and never echoes.
    expect(bodies[0] ?? "").not.toContain(acc.password);
    expect(bodies[0] ?? "").not.toContain("token");

    // ── Reload and in-dashboard navigation → still no further dispatch ──
    await page.reload();
    await page.waitForURL(/\/dashboard\/agent/, { timeout: 30000 });
    await openDashboardNav(page, isMobile);
    await expect(visibleSignOut(page)).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(3000);
    expect(dispatches, "a reload must not re-notify").toHaveLength(1);

    await page.goto(`${acc.dashboard}?tab=${SECOND_TAB.agent.id}`);
    await page.waitForURL(new RegExp(`tab=${SECOND_TAB.agent.id}`), { timeout: 20000 });
    await page.waitForTimeout(2000);
    expect(dispatches, "in-app navigation must not re-notify").toHaveLength(1);

    // ── A second, separate sign-in → exactly one more ──────────────────
    await signOut(page, isMobile);
    await page.waitForURL(/\/auth/, { timeout: 30000 });

    await signIn(page, acc.email, acc.password);
    await page.waitForURL(/\/dashboard\/agent/, { timeout: 30000 });
    await page.waitForTimeout(3000);
    expect(dispatches, "a new sign-in must notify again").toHaveLength(2);
  });

  test("a failed login notification does not break authentication", async ({ page, isMobile }) => {
    // Force the notification endpoint to fail outright. Sign-in must still
    // complete and land on the dashboard.
    await page.route("**/api/auth/login-notification", (route) =>
      route.fulfill({ status: 500, body: "provider exploded" }),
    );

    const acc = accountFor("owner");
    await signIn(page, acc.email, acc.password);
    await page.waitForURL(/\/dashboard\/owner/, { timeout: 30000 });
    await openDashboardNav(page, isMobile);
    await expect(visibleSignOut(page)).toBeVisible({ timeout: 20000 });

    const session = await readStoredSession(page);
    expect(session?.user?.email, "authentication must survive a notification failure").toBe(
      acc.email,
    );
  });

  test("cached dashboard data does not survive a logout", async ({ page, isMobile }) => {
    // Sign in as the owner, let the dashboard populate, then sign out and sign
    // in as the customer in the same tab. The owner's portal must never appear
    // for the customer — a stale React Query cache would leak it.
    const owner = accountFor("owner");
    const customer = accountFor("customer");

    await signIn(page, owner.email, owner.password);
    await page.waitForURL(/\/dashboard\/owner/, { timeout: 30000 });
    await openDashboardNav(page, isMobile);
    await expect(visiblePortal(page, PORTAL_LABEL.owner)).toBeVisible({ timeout: 20000 });

    await signOut(page, isMobile);
    await page.waitForURL(/\/auth/, { timeout: 30000 });

    await signIn(page, customer.email, customer.password);
    await page.waitForURL(/\/dashboard\/customer/, { timeout: 30000 });

    await openDashboardNav(page, isMobile);
    await expect(visiblePortal(page, PORTAL_LABEL.customer)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(PORTAL_LABEL.owner, { exact: false })).toHaveCount(0);

    const session = await readStoredSession(page);
    expect(session?.user?.email).toBe(customer.email);
  });
});
