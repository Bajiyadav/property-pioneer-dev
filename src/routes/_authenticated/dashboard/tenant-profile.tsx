import { createFileRoute } from "@tanstack/react-router";
import { TenantProfile } from "@/modules/tenant/components/TenantProfile";

// @ts-expect-error Route types are generated dynamically
export const Route = createFileRoute("/_authenticated/dashboard/tenant-profile")({
  component: TenantProfilePage,
});

function TenantProfilePage() {
  return <TenantProfile />;
}
