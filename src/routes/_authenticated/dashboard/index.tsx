import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getActiveRole, getDashboardRoute } from "@/config/roles";
import { BrandMark } from "@/components/BrandMark";

/**
 * Index route for `/dashboard` — redirects to the signed-in user's role
 * dashboard. The role lives in browser storage, so the redirect runs in an
 * effect rather than in `beforeLoad` (which also executes during SSR).
 */
export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardDispatcher,
});

function DashboardDispatcher() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({
      to: getDashboardRoute(getActiveRole()),
      search: { tab: "overview" },
      replace: true,
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
      <BrandMark size="md" className="justify-center" />
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-xs font-semibold text-muted-foreground">
        Redirecting to your role dashboard…
      </p>
    </div>
  );
}
