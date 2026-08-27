import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useVisitorTracking() {
  useEffect(() => {
    async function trackVisitor() {
      // Prevent multiple tracking calls in a single session
      if (sessionStorage.getItem("visitor_tracked")) {
        return;
      }

      try {
        let ip_address = null;
        let city = null;
        let region = null;
        let country = null;
        let latitude = null;
        let longitude = null;

        // Fetch location details from a free GeoIP service
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
        } catch (e) {
          console.error("Failed to fetch visitor IP details:", e);
        }

        const userAgent = navigator.userAgent;

        // Try to get the current authenticated user, if any
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id || null;

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

        if (error) {
          console.error("Error tracking visitor:", error);
        } else {
          sessionStorage.setItem("visitor_tracked", "true");
        }
      } catch (err) {
        console.error("Visitor tracking error:", err);
      }
    }

    trackVisitor();
  }, []);
}
