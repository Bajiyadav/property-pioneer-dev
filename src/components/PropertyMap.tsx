import React from "react";
import type { MapProperty } from "./propertyMapData";
import { MapLibrePropertyMap } from "./MapLibrePropertyMap";

interface PropertyMapProps {
  properties: MapProperty[];
  onBoundsChanged?: (bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) => void;
}

export function PropertyMap({ properties, onBoundsChanged }: PropertyMapProps) {
  return (
    <MapLibrePropertyMap
      properties={properties}
      onBoundsChanged={onBoundsChanged}
      className="h-full min-h-[500px] w-full rounded-3xl overflow-hidden shadow-sm"
    />
  );
}
