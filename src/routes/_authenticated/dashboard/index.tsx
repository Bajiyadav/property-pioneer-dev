import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getDashboardRoute } from "@/config/roles";
import { useAuthSession } from "@/hooks/useAuthSession";
import { BrandMark } from "@/shared/components/BrandMark";

/**
 * Index route for `/dashboard` — sends the user to their own role dashboard.
 *
 * The role comes from the authoritative resolver (user_roles → user_metadata),
 * never from client-writable storage, so this cannot be used to reach the
 * admin dashboard by editing localStorage.
 */
export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardDispatcher,
});

function DashboardDispatcher() {
  const navigate = useNavigate();
  const { status, role, roleVerified } = useAuthSession();

  useEffect(() => {
    if (status !== "authenticated" || !roleVerified) return;
    navigate({ href: `${getDashboardRoute(role)}?tab=overview`, replace: true });
  }, [status, role, roleVerified, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
      <BrandMark size="md" className="justify-center" />
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-xs font-semibold text-muted-foreground">Taking you to your dashboard…</p>
    </div>
  );
}
