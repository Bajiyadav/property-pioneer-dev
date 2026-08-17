import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { USERS, AUDIT } from "@/modules/admin/fixtures";
import { ACTIVITY, VISITS as OWNER_VISITS } from "@/modules/owner/fixtures";
import {
  LEADS,
  CLIENTS,
  VISITS as AGENT_VISITS,
  COMMISSIONS,
  NOTIFICATIONS as AGENT_NOTIFICATIONS,
  FUNNEL,
} from "@/modules/agent/fixtures";
import {
  BOOKINGS,
  ENQUIRIES,
  NOTIFICATIONS as CUSTOMER_NOTIFICATIONS,
  VIEW_TREND,
} from "@/modules/customer/fixtures";

/**
 * Guards the platform's data-honesty rule: a dashboard must never present
 * invented records as real ones.
 *
 * These modules used to hold named people who were not users, enquiries nobody
 * sent, visits nobody booked, and agent commission rows marked "Paid" against
 * amounts recorded in no ledger. Every dashboard rendered them indistinguishably
 * from live data, so an agent saw earnings they did not have and an admin saw a
 * user base that did not exist — and searched it as though it did.
 *
 * The arrays are now empty and each surface shows its real empty state. This test
 * exists because that is a one-line change to undo, and the failure mode is
 * invisible: repopulated sample data looks like a working feature.
 */
describe("dashboards contain no fabricated records", () => {
  const datasets: Record<string, unknown[]> = {
    "admin USERS": USERS,
    "admin AUDIT": AUDIT,
    "owner ACTIVITY": ACTIVITY,
    "owner VISITS": OWNER_VISITS,
    "agent LEADS": LEADS,
    "agent CLIENTS": CLIENTS,
    "agent VISITS": AGENT_VISITS,
    "agent COMMISSIONS": COMMISSIONS,
    "agent NOTIFICATIONS": AGENT_NOTIFICATIONS,
    "agent FUNNEL": FUNNEL,
    "customer BOOKINGS": BOOKINGS,
    "customer ENQUIRIES": ENQUIRIES,
    "customer NOTIFICATIONS": CUSTOMER_NOTIFICATIONS,
    "customer VIEW_TREND": VIEW_TREND,
  };

  for (const [name, rows] of Object.entries(datasets)) {
    it(`${name} ships empty`, () => {
      expect(
        rows,
        `${name} must stay empty — a dashboard showing sample data presents it as real`,
      ).toHaveLength(0);
    });
  }

  /**
   * The commission case is called out separately because it is the one with a
   * financial consequence. An agent who believes a payout is owed may act on it.
   */
  it("shows no commission figures, because no commission data is stored", () => {
    expect(COMMISSIONS).toEqual([]);
  });

  /**
   * Seeded pseudo-random series are the subtler form of the same problem: they
   * look like measurements, are stable across reloads, and describe nothing. A
   * chart must be computed from real rows or show an empty state.
   */
  it("no dashboard page builds a chart from a seeded generator", () => {
    const pagesDir = join(process.cwd(), "src/modules");
    const offenders: string[] = [];

    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith("DashboardPage.tsx")) {
          // Comments are stripped first: a note explaining the removal must not
          // itself trip the check, in either direction.
          const src = readFileSync(full, "utf8")
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/\/\/.*$/gm, "");
          if (/seededSeries\s*\(/.test(src)) offenders.push(entry.name);
        }
      }
    };
    walk(pagesDir);

    expect(
      offenders,
      `these dashboards draw charts from generated numbers: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});
