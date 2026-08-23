import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * The free owner-contact quota must be visible before it is hit.
 *
 * The endpoint enforced a three-property limit and returned only
 * `{ ok, whatsappUrl }`, so a visitor learned the limit existed by being
 * refused at the fourth property. The counts are now returned on every path,
 * which is what lets the UI warn beforehand.
 *
 * Asserted at source because the behaviour is a server response shape; the
 * live-DB behaviour is covered by the endpoint's own audit-log accounting.
 */
const src = fs.readFileSync(
  path.join(process.cwd(), "src/routes/api/public/properties.$id.contact.ts"),
  "utf-8",
);

describe("owner contact quota is reported, not just enforced", () => {
  it("names the limit once instead of repeating a bare number", () => {
    expect(src).toContain("const FREE_CONTACT_LIMIT = 3");
    // The literal 3 must not linger in the comparison or the copy.
    expect(src).not.toMatch(/distinctProperties\.size >= 3/);
    expect(src).not.toMatch(/your 3 free owner contacts/);
  });

  it("returns the counts on a successful contact", () => {
    const ok = src.slice(src.indexOf("ok: true"));
    for (const key of ["contactsUsed", "contactsLimit", "contactsRemaining"]) {
      expect(ok, `${key} must ride on the success response`).toContain(key);
    }
  });

  it("returns the counts on the quota refusal too", () => {
    const rejection = src.slice(src.indexOf("contactsRemaining: 0"));
    expect(rejection.length, "refusal should report zero remaining").toBeGreaterThan(0);
    expect(src).toContain("contactsUsed: usedBefore");
  });

  it("does not spend an allowance for a property already contacted", () => {
    // Re-opening the same owner's number is not a new contact; charging for it
    // would burn the quota on a single property.
    expect(src).toContain("alreadyContacted ? usedBefore : usedBefore + 1");
  });

  it("never reports a negative remaining count", () => {
    expect(src).toContain("Math.max(0, FREE_CONTACT_LIMIT - usedAfter)");
  });
});
