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
  // Use DEMO_MAP_ID for prototyping or a real one later
  const MAP_ID = "DEMO_MAP_ID";

  return (
    <div style={{ height: "400px", width: "100%" }}>
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}>
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
