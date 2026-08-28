import React, { useState, useEffect } from "react";
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import type { MapProperty } from "./propertyMapData";

interface PropertyMapProps {
  properties: MapProperty[];
  onBoundsChanged?: (bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) => void;
}

const MapUpdater = ({
  onBoundsChanged,
}: {
  onBoundsChanged?: PropertyMapProps["onBoundsChanged"];
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener("idle", () => {
      if (onBoundsChanged) {
        const bounds = map.getBounds();
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          onBoundsChanged({
            minLat: sw.lat(),
            maxLat: ne.lat(),
            minLng: sw.lng(),
            maxLng: ne.lng(),
          });
        }
      }
    });

    return () => {
      // listener.remove() rather than google.maps.event.removeListener(...):
      // the `google` global is only typed when @types/google.maps is installed,
      // and it is not. The listener handle exposes remove() itself, so this does
      // the same job with no ambient global and no extra dependency.
      listener.remove();
    };
  }, [map, onBoundsChanged]);

  return null;
};

export function PropertyMap({ properties, onBoundsChanged }: PropertyMapProps) {
  const [mapError, setMapError] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  useEffect(() => {
    // Intercept Google Maps authentication/quota failures gracefully
    const originalAuthFailure = (window as unknown as { gm_authFailure?: () => void })
      .gm_authFailure;
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
      setMapError(true);
      if (typeof originalAuthFailure === "function") {
        originalAuthFailure();
      }
    };

    return () => {
      (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = originalAuthFailure;
    };
  }, []);

  // If no API key or Google Maps auth failed, render high-aesthetic fallback
  if (!apiKey || mapError) {
    return (
      <div className="relative flex h-[400px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-6 text-center shadow-inner">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-15 [background-size:16px_16px]" />
        <div className="relative z-10 max-w-md space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h4 className="text-base font-bold text-foreground">
            Locality Cluster View ({properties.length} Active Listings)
          </h4>
          <p className="text-xs text-muted-foreground">
            Displaying verified properties across Hyderabad (Madhapur, Gachibowli, Kondapur, Hitec
            City).
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {Array.from(new Set(properties.map((p) => p.locality).filter(Boolean)))
              .slice(0, 5)
              .map((loc) => (
                <span
                  key={loc}
                  className="rounded-full bg-secondary/80 px-2.5 py-1 text-xs font-semibold text-foreground border border-border/60"
                >
                  📍 {loc}
                </span>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // Use DEMO_MAP_ID for prototyping or a real one later
  const MAP_ID = "DEMO_MAP_ID";

  return (
    <div style={{ height: "400px", width: "100%" }}>
      <APIProvider apiKey={apiKey} onError={() => setMapError(true)}>
        <Map
          defaultCenter={{ lat: 17.4065, lng: 78.4772 }} // Default Hyderabad
          defaultZoom={11}
          mapId={MAP_ID}
          internalUsageAttributionIds={["gmp_git_agentskills_v1"]}
        >
          <MapUpdater onBoundsChanged={onBoundsChanged} />
          {properties.map((prop) => {
            // Obfuscate by rounding coordinates to 3 decimal places (approx 110m)
            const approxLat = Math.round(prop.latitude * 1000) / 1000;
            const approxLng = Math.round(prop.longitude * 1000) / 1000;

            return (
              <AdvancedMarker
                key={prop.id}
                position={{ lat: approxLat, lng: approxLng }}
                title={prop.title + " (Approximate Location)"}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: "rgba(16, 185, 129, 0.4)", // Emerald 500 with opacity
                    border: "2px solid rgba(16, 185, 129, 0.8)",
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)", // Center on the coordinate
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(2px)",
                  }}
                ></div>
              </AdvancedMarker>
            );
          })}
        </Map>
      </APIProvider>
    </div>
  );
}
