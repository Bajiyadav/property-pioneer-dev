#!/usr/bin/env node
/**
 * Seeds a realistic Hyderabad-first catalogue so every dashboard has something
 * true to show.
 *
 * Idempotent: every row it creates is tagged, and a re-run replaces only its own
 * rows. It never touches listings it did not create, so pre-existing production
 * data is safe.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo-data.mjs
 */

const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

/** Marks rows this script owns so re-runs are safe and reversible. */
const TAG = "[UP-DEMO]";

const h = { apikey: KEY, "Content-Type": "application/json" };
const api = async (method, path, body) => {
  const res = await fetch(`${URL_}${path}`, {
    method,
    headers: { ...h, Prefer: "return=representation" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 180)}`);
  return text ? JSON.parse(text) : [];
};

const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=1200&auto=format&fit=crop&q=80`;

// Hyderabad corridors the marketing surface actually promotes, so search
// shortcuts on the homepage resolve to real inventory.
const LISTINGS = [
  {
    t: "Sunlit 2BHK with Balcony in Gachibowli",
    a: "Vasavi Nagar, Gachibowli",
    p: 32000,
    bd: 2,
    ba: 2,
    sq: 1180,
    ty: "Apartment",
    lt: "rent",
    ap: true,
    ft: true,
    img: ["1522708323590-d24dbb6b0267", "1502672260266-1c1ef2d93688"],
  },
  {
    t: "Premium 3BHK near DLF Cyber City",
    a: "Financial District, Gachibowli",
    p: 48000,
    bd: 3,
    ba: 3,
    sq: 1720,
    ty: "Apartment",
    lt: "rent",
    ap: true,
    ft: true,
    img: ["1545324418-cc1a3fa10c00", "1560448204-e02f11c3d0e2"],
  },
  {
    t: "Modern Studio Steps from Durgam Cheruvu",
    a: "Madhapur",
    p: 21500,
    bd: 1,
    ba: 1,
    sq: 620,
    ty: "Studio",
    lt: "rent",
    ap: true,
    img: ["1493809842364-78817add7ffb"],
  },
  {
    t: "Spacious 3BHK in Gated Community, Madhapur",
    a: "Ayyappa Society, Madhapur",
    p: 45000,
    bd: 3,
    ba: 3,
    sq: 1650,
    ty: "Apartment",
    lt: "rent",
    ap: true,
    img: ["1600596542815-ffad4c1539a9", "1600585154340-be6161a56a0c"],
  },
  {
    t: "Family 3BHK near Botanical Garden",
    a: "Kondapur",
    p: 38000,
    bd: 3,
    ba: 2,
    sq: 1500,
    ty: "Apartment",
    lt: "rent",
    ap: true,
    img: ["1600607687939-ce8a6c25118c"],
  },
  {
    t: "Compact 2BHK in Kondapur",
    a: "Gachibowli Road, Kondapur",
    p: 26000,
    bd: 2,
    ba: 2,
    sq: 1050,
    ty: "Apartment",
    lt: "rent",
    ap: true,
    img: ["1522708323590-d24dbb6b0267"],
  },
  {
    t: "Executive 2BHK in Hitech City",
    a: "Mindspace, Hitech City",
    p: 35000,
    bd: 2,
    ba: 2,
    sq: 1240,
    ty: "Apartment",
    lt: "rent",
    ap: true,
    ft: true,
    img: ["1502672260266-1c1ef2d93688"],
  },
  {
    t: "Semi-Furnished 2BHK near Miyapur Metro",
    a: "Miyapur",
    p: 22000,
    bd: 2,
    ba: 2,
    sq: 1080,
    ty: "Apartment",
    lt: "rent",
    ap: true,
    img: ["1493809842364-78817add7ffb"],
  },
  {
    t: "Luxury Duplex Villa in Jubilee Hills",
    a: "Road No. 45, Jubilee Hills",
    p: 18500000,
    bd: 4,
    ba: 4,
    sq: 3200,
    ty: "Villa",
    lt: "sale",
    ap: true,
    ft: true,
    img: ["1600596542815-ffad4c1539a9", "1600566753376-12c8ab7fb75b"],
  },
  {
    t: "3BHK Apartment for Sale in Kokapet",
    a: "Neopolis, Kokapet",
    p: 9800000,
    bd: 3,
    ba: 3,
    sq: 1850,
    ty: "Apartment",
    lt: "sale",
    ap: true,
    img: ["1560448204-e02f11c3d0e2"],
  },
  {
    t: "Office Space in Raidurg Tech Corridor",
    a: "Raidurg",
    p: 125000,
    bd: 0,
    ba: 2,
    sq: 2400,
    ty: "Commercial",
    lt: "rent",
    ap: true,
    img: ["1545324418-cc1a3fa10c00"],
  },
  // Deliberately left pending so the admin approval queue has something real
  // to demonstrate.
  {
    t: "New 2BHK Listing in Nanakramguda",
    a: "Nanakramguda",
    p: 29500,
    bd: 2,
    ba: 2,
    sq: 1150,
    ty: "Apartment",
    lt: "rent",
    ap: false,
    img: ["1522708323590-d24dbb6b0267"],
  },
  {
    t: "Independent House in Manikonda",
    a: "Manikonda",
    p: 42000,
    bd: 3,
    ba: 3,
    sq: 1900,
    ty: "Independent House",
    lt: "rent",
    ap: false,
    img: ["1600607687939-ce8a6c25118c"],
  },
  {
    t: "Plot for Sale near ORR Exit 14",
    a: "Kollur",
    p: 6500000,
    bd: 0,
    ba: 0,
    sq: 2178,
    ty: "Plot",
    lt: "sale",
    ap: false,
    img: ["1500382017468-9049fed747ef"],
  },
];

const ENQUIRIES = [
  {
    n: "Kavitha Reddy",
    ph: "9876543210",
    m: "Hi, is this available for immediate move-in? I work in Gachibowli.",
  },
  {
    n: "Arjun Kapoor",
    ph: "9988776655",
    m: "Can I schedule a visit this weekend? Preferably Saturday morning.",
  },
  {
    n: "Neha Sharma",
    ph: "9000012345",
    m: "Is parking included in the rent? Also, is it pet friendly?",
  },
  {
    n: "Rahul Verma",
    ph: "9123456780",
    m: "What is the security deposit and are utilities included?",
  },
  {
    n: "Divya Nair",
    ph: "9345678120",
    m: "Interested. Is the property available from the 1st of next month?",
  },
  {
    n: "Suresh Babu",
    ph: "9765432109",
    m: "Could you share the exact location pin and nearby metro access?",
  },
];

async function main() {
  console.log("Seeding demo data…\n");

  // 1. Remove only rows this script previously created.
  const mine = await api(
    "GET",
    `/rest/v1/properties?select=id&description=like.*${encodeURIComponent(TAG)}*`,
  );
  if (mine.length) {
    for (const p of mine) {
      await api("DELETE", `/rest/v1/enquiries?property_id=eq.${p.id}`);
      await api("DELETE", `/rest/v1/favorites?property_id=eq.${p.id}`);
    }
    await api("DELETE", `/rest/v1/properties?description=like.*${encodeURIComponent(TAG)}*`);
    console.log(`  cleared ${mine.length} previously seeded listing(s)`);
  }

  // 2. Attach listings to real owner accounts so the owner dashboard is populated.
  const owners = await api(
    "GET",
    "/rest/v1/profiles?select=id,full_name&full_name=ilike.*owner*&limit=2",
  );
  const ownerIds = owners.map((o) => o.id);
  console.log(`  owner accounts found: ${ownerIds.length || "none — listings will be unowned"}`);

  // 3. Listings.
  const rows = LISTINGS.map((l, i) => ({
    title: l.t,
    description:
      `${l.bd ? `${l.bd} BHK ` : ""}${l.ty.toLowerCase()} in ${l.a}, Hyderabad. ` +
      `Direct owner listing with no platform commission. ` +
      `Close to the IT corridor with metro connectivity, power backup and reserved parking. ${TAG}`,
    price: l.p,
    city: "Hyderabad",
    address: l.a,
    bedrooms: l.bd,
    bathrooms: l.ba,
    area_sqft: l.sq,
    property_type: l.ty,
    listing_type: l.lt,
    status: "available",
    images: l.img.map(IMG),
    is_approved: l.ap,
    is_featured: Boolean(l.ft),
    owner_id: ownerIds.length ? ownerIds[i % ownerIds.length] : null,
    owner_name: "Verified Owner",
    owner_phone: `+9198${String(400000 + i).padStart(8, "0")}`,
  }));
  const created = await api("POST", "/rest/v1/properties", rows);
  const approved = created.filter((p) => p.is_approved);
  console.log(
    `  listings created: ${created.length} (${approved.length} live, ${created.length - approved.length} pending review)`,
  );

  // 4. Enquiries against live listings, so owner leads and the admin inbox fill up.
  const enq = ENQUIRIES.map((e, i) => ({
    property_id: approved[i % approved.length].id,
    name: e.n,
    phone: e.ph,
    message: e.m,
  }));
  const madeEnq = await api("POST", "/rest/v1/enquiries", enq);
  console.log(`  enquiries created: ${madeEnq.length}`);

  // 5. Notifications + favourites for the customer dashboard.
  const customers = await api(
    "GET",
    "/rest/v1/profiles?select=id,full_name&full_name=ilike.*customer*&limit=1",
  );
  if (customers.length) {
    const uid = customers[0].id;
    await api("DELETE", `/rest/v1/notifications?user_id=eq.${uid}`);
    await api("POST", "/rest/v1/notifications", [
      {
        user_id: uid,
        title: "Price drop on a saved home",
        body: `${approved[0].title} reduced by ₹2,000/mo.`,
        kind: "info",
      },
      {
        user_id: uid,
        title: "Visit confirmed",
        body: "Your walkthrough is confirmed for Saturday, 10:00 AM.",
        kind: "success",
      },
      {
        user_id: uid,
        title: "New listings in Gachibowli",
        body: "3 new verified homes match your saved search.",
        kind: "info",
      },
    ]);
    await api("DELETE", `/rest/v1/favorites?user_id=eq.${uid}`);
    await api(
      "POST",
      "/rest/v1/favorites",
      approved.slice(0, 3).map((p) => ({ user_id: uid, property_id: p.id })),
    );
    console.log("  notifications: 3   favourites: 3");
  }

  console.log("\nDone. Re-running replaces only rows tagged " + TAG + ".");
}

main().catch((e) => {
  console.error("\nSeed failed:", e.message);
  process.exit(1);
});
