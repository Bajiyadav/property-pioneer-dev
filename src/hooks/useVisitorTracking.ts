import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useVisitorTracking() {
  useEffect(() => {
    async function trackVisitor(explicitUserId?: string | null) {
      const trackingKey = explicitUserId
        ? `visitor_tracked_${explicitUserId}`
        : "visitor_tracked_guest";
      // Mark tracked for this session to prevent repeated requests if quota is exhausted
      sessionStorage.setItem(trackingKey, "true");

      try {
        let ip_address = null;

        try {
          const res = await fetch("https://api.ipify.org?format=json", {
            signal: AbortSignal.timeout(2500),
          });
          if (res.ok) {
            const data = (await res.json()) as { ip?: string };
            ip_address = data.ip || null;
          }
        } catch {
          // IP fetch is best effort
        }

        const userAgent = navigator.userAgent;
        let userId = explicitUserId;
        if (userId === undefined) {
          const { data: authData } = await supabase.auth.getUser();
          userId = authData?.user?.id || null;
        }

        await supabase.from("site_visitors" as any).insert({
          ip_address,
          user_agent: userAgent,
          platform: "Web",
          user_id: userId,
        });
      } catch {
        // Visitor analytics is purely non-blocking best-effort
      }
    }

    // Initial page load track
    trackVisitor();

    // Track on auth sign-in state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.id) {
        trackVisitor(session.user.id);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
}
