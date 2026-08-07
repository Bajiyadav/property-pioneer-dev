import { createFileRoute } from "@tanstack/react-router";
import { OwnerDashboardPage } from "@/modules/owner/pages/OwnerDashboardPage";

/**
 * Route shell for /dashboard/owner.
 *
 * File-based routing means this path IS the public URL, so the file stays put.
 * It carries routing concerns only; the page itself lives in the owner module.
 */
export const Route = createFileRoute("/_authenticated/dashboard/owner")({
  component: OwnerDashboardPage,
});
