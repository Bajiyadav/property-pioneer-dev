import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getActiveRole } from "@/components/demo/DemoModeSwitcher";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardDispatcher,
});

function DashboardDispatcher() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = getActiveRole();
    navigate({ to: `/dashboard/${role}` as any, replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-xs font-semibold text-muted-foreground">Redirecting to your role dashboard…</p>
      </div>
    </div>
  );
}
