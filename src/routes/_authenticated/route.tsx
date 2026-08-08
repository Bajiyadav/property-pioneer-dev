import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { BrandMark } from "@/shared/components/BrandMark";
import { CustomErrorBoundary } from "@/shared/components/feedback/CustomErrorBoundary";
import { useAuthSession } from "@/hooks/useAuthSession";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGuard,
  errorComponent: CustomErrorBoundary,
});

/**
 * Gate for every signed-in area.
 *
 * Only authentication is enforced here — per-dashboard authorization lives in
 * `RequireRole`, so an authenticated user with the wrong role is redirected to
 * their own dashboard rather than bounced back to the login screen.
 */
function AuthGuard() {
  const navigate = useNavigate();
  const { status } = useAuthSession();
  const href = useRouterState({ select: (s) => s.location.href });

  // Held in a ref so moving between dashboard tabs doesn't re-run the effect.
  const hrefRef = useRef(href);
  hrefRef.current = href;

  useEffect(() => {
    if (status === "guest") {
      navigate({ to: "/auth", search: { redirect: hrefRef.current }, replace: true });
    }
  }, [status, navigate]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <BrandMark size="md" className="justify-center" />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs font-semibold text-muted-foreground">
          {status === "guest" ? "Redirecting to sign in…" : "Verifying your session…"}
        </p>
      </div>
    );
  }

  return <Outlet />;
}
