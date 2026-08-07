import { createFileRoute } from "@tanstack/react-router";
import { CustomerDashboardPage } from "@/modules/customer/pages/CustomerDashboardPage";

/**
 * Route shell for /dashboard/customer.
 *
 * File-based routing means this path IS the public URL, so the file stays put.
 * It carries routing concerns only; the page itself lives in the customer module.
 */
export const Route = createFileRoute("/_authenticated/dashboard/customer")({
  component: CustomerDashboardPage,
});
