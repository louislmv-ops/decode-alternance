// Distances sur la carte : à vol d'oiseau, ce qui suffit pour dire « à 12 km ».

const EARTH_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Le cadre qui contient le cercle : un premier tri rapide avant le calcul exact. */
export function boundingBox(center: { lat: number; lon: number }, km: number) {
  const dLat = km / 111.32;
  const dLon = km / (111.32 * Math.max(0.1, Math.cos(rad(center.lat))));
  return { minLat: center.lat - dLat, maxLat: center.lat + dLat, minLon: center.lon - dLon, maxLon: center.lon + dLon };
}
