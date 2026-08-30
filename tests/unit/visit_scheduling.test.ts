import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { visitRequestSchema, VISIT_SLOTS } from "@/modules/property/services/visitService";

/**
 * Site-visit booking — one path, and it tells the truth.
 *
 * Web had three live "schedule a visit" modals writing to three different
 * places, and two of them announced success unconditionally:
 *
 *   - interactions/ fired `void fetch(...).catch(() => {})` at an endpoint that
 *     only wrote an audit line, then showed a confirmation screen. No visit row
 *     was ever created.
 *   - tenant/ inserted `preferred_date` / `preferred_time_slot` into
 *     property_visits, which has neither column, `console.warn`ed the failure
 *     and reported success anyway — and sent a label like "Tomorrow" into a
 *     `date` column.
 *
 * Both failed silently, so an owner never saw a request the visitor had been
 * told was sent. These assert the end state: one service, real columns, and no
 * surface that can claim success without reading the result.
 */

const src = (rel: string) => readFileSync(join(process.cwd(), "src", rel), "utf8");

/** Comments stripped, so a note describing a removed bug cannot trip a check. */
const codeOf = (rel: string) =>
  src(rel)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

const VISIT_SURFACES = [
  "components/dialogs/ScheduleVisitModal.tsx",
  "modules/interactions/components/ScheduleVisitModal.tsx",
  "modules/tenant/components/ScheduleVisitModal.tsx",
];

describe("visit request contract", () => {
  const valid = {
    propertyId: "3f1a6b2c-8d4e-4f10-9a7b-1c2d3e4f5a6b",
    name: "Asha Rao",
    phone: "9876543210",
    preferredDate: "2026-09-02",
    preferredSlot: VISIT_SLOTS[0],
  };

  it("accepts a well-formed request", () => {
    expect(visitRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a date that is not ISO — the column is a real date", () => {
    // "Tomorrow" and "This Saturday" were being sent verbatim.
    for (const preferredDate of ["Tomorrow", "This Saturday", "02-09-2026", ""]) {
      const result = visitRequestSchema.safeParse({ ...valid, preferredDate });
      expect(result.success, `"${preferredDate}" should be rejected`).toBe(false);
    }
  });

  it("rejects a slot outside the offered set", () => {
    for (const preferredSlot of ["10:00 AM", "02:00 PM - 04:00 PM", "whenever"]) {
      expect(visitRequestSchema.safeParse({ ...valid, preferredSlot }).success).toBe(false);
    }
  });

  it("requires a name and a usable phone, so the owner can call back", () => {
    expect(visitRequestSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
    expect(visitRequestSchema.safeParse({ ...valid, phone: "" }).success).toBe(false);
    expect(visitRequestSchema.safeParse({ ...valid, phone: "not-a-number" }).success).toBe(false);
  });

  it("defaults to an in-person visit", () => {
    const parsed = visitRequestSchema.parse(valid);
    expect(parsed.visitType).toBe("in_person");
  });

  it("rejects a filled honeypot", () => {
    expect(visitRequestSchema.safeParse({ ...valid, company: "spam" }).success).toBe(false);
  });
});

describe("every visit surface goes through the one service", () => {
  it.each(VISIT_SURFACES)("%s imports scheduleVisit", (rel) => {
    expect(codeOf(rel)).toContain("scheduleVisit");
  });

  it.each(VISIT_SURFACES)("%s branches on the result before confirming", (rel) => {
    // The specific regression: a success screen reached unconditionally.
    expect(codeOf(rel)).toMatch(/result\.ok|!result\.ok/);
  });

  it.each(VISIT_SURFACES)("%s never fires the request and walks away", (rel) => {
    const code = codeOf(rel);
    expect(code).not.toMatch(/void\s+fetch\(/);
    expect(code).not.toMatch(/\.catch\(\(\)\s*=>\s*\{\s*\}\)/);
  });

  it("no surface writes visit columns the table does not have", () => {
    for (const rel of VISIT_SURFACES) {
      const code = codeOf(rel);
      expect(code, `${rel} uses a column property_visits lacks`).not.toMatch(
        /preferred_date|preferred_time_slot|visitor_id/,
      );
    }
  });

  it("no surface falls back to a hardcoded owner phone number", () => {
    // The WhatsApp handoff defaulted to 919876543210, sending a stranger's
    // visit details to whoever owns that number.
    for (const rel of VISIT_SURFACES) {
      expect(codeOf(rel), `${rel} has a hardcoded phone fallback`).not.toMatch(/\b\d{12}\b/);
    }
  });

  it("the redundant fourth modal is gone", () => {
    expect(
      existsSync(join(process.cwd(), "src/modules/property/components/ScheduleVisitModal.tsx")),
    ).toBe(false);
  });
});

describe("the endpoint persists the visit it confirms", () => {
  const endpoint = codeOf("routes/api/public/properties.$id.schedule-visit.ts");

  it("inserts into property_visits", () => {
    expect(endpoint).toContain('from("property_visits")');
    expect(endpoint).toContain("visit_date");
    expect(endpoint).toContain("visit_time");
  });

  it("returns an error rather than ok when the insert fails", () => {
    expect(endpoint).toMatch(/insertError/);
    expect(endpoint).toMatch(/jsonResponse\(\s*\{\s*error:[^}]*\}\s*,\s*500\s*\)/);
  });

  it("validates with the same schema the client uses", () => {
    expect(endpoint).toContain("visitRequestSchema");
  });
});
