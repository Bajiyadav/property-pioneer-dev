import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * One back control, applied consistently.
 *
 * Eighteen files had grown their own left-arrow affordance, each deciding where
 * "back" went. The risks that matter are structural, so they are asserted at
 * source rather than through a rendered tree:
 *
 *   - raw `window.history.back()` skips the router, and on a deep-linked or
 *     refreshed page it walks the user out of the application entirely
 *   - an icon-only button with no accessible name is unusable by screen reader
 *   - a touch target under 44px fails the mobile guidance
 */
const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf-8");

/**
 * Comments must be stripped before asserting on code. BackLink's own header
 * explains WHY it avoids `window.history.back()`, and an unstripped scan matches
 * that explanation and fails on the very file that gets it right.
 */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
const BACKLINK = "src/shared/components/navigation/BackLink.tsx";

describe("shared back control", () => {
  const src = read(BACKLINK);

  it("uses the router, never the raw History API", () => {
    expect(src).toContain("router.history.back()");
    expect(code(BACKLINK), "window.history bypasses the router's location state").not.toContain(
      "window.history",
    );
  });

  it("distinguishes 'has history' from 'opened directly'", () => {
    // Without this the fallback can never be reached, and a deep-linked page
    // sends the user off-site.
    expect(src).toContain("useCanGoBack");
  });

  it("requires a fallback destination rather than defaulting to one", () => {
    // Optional would mean an unconsidered default, which is how users land
    // somewhere unrelated.
    expect(src).toMatch(/fallbackTo:\s*string;/);
    expect(src).not.toMatch(/fallbackTo\?:/);
  });

  it("always carries an accessible name", () => {
    expect(src).toContain('ariaLabel ?? (label ? `Go back to ${label}` : "Go back")');
    expect(src).toContain("aria-label={accessibleName}");
  });

  it("meets the 44px touch target and shows a focus ring", () => {
    expect(src).toContain("min-h-[44px]");
    expect(src).toContain("focus-visible:ring-2");
  });

  it("hides the decorative icon from assistive tech", () => {
    expect(src).toContain('aria-hidden="true"');
  });

  it("renders a real link when there is no history", () => {
    // A button would not be openable in a new tab or keyboard-navigable as a link.
    expect(src).toMatch(/<Link\s/);
  });
});

describe("applied to the pages that need it", () => {
  const cases: Array<[string, string]> = [
    ["src/modules/owner/components/SubmissionStatus.tsx", "/dashboard/owner"],
    ["src/modules/owner/components/PromoteListing.tsx", "/list-property/submitted/$id"],
  ];

  for (const [file, fallback] of cases) {
    it(`${file.split("/").pop()} uses the shared control with a considered fallback`, () => {
      const src = read(file);
      expect(src).toContain("BackLink");
      expect(src, "fallback should be the real parent page").toContain(fallback);
    });
  }

  it("is not added to the home page, which has no previous context", () => {
    expect(read("src/routes/index.tsx")).not.toContain("BackLink");
  });
});
