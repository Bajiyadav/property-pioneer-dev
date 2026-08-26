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

describe("home search bar maps to the right catalogue mode", () => {
  const src = fs.readFileSync(
    path.join(process.cwd(), "src/modules/marketing/home/TabbedSearchBox.tsx"),
    "utf-8",
  );

  it("does not collapse listing types into a two-way choice", () => {
    // The old two-way ternary sent COMMERCIAL to listing=rent. The
    // simplified bar has no tabs or type selector at all, so this
    // class of bug is structurally impossible — but the guard stays.
    expect(src).not.toMatch(/listing:\s*activeTab === "buy" \? "sale" : "rent"/);
  });

  it("defaults listing to neutral so results page shows all types", () => {
    // The simplified bar has no Rent/Buy tab and no Property Type dropdown.
    // Quick-action cards in HeroSection supply listing/type independently.
    expect(src).toContain('listing: ""');
  });

  it("does not embed property-type or budget selectors", () => {
    // Property Type and Budget were removed from the homepage bar.
    // They remain available on the results page (SearchUI sidebar).
    expect(src).not.toContain("PROPERTY_TYPES");
    expect(src).not.toContain("BUDGET_BANDS");
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
