// Où la personne cherche : un ou plusieurs départements, choisis au premier passage (localisation
// ou choix à la main) et gardés dans un cookie pour que les pages serveur filtrent tout de suite.
// « fr » : toute la France, choisie exprès.

import type { NearFilter } from '@/lib/offers/types';

export const PLACE_COOKIE = 'decode_lieu';

/** Au plus 13 départements à la fois (la plus grande région, l'Occitanie) : au-delà, autant chercher dans toute la France. */
export const MAX_DEPARTMENTS = 13;

/** Les rayons proposés pour « autour de », en kilomètres. */
export const KM_OPTIONS = [5, 10, 20, 30, 50, 100];

export type Near = NearFilter;

/** « 48.86,2.35,75 » : le centre arrondi au kilomètre et son département, tel qu'il s'écrit dans l'adresse (autour=). */
export function encodeCenter(n: Pick<Near, 'lat' | 'lon' | 'department'>): string {
  return `${n.lat.toFixed(3)},${n.lon.toFixed(3)},${n.department}`;
}

/** Lit un centre et un rayon ; null si l'un des deux n'est pas valide. */
export function parseNear(center: string | undefined, km: string | undefined, label: string | undefined): Near | null {
  const m = center?.match(/^(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?),(\d{2,3}|2[AB])$/i);
  const radius = Number(km);
  if (!m || !KM_OPTIONS.includes(radius)) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon, km: radius, department: m[3]!.toUpperCase(), label: (label ?? '').trim().slice(0, 60) || 'Autour de toi' };
}

/** Le lieu retenu dans le cookie : « fr », des départements (« 75.92 ») ou un rayon (« autour~48.86,2.35,75~20~Paris »). */
export function encodePlace(place: string[] | Near): string {
  if (!Array.isArray(place)) return `autour~${encodeCenter(place)}~${place.km}~${encodeURIComponent(place.label)}`;
  return place.length ? place.join('.') : 'fr';
}

export function decodeNearCookie(value: string | undefined): Near | null {
  if (!value?.startsWith('autour~')) return null;
  const [, center, km, label] = value.split('~');
  let name: string | undefined;
  try {
    name = label ? decodeURIComponent(label) : undefined;
  } catch {
    name = undefined;
  }
  return parseNear(center, km, name);
}

/** Écrit le choix pour un an. Côté navigateur seulement. */
export function savePlace(place: string[] | Near): void {
  document.cookie = `${PLACE_COOKIE}=${encodePlace(place)}; path=/; max-age=31536000; samesite=lax`;
}

/** Le département où se trouve la personne, d'après sa position (arrondie : on n'a pas besoin de plus). */
export async function locateDepartment(): Promise<{ department: string; city: string; lat: number; lon: number }> {
  if (!('geolocation' in navigator)) throw new Error('Ton navigateur ne donne pas sa position.');
  const position = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 10_000, maximumAge: 3_600_000 }),
  ).catch(() => {
    throw new Error('Position refusée ou introuvable. Choisis ton département à la main.');
  });
  const { latitude, longitude } = position.coords;
  const res = await fetch(`/api/lieu?lat=${latitude.toFixed(2)}&lon=${longitude.toFixed(2)}`);
  const data = (await res.json().catch(() => ({}))) as { department?: string; city?: string; error?: string };
  if (!res.ok || !data.department) throw new Error(data.error ?? 'Lieu introuvable. Choisis ton département à la main.');
  return { department: data.department, city: data.city ?? '', lat: Number(latitude.toFixed(2)), lon: Number(longitude.toFixed(2)) };
}
