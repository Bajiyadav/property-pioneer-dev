/**
 * Browser Geolocation API & Locality Distance Engine
 */

export interface LocalityCoord {
  name: string;
  lat: number;
  lng: number;
}

export const HYDERABAD_LOCALITIES: LocalityCoord[] = [
  { name: "Kukatpally", lat: 17.4849, lng: 78.4138 },
  { name: "Gachibowli", lat: 17.4401, lng: 78.3489 },
  { name: "Madhapur", lat: 17.4483, lng: 78.3915 },
  { name: "Hitec City", lat: 17.4435, lng: 78.3772 },
  { name: "Kondapur", lat: 17.4622, lng: 78.3568 },
  { name: "Jubilee Hills", lat: 17.4319, lng: 78.4071 },
  { name: "Banjara Hills", lat: 17.4156, lng: 78.4347 },
  { name: "Begumpet", lat: 17.4447, lng: 78.4664 },
  { name: "Miyapur", lat: 17.4966, lng: 78.3566 },
  { name: "Secunderabad", lat: 17.4399, lng: 78.4983 },
];

/**
 * Calculates straight line distance in km between two lat/lng points.
 */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getNearestLocality(lat: number, lng: number): LocalityCoord {
  let closest = HYDERABAD_LOCALITIES[0];
  let minDistance = Infinity;

  for (const loc of HYDERABAD_LOCALITIES) {
    const dist = getDistanceKm(lat, lng, loc.lat, loc.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }

  return closest;
}

export interface GeolocationResult {
  supported: boolean;
  locality: string;
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}

export async function getCurrentUserLocality(): Promise<GeolocationResult> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return {
      supported: false,
      locality: "",
      latitude: null,
      longitude: null,
      error: "Geolocation is not supported by your browser.",
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nearest = getNearestLocality(latitude, longitude);
        resolve({
          supported: true,
          locality: nearest.name,
          latitude,
          longitude,
          error: null,
        });
      },
      (err) => {
        resolve({
          supported: true,
          locality: "",
          latitude: null,
          longitude: null,
          error: err.message || "Location permission denied.",
        });
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  });
}
