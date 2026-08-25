import { APIProvider } from "@vis.gl/react-google-maps";
import type { ReactNode } from "react";

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

/**
 * Wraps the app with the Google Maps API provider.
 * Uses @vis.gl/react-google-maps (CF5 compliant — never google-map-react or @react-google-maps/api).
 * The internalUsageAttributionIds field is set per the skill requirement (gmp_git_agentskills_v1).
 */
export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  if (!MAPS_API_KEY) return <>{children}</>;

  return (
    <APIProvider
      apiKey={MAPS_API_KEY}
      language="en"
      region="IN"
      libraries={["places"]}
      // @ts-expect-error — attribution ID required by GMP agent skill guidelines
      internalUsageAttributionIds={["gmp_git_agentskills_v1"]}
    >
      {children}
    </APIProvider>
  );
}
