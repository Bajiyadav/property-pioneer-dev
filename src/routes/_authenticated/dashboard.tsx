import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";

/**
 * Layout route for every role dashboard.
 *
 * This route owns the `/dashboard` path segment, so it MUST render an <Outlet />
 * — without one the child routes (/dashboard/customer, /owner, /agent, /admin)
 * never mount.
 *
 * The `tab` search param lives here so all four dashboards share one
 * deep-linkable schema (e.g. /dashboard/owner?tab=leads).
 */
const dashboardSearchSchema = z.object({
  tab: fallback(z.string(), "overview").default("overview"),
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: zodValidator(dashboardSearchSchema),
  component: DashboardLayoutRoute,
});

function DashboardLayoutRoute() {
  return <Outlet />;
}
