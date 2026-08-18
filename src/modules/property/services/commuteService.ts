/**
 * Major Metro Landmarks with Geocoordinates for Commute Calculation
 */
export interface Landmark {
  name: string;
  category: "IT Park" | "Metro" | "Railway" | "Airport" | "Commercial";
  latitude: number;
  longitude: number;
}

export const MAJOR_LANDMARKS: Record<string, Landmark[]> = {
  Hyderabad: [
    {
      name: "HITEC City / Cyber Towers",
      category: "IT Park",
      latitude: 17.4474,
      longitude: 78.3762,
    },
    { name: "Madhapur IT Corridor", category: "IT Park", latitude: 17.4483, longitude: 78.3915 },
    {
      name: "Financial District / Gachibowli",
      category: "IT Park",
      latitude: 17.4198,
      longitude: 78.3498,
    },
    {
      name: "Jubilee Hills Checkpost",
      category: "Commercial",
      latitude: 17.4325,
      longitude: 78.4071,
    },
    {
      name: "Secunderabad Railway Station",
      category: "Railway",
      latitude: 17.4334,
      longitude: 78.5015,
    },
    { name: "RGIA Airport Shamshabad", category: "Airport", latitude: 17.2403, longitude: 78.4294 },
  ],
  Bengaluru: [
    { name: "Manyata Tech Park", category: "IT Park", latitude: 13.0475, longitude: 77.6197 },
    { name: "Electronic City Phase 1", category: "IT Park", latitude: 12.8452, longitude: 77.6602 },
    { name: "Whitefield ITPL", category: "IT Park", latitude: 12.9863, longitude: 77.7341 },
    { name: "MG Road Metro", category: "Metro", latitude: 12.9756, longitude: 77.6066 },
    { name: "KSR Bengaluru Railway", category: "Railway", latitude: 12.9781, longitude: 77.5696 },
  ],
  Mumbai: [
    {
      name: "Bandra Kurla Complex (BKC)",
      category: "Commercial",
      latitude: 19.0664,
      longitude: 72.8687,
    },
    { name: "Nesco IT Park Goregaon", category: "IT Park", latitude: 19.1551, longitude: 72.8532 },
    { name: "Andheri Metro Station", category: "Metro", latitude: 19.1197, longitude: 72.8468 },
    { name: "CSMT Railway Terminus", category: "Railway", latitude: 18.9401, longitude: 72.8354 },
  ],
};

export interface CommuteResult {
  landmarkName: string;
  category: string;
  distanceKm: number;
  durationMinutes: number;
  isDirectRoute: boolean;
}

/**
 * Calculates Haversine straight-line distance in kilometers.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Calculates real driving commute distance and duration using FREE OSRM Public Routing API.
 * Falls back gracefully to Haversine computation if offline or rate-limited.
 */
export async function calculateCommute(
  propertyLat: number,
  propertyLon: number,
  landmark: Landmark,
): Promise<CommuteResult> {
  const fallbackDistance = calculateHaversineDistanceKm(
    propertyLat,
    propertyLon,
    landmark.latitude,
    landmark.longitude,
  );
  // Estimate ~30 km/h average Indian city traffic speed
  const fallbackMinutes = Math.max(5, Math.round((fallbackDistance / 30) * 60));

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${propertyLon},${propertyLat};${landmark.longitude},${landmark.latitude}?overview=false`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          landmarkName: landmark.name,
          category: landmark.category,
          distanceKm: Math.round((route.distance / 1000) * 10) / 10,
          durationMinutes: Math.max(3, Math.round(route.duration / 60)),
          isDirectRoute: true,
        };
      }
    }
  } catch {
    // Fallback to haversine calculation
  }

  return {
    landmarkName: landmark.name,
    category: landmark.category,
    distanceKm: fallbackDistance,
    durationMinutes: fallbackMinutes,
    isDirectRoute: false,
  };
}

/**
 * Calculates commute metrics from a property location to all major city landmarks.
 */
export async function getCityCommuteSummary(
  city: string,
  lat: number,
  lon: number,
): Promise<CommuteResult[]> {
  const landmarks = MAJOR_LANDMARKS[city] || MAJOR_LANDMARKS.Hyderabad;
  const results = await Promise.all(
    landmarks.map((landmark) => calculateCommute(lat, lon, landmark)),
  );
  return results.sort((a, b) => a.durationMinutes - b.durationMinutes);
}
