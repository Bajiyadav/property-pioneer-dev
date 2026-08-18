import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Guards the platform's data-honesty rule: a dashboard must never present
 * invented records as real ones.
 *
 * The four dashboards used to render hardcoded arrays indistinguishably from
 * live data — named people who were not users, enquiries nobody sent, visits
 * nobody booked, and agent commission rows marked "Paid" against amounts
 * recorded in no ledger. An agent saw earnings they had not made; an admin saw a
 * user base that did not exist, and could search it.
 *
 * Those modules are now gone and every dashboard queries real data. This test
 * asserts the end state rather than the transitional one: no `fixtures.ts` may
 * reappear under src/modules, and no dashboard may build a chart from a
 * generator. Both are one commit away from returning, and both fail invisibly —
 * sample data looks exactly like a working feature.
 */

const MODULES_DIR = join(process.cwd(), "src/modules");

function walk(dir: string, hit: (path: string, name: string) => void): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, hit);
    else hit(full, entry.name);
  }
}

/** Comments are stripped so a note explaining a removal cannot trip the check. */
function codeOf(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

describe("dashboards contain no fabricated records", () => {
  it("no module ships a fixtures file", () => {
    const found: string[] = [];
    walk(MODULES_DIR, (full, name) => {
      if (name === "fixtures.ts" || name === "fixtures.tsx") {
        found.push(full.replace(process.cwd() + "/", ""));
      }
    });
    expect(
      found,
      `fixture modules are back: ${found.join(", ")}. Dashboards must read real data.`,
    ).toEqual([]);
  });

  it("no dashboard builds a chart from a seeded generator", () => {
    /*
     * The subtler form of the same problem. A seeded PRNG produces a plausible
     * curve that is stable across reloads, so it reads as a measurement while
     * describing nothing. A chart must come from real rows or show an empty state.
     */
    const offenders: string[] = [];
    walk(MODULES_DIR, (full, name) => {
      if (!name.endsWith("DashboardPage.tsx")) return;
      if (/seededSeries\s*\(/.test(codeOf(full))) offenders.push(name);
    });
    expect(
      offenders,
      `these dashboards draw charts from generated numbers: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("every dashboard actually queries data rather than importing constants", () => {
    // A dashboard with no query and no server function is either empty or is
    // rendering something it made up.
    const pages: string[] = [];
    const withoutQueries: string[] = [];
    walk(MODULES_DIR, (full, name) => {
      if (!name.endsWith("DashboardPage.tsx")) return;
      pages.push(name);
      const src = codeOf(full);
      if (!/useQuery|useServerFn/.test(src)) withoutQueries.push(name);
    });

    expect(pages.length, "expected to find dashboard pages").toBeGreaterThan(0);
    expect(withoutQueries, `these dashboards fetch nothing: ${withoutQueries.join(", ")}`).toEqual(
      [],
    );
  });

  it("no dashboard hardcodes a commission or payout figure", () => {
    /*
     * Called out separately because it is the one with a financial consequence:
     * an agent who believes a payout is owed may act on it. Matches a rupee
     * amount sitting next to commission/payout/earning wording in code.
     */
    const offenders: string[] = [];
    walk(MODULES_DIR, (full, name) => {
      if (!name.endsWith("DashboardPage.tsx")) return;
      const src = codeOf(full);
      if (/(commission|payout|earned)[^\n]{0,60}["'`]\s*₹\s*[\d,]{3,}/i.test(src)) {
        offenders.push(name);
      }
    });
    expect(offenders, `hardcoded earnings found in: ${offenders.join(", ")}`).toEqual([]);
  });
});

describe("the public site never presents seed listings as real inventory", () => {
  const service = readFileSync(
    join(process.cwd(), "src/modules/property/services/propertyService.ts"),
    "utf-8",
  );

  /**
   * fetchPublicPropertyFeed serves ALL_FALLBACK_PROPERTIES when the query fails,
   * and marks the result `source: "fallback"`. The dashboards honour that marker
   * and render a "Showing sample data" banner. fetchPublicProperties — which is
   * what /properties, the home page and every rent/buy/commercial page use —
   * discarded it, so a failed query put fourteen invented Hyderabad listings in
   * front of visitors with nothing to distinguish them from real ones.
   *
   * A fabricated listing is not a cosmetic defect: it is clickable, it has a
   * detail page, and a visitor can try to enquire about a home that does not
   * exist.
   */
  it("drops fallback listings instead of returning them to public callers", () => {
    const body = service.slice(
      service.indexOf("export async function fetchPublicProperties"),
      service.indexOf("export async function fetchPublicPropertyById"),
    );
    expect(body, "fetchPublicProperties must inspect the feed's provenance").toContain(
      'feed.source === "fallback"',
    );
    expect(body, "a fallback feed must yield an empty result").toMatch(/return \[\];/);
  });

  it("keeps the provenance marker the dashboards depend on", () => {
    // The fix must not be implemented by deleting the marker — the dashboards
    // still need it to label their illustrative figures.
    expect(service).toContain('export type PropertySource = "database" | "fallback";');
  });
});
