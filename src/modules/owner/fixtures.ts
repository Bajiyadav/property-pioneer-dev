import type { Property } from "@/modules/property/services/propertyQueries";

import type { TimelineItem } from "@/modules/dashboard/components/DashboardKit";

/*
 * DATA HONESTY — these arrays are intentionally empty.
 *
 * They previously held invented records that every dashboard rendered as if they
 * were real: named people who are not users, enquiries nobody sent, visits nobody
 * booked, a conversion funnel computed from nothing, and — worst — agent
 * commission rows reading "Paid" against amounts that exist in no ledger. An agent
 * opening the dashboard saw money they had not earned; an admin saw a user base
 * that did not exist and searched it as though it did.
 *
 * Emptying them here rather than deleting the module is deliberate. The types and
 * shapes stay valid, every dashboard keeps compiling, and each surface now renders
 * its honest empty state ("no leads yet", "no enquiries yet") instead of fiction.
 * That is a truthful screen today rather than a broken one.
 *
 * The replacement path is real queries, scoped server-side to the signed-in user.
 * `src/modules/agent/services/agent.server.ts` is the worked example: it reads
 * `agent_leads`, `property_visits` and `notifications`, and deliberately exposes
 * NO commission data because the schema has no commission table — the honest
 * answer to "what did I earn" is silence until something records it.
 *
 * Do not repopulate these with sample data. If a surface looks empty, that is the
 * database being empty, which is information rather than a bug.
 */

export const VISITS: { id: string; day: string; time: string; who: string; what: string }[] = [];

export const ACTIVITY: TimelineItem[] = [];

export const SEARCH_PARAMS = {
  q: "",
  city: "Hyderabad",
  listing: "rent",
  minPrice: 0,
  maxPrice: 0,
  beds: 0,
} as const;

export const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200";

export function listingImage(p: Property): string {
  return Array.isArray(p.images) && p.images[0] ? p.images[0] : FALLBACK_IMAGE;
}
