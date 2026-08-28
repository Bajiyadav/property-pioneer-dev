/**
 * Map data types and the listing -> marker mapper.
 *
 * Kept out of PropertyMap.tsx so that file exports only its component, which
 * is what React Fast Refresh needs to hot-reload it.
 */

export interface MapProperty {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  price: number;
  locality?: string;
  city?: string;
}

const LOCALITY_COORDS_MAP: Record<string, { lat: number; lng: number }> = {
  // Hyderabad
  madhapur: { lat: 17.4483, lng: 78.3915 },
  gachibowli: { lat: 17.4401, lng: 78.3489 },
  "hitec city": { lat: 17.4435, lng: 78.3772 },
  hiteccity: { lat: 17.4435, lng: 78.3772 },
  kondapur: { lat: 17.4622, lng: 78.3568 },
  "jubilee hills": { lat: 17.4319, lng: 78.4071 },
  "banjara hills": { lat: 17.4156, lng: 78.4347 },
  kukatpally: { lat: 17.4849, lng: 78.4138 },
  begumpet: { lat: 17.4447, lng: 78.4664 },
  miyapur: { lat: 17.4966, lng: 78.3566 },
  secunderabad: { lat: 17.4399, lng: 78.4983 },
  "financial district": { lat: 17.4156, lng: 78.3378 },
  "ayyapa society": { lat: 17.4483, lng: 78.3885 },
  // Bengaluru
  whitefield: { lat: 12.9698, lng: 77.75 },
  koramangala: { lat: 12.9352, lng: 77.6245 },
  indiranagar: { lat: 12.9784, lng: 77.6408 },
  "hsr layout": { lat: 12.9121, lng: 77.6446 },
  // Mumbai
  mumbai: { lat: 19.076, lng: 72.8777 },
  shna: { lat: 19.076, lng: 72.8777 },
  "bandra west": { lat: 19.0596, lng: 72.8295 },
  andheri: { lat: 19.1136, lng: 72.8697 },
  // City fallbacks
  hyderabad: { lat: 17.4065, lng: 78.4772 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
};

function resolveCoordinates(p: {
  locality?: string | null;
  city?: string | null;
  approx_latitude?: number | null;
  approx_longitude?: number | null;
}): { lat: number; lng: number } | null {
  const lat = Number(p.approx_latitude);
  const lng = Number(p.approx_longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
    return { lat, lng };
  }

  // Fallback to locality lookup
  const locKey = (p.locality || "").trim().toLowerCase();
  if (locKey && LOCALITY_COORDS_MAP[locKey]) {
    return LOCALITY_COORDS_MAP[locKey];
  }

  // Fallback to city lookup
  const cityKey = (p.city || "").trim().toLowerCase();
  if (cityKey && LOCALITY_COORDS_MAP[cityKey]) {
    return LOCALITY_COORDS_MAP[cityKey];
  }

  // Default to Hyderabad central corridor if unmapped
  return { lat: 17.4483, lng: 78.3915 };
}

/**
 * Maps properties with valid coordinates or resolved locality coordinates.
 */
export function toMapProperties(
  properties: Array<{
    id: string;
    title: string;
    price: number;
    locality?: string | null;
    city?: string | null;
    approx_latitude?: number | null;
    approx_longitude?: number | null;
  }>,
): MapProperty[] {
  const out: MapProperty[] = [];
  for (const p of properties) {
    const coords = resolveCoordinates(p);
    if (!coords) continue;
    out.push({
      id: p.id,
      title: p.title,
      price: p.price,
      locality: p.locality || undefined,
      city: p.city || undefined,
      latitude: coords.lat,
      longitude: coords.lng,
    });
  }
  return out;
}
