import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const NAV = read("src/modules/owner/components/ListingWizard/MobileListingNav.tsx");
const DESKTOP = read("src/modules/owner/components/ListingWizard/ListingWizard.tsx");

describe("wizard mobile action bar — UX polish", () => {
  it("respects the device safe area so the sticky bar clears the home indicator", () => {
    expect(NAV).toMatch(/env\(safe-area-inset-bottom/);
  });
  it("keeps 48px touch targets for Back / Continue / Submit", () => {
    expect((NAV.match(/min-h-\[48px\]/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
  it("submit label is honest + consistent with desktop (moderation, not 'publish now')", () => {
    expect(NAV).toMatch(/Submit for Moderation/);
    expect(NAV).not.toMatch(/Publish Listing Now|Publishing\.\.\./);
    // Desktop footer uses the same accurate wording.
    expect(DESKTOP).toMatch(/Submit for Moderation/);
  });
  it("Continue stays the primary next-step action; submit only on the last step", () => {
    expect(NAV).toMatch(/Continue/);
    expect(NAV).toMatch(/isLastStep \?/);
  });
  it("prevents double submission via the isSaving guard", () => {
    expect(NAV).toMatch(/disabled=\{isSaving\}/);
    expect(DESKTOP).toMatch(/if \(isSaving\) return;/);
  });
});
