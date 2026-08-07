import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardPage } from "@/modules/admin/pages/AdminDashboardPage";

/**
 * Route shell for /dashboard/admin.
 *
 * File-based routing means this path IS the public URL, so the file stays put.
 * It carries routing concerns only; the page itself lives in the admin module.
 */
export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  component: AdminDashboardPage,
});
