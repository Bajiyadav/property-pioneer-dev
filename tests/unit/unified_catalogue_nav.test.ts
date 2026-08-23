import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Rent, Buy and Commercial are three modes of ONE catalogue, not three
 * destinations.
 *
 * They previously led to /properties, /buy and /commercial — three URLs that
 * felt like separate sections of the site. /buy and /commercial remain as SEO
 * landing pages (they carry unique editorial content and smoke.spec.ts asserts
 * they render), but the header and footer now send someone who wants to BROWSE
 * into the canonical catalogue with the mode already applied.
 */
const root = fs.readFileSync(path.join(process.cwd(), "src/routes/__root.tsx"), "utf-8");
const code = root.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/^\s*\/\/.*$/gm, "");

describe("unified property catalogue navigation", () => {
  it("sends browse intent to the canonical catalogue, not to section pages", () => {
    // A bare `to="/buy"` in nav means the user left the catalogue.
    expect(code, "header/footer should not navigate to /buy").not.toMatch(/to="\/buy"/);
    expect(code, "header/footer should not navigate to /commercial").not.toMatch(
      /to="\/commercial"/,
    );
  });

  it("preselects the mode so each entry point is distinct", () => {
    // Without this, Rent and Buy both open the same unfiltered catalogue.
    expect(code).toMatch(/search=\{\{\s*listing:\s*"sale"\s*\}\}/);
    expect(code).toMatch(/search=\{\{\s*type:\s*"commercial"\s*\}\}/);
    expect(code, "Rent mode must still be applied").toMatch(/listing:\s*"rent"/);
  });

  it("uses the filter params the catalogue already validates", () => {
    // Reuse, not a new parameter vocabulary.
    const cat = fs.readFileSync(
      path.join(process.cwd(), "src/routes/properties.index.tsx"),
      "utf-8",
    );
    expect(cat).toContain("listing: search.listing");
    expect(cat).toContain("type: search.type");
  });

  it("keeps the SEO landing pages rather than deleting indexed URLs", () => {
    for (const f of ["src/routes/buy.index.tsx", "src/routes/commercial.index.tsx"]) {
      expect(fs.existsSync(path.join(process.cwd(), f)), `${f} must survive`).toBe(true);
    }
  });

  it("carries no NEW badges in the primary navigation", () => {
    // The platform is new in its entirety; the badges were visual noise.
    const nav = code.slice(0, code.indexOf("</header>"));
    expect(nav).not.toMatch(/>\s*New\s*</);
  });
});

describe("home search tabs map to the right catalogue mode", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "src/modules/marketing/home/TabbedSearchBox.tsx"),
    "utf-8",
  );

  it("does not collapse three tabs into a two-way choice", () => {
    // `activeTab === "buy" ? "sale" : "rent"` sent COMMERCIAL to listing=rent,
    // so that tab searched rentals and applied no commercial filter at all.
    expect(src).not.toMatch(/listing:\s*activeTab === "buy" \? "sale" : "rent"/);
  });

  it("treats commercial as a property type, not a listing type", () => {
    // A commercial unit can be for rent OR for sale, so it must not pin listing.
    expect(src).toContain('if (activeTab === "commercial") search.type = "commercial"');
  });

  it("still maps rent and buy to their listing values", () => {
    expect(src).toMatch(/activeTab === "buy" \? "sale"/);
    expect(src).toMatch(/activeTab === "rent" \? "rent"/);
  });
});

describe("property detail keeps the visitor's search context", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "src/modules/property/pages/PropertyDetailPage.tsx"),
    "utf-8",
  );
  const code = src.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  it("uses the shared control instead of a hard link to the catalogue", () => {
    // A bare <Link to="/properties"> discards listing/city/price filters.
    expect(code).toContain("BackLink");
    expect(code).not.toMatch(/<Link\s+to="\/properties"\s+className="group flex h-10 w-10/);
  });

  it("falls back to the catalogue when opened directly", () => {
    expect(code).toContain('fallbackTo="/properties"');
  });
});
