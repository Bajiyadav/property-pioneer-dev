import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandMark } from "@/components/BrandMark";
import { CustomErrorBoundary } from "@/components/errors/CustomErrorBoundary";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGuard,
  errorComponent: CustomErrorBoundary,
});

function AuthGuard() {
  const navigate = useNavigate();
  const href = useRouterState({ select: (s) => s.location.href });
  const [status, setStatus] = useState<"checking" | "authed">("checking");

  // Held in a ref so navigating between dashboard tabs doesn't re-run the guard.
  const hrefRef = useRef(href);
  hrefRef.current = href;

  useEffect(() => {
    let active = true;

    const sendToLogin = () => {
      // Preserve where the user was headed so login can return them there.
      navigate({ to: "/auth", search: { redirect: hrefRef.current }, replace: true });
    };

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data.session) sendToLogin();
        else setStatus("authed");
      })
      .catch(() => {
        // Never leave the user on an infinite spinner if Supabase is unreachable.
        if (active) sendToLogin();
      });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT" || !session) sendToLogin();
      else setStatus("authed");
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <BrandMark size="md" className="justify-center" />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-xs font-semibold text-muted-foreground">Verifying your session…</p>
      </div>
    );
  }

  return <Outlet />;
}
