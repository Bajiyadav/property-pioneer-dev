import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardPage } from "@/modules/admin/pages/AdminDashboardPage";

/**
 * Route shell for /dashboard/admin.
 *
 * File-based routing means this path IS the public URL.
 * Role authorization is enforced authoritatively via RequireRole & useAuthSession.
 */
export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  component: AdminDashboardPage,
});
