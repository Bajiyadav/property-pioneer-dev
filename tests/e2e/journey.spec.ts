import { test, expect } from "@playwright/test";

/**
 * The core Seedha Properties business flow, end to end against the real database:
 *
 *   owner listing created (unapproved)
 *     -> NOT publicly visible
 *     -> admin approves
 *     -> publicly visible in search and on its detail page
 *     -> customer submits an enquiry
 *     -> enquiry persisted against the right property
 *
 * Moderation is the product's central invariant: an unapproved listing must
 * never be reachable by the public. This is the test that proves it.
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to seed and assert database
 * state. Without them the suite skips rather than reporting a false pass.
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANON_KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
const SEARCH = "?q=&city=&listing=&minPrice=0&maxPrice=0&beds=0";
const MARKER = `E2E Journey ${Date.now()}`;

const configured = Boolean(SUPABASE_URL && SERVICE_KEY && ANON_KEY);
test.skip(!configured, "Supabase credentials not provided — cannot verify database state");

let propertyId = "";

/**
 * Supabase calls go through global fetch rather than Playwright's request
 * context: the `sb_secret_`/`sb_publishable_` keys are opaque strings, and the
 * request context was rewriting auth headers in a way PostgREST rejected.
 */
const admin = { apikey: SERVICE_KEY } as Record<string, string>;
const anon = { apikey: ANON_KEY } as Record<string, string>;

async function db(
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: unknown,
): Promise<{ status: number; json: <T = unknown>() => Promise<T>; text: () => Promise<string> }> {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await res.text();
  return {
    status: res.status,
    json: async <T>() => (raw ? (JSON.parse(raw) as T) : ([] as unknown as T)),
    text: async () => raw,
  };
}

test.beforeAll(async () => {
  const res = await db("POST", "/rest/v1/properties", admin, {
    title: MARKER,
    description: "Created by the automated production journey test.",
    price: 41000,
    city: "Hyderabad",
    address: "Journey Test Road, Gachibowli",
    bedrooms: 3,
    bathrooms: 2,
    area_sqft: 1400,
    property_type: "Apartment",
    listing_type: "rent",
    status: "available",
    images: [],
    is_approved: false, // the state an owner submission actually lands in
  });
  expect(res.status, await res.text()).toBe(201);
  propertyId = (await res.json<Array<{ id: string }>>())[0].id;
});

test.afterAll(async () => {
  if (!propertyId) return;
  await db("DELETE", `/rest/v1/enquiries?property_id=eq.${propertyId}`, admin);
  await db("DELETE", `/rest/v1/properties?id=eq.${propertyId}`, admin);
});

test.describe.configure({ mode: "serial" });

test.describe("business flow: listing → moderation → public → enquiry", () => {
  test("E2E-07 a new listing is created unapproved", async () => {
    const res = await db(
      "GET",
      `/rest/v1/properties?id=eq.${propertyId}&select=is_approved`,
      admin,
    );
    expect((await res.json<Array<{ is_approved: boolean }>>())[0].is_approved).toBe(false);
  });

  test("E2E-15 an unapproved listing is invisible to the public API", async () => {
    const res = await db("GET", `/rest/v1/properties?id=eq.${propertyId}&select=id`, anon);
    expect(await res.json(), "RLS must hide unapproved listings from anon").toEqual([]);
  });

  test("E2E-15b an unapproved listing is not reachable in the browser", async ({ page }) => {
    await page.goto(`/properties/${propertyId}${SEARCH}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).not.toContainText(MARKER);
  });

  test("E2E-05 an enquiry against an unapproved listing is refused", async ({ request }) => {
    const res = await request.post("/api/public/enquiries", {
      data: {
        propertyId,
        name: "Journey Probe",
        phone: "9876543210",
        message: "Enquiry against a listing that is not yet public.",
        elapsedMs: 9000,
      },
    });
    // The endpoint only accepts enquiries for approved listings.
    expect([404, 503]).toContain(res.status());
  });

  test("E2E-10 admin approval publishes the listing", async () => {
    const res = await db("PATCH", `/rest/v1/properties?id=eq.${propertyId}`, admin, {
      is_approved: true,
    });
    expect(res.status).toBe(200);
    expect((await res.json<Array<{ is_approved: boolean }>>())[0].is_approved).toBe(true);
  });

  test("E2E-11 an approved listing becomes publicly visible", async () => {
    const res = await db("GET", `/rest/v1/properties?id=eq.${propertyId}&select=id,title`, anon);
    const rows = await res.json<Array<{ title: string }>>();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe(MARKER);
  });

  test("E2E-03 the approved listing renders its detail page", async ({ page }) => {
    await page.goto(`/properties/${propertyId}${SEARCH}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(MARKER, { timeout: 30_000 });
    await expect(page.locator("body")).toContainText("₹");
  });

  test("E2E-05b a customer enquiry on an approved listing persists", async ({ request }) => {
    const res = await request.post("/api/public/enquiries", {
      data: {
        propertyId,
        name: "Journey Probe",
        phone: "9876543210",
        message: "Automated journey test enquiry — please ignore.",
        elapsedMs: 9000,
      },
    });
    expect(res.status(), await res.text()).toBe(201);

    const stored = await db(
      "GET",
      `/rest/v1/enquiries?property_id=eq.${propertyId}&select=name,phone,message`,
      admin,
    );
    const rows = await stored.json<Array<{ name: string }>>();
    expect(rows, "enquiry must be persisted against the right property").toHaveLength(1);
    expect(rows[0].name).toBe("Journey Probe");
  });

  test("E2E-10b admin rejection removes it from public view again", async () => {
    await db("PATCH", `/rest/v1/properties?id=eq.${propertyId}`, admin, { is_approved: false });
    const res = await db("GET", `/rest/v1/properties?id=eq.${propertyId}&select=id`, anon);
    expect(await res.json(), "rejection must revoke public visibility").toEqual([]);
  });

  test("E2E-24 rejection does not destroy the listing or its enquiries", async () => {
    const p = await db("GET", `/rest/v1/properties?id=eq.${propertyId}&select=id`, admin);
    expect(await p.json(), "the listing must survive rejection").toHaveLength(1);
    const e = await db("GET", `/rest/v1/enquiries?property_id=eq.${propertyId}&select=id`, admin);
    expect(await e.json(), "enquiries must survive rejection").toHaveLength(1);
  });
});
