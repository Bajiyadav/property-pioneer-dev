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
}

/**
 * Narrows listings to the ones that can actually be placed on a map.
 *
 * Coordinates are optional and, for privacy, are the APPROXIMATE pair — rounded
 * to roughly 110 m by a generated column, because the exact latitude/longitude
 * are never granted to a public client (see migration 20260822143802). A listing
 * with no coordinates is omitted rather than defaulted to a city centre, which
 * would put a pin on a place the property is not.
 */
export function toMapProperties(
  properties: Array<{
    id: string;
    title: string;
    price: number;
    locality?: string | null;
    approx_latitude?: number | null;
    approx_longitude?: number | null;
  }>,
): MapProperty[] {
  const out: MapProperty[] = [];
  for (const p of properties) {
    // PostgREST can serialise `numeric` as a string, so coerce before use.
    const lat = Number(p.approx_latitude);
    const lng = Number(p.approx_longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (p.approx_latitude == null || p.approx_longitude == null) continue;
    out.push({
      id: p.id,
      title: p.title,
      price: p.price,
      locality: p.locality || undefined,
      latitude: lat,
      longitude: lng,
    });
  }
  return out;
}
