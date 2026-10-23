// Où la personne cherche : un ou plusieurs départements, choisis au premier passage (localisation
// ou choix à la main) et gardés dans un cookie pour que les pages serveur filtrent tout de suite.
// « fr » : toute la France, choisie exprès.

export const PLACE_COOKIE = 'decode_lieu';

/** Au plus 8 départements à la fois : au-delà, autant chercher dans toute la France. */
export const MAX_DEPARTMENTS = 8;

export function encodePlace(departments: string[]): string {
  return departments.length ? departments.join('.') : 'fr';
}

/** Écrit le choix pour un an. Côté navigateur seulement. */
export function savePlace(departments: string[]): void {
  document.cookie = `${PLACE_COOKIE}=${encodePlace(departments)}; path=/; max-age=31536000; samesite=lax`;
}

/** Le département où se trouve la personne, d'après sa position (arrondie : on n'a pas besoin de plus). */
export async function locateDepartment(): Promise<{ department: string; city: string }> {
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
  return { department: data.department, city: data.city ?? '' };
}
