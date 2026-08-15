import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminDashboardPage } from "@/modules/admin/pages/AdminDashboardPage";
import { checkIsAdmin } from "@/modules/admin/services/adminFunctions";

/**
 * Route shell for /dashboard/admin.
 *
 * File-based routing means this path IS the public URL, so the file stays put.
 * It carries routing concerns only; the page itself lives in the admin module.
 */
export const Route = createFileRoute("/_authenticated/dashboard/admin")({
  beforeLoad: async () => {
    try {
      const { isAdmin } = await checkIsAdmin();
      if (!isAdmin) {
        throw redirect({ to: "/" });
      }
    } catch (e) {
      if (e instanceof Error && e.message === "Forbidden") {
        throw redirect({ to: "/" });
      }
      throw e;
    }
  },
  component: AdminDashboardPage,
});
