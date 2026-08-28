import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useVisitorTracking() {
  useEffect(() => {
    async function trackVisitor(explicitUserId?: string | null) {
      const trackingKey = explicitUserId
        ? `visitor_tracked_${explicitUserId}`
        : "visitor_tracked_guest";
      if (sessionStorage.getItem(trackingKey)) {
        return;
      }

      try {
        let ip_address = null;
        let city = null;
        let region = null;
        let country = null;
        let latitude = null;
        let longitude = null;

        try {
          const res = await fetch("https://ipapi.co/json/");
          if (res.ok) {
            const data = await res.json();
            ip_address = data.ip;
            city = data.city;
            region = data.region;
            country = data.country_name;
            latitude = data.latitude;
            longitude = data.longitude;
          }
        } catch {
          // GeoIP fetch is best effort
        }

        const userAgent = navigator.userAgent;
        let userId = explicitUserId;
        if (userId === undefined) {
          const { data: authData } = await supabase.auth.getUser();
          userId = authData?.user?.id || null;
        }

        const { error } = await supabase.from("site_visitors" as any).insert({
          ip_address,
          city,
          region,
          country,
          latitude,
          longitude,
          user_agent: userAgent,
          platform: "Web",
          user_id: userId,
        });

        if (!error) {
          sessionStorage.setItem(trackingKey, "true");
        }
      } catch (err) {
        console.error("Visitor tracking error:", err);
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
