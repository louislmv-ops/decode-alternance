// Placer une offre sur la carte quand la source ne donne que la ville ou le code postal : le centre de la
// commune, par l'API Géo de l'État (gratuite, sans clé). Chaque ville n'est cherchée qu'une fois.

import { normalizeText } from './normalize';

const geo = () => process.env.GEO_API_URL || 'https://geo.api.gouv.fr';

export interface Place {
  postalCode: string | null;
  city: string | null;
  department: string | null;
}

interface Commune {
  nom?: string;
  codeDepartement?: string;
  centre?: { coordinates?: number[] };
}

/** La clé d'un lieu, pour ne le chercher qu'une fois. */
export function placeKey(p: Place): string {
  return [p.postalCode ?? '', normalizeText(p.city ?? ''), p.department ?? ''].join('|');
}

/** La commune qui correspond le mieux : même nom, sinon même département, sinon la première (la plus peuplée). */
export function pickCommune(communes: Commune[], p: Place): { lat: number; lon: number } | null {
  const city = normalizeText((p.city ?? '').replace(/\b\d+(e|er|eme)?\b|arrondissement|cedex/gi, ''));
  const named = city ? communes.find((c) => normalizeText(c.nom ?? '') === city) : undefined;
  const inDep = p.department ? communes.find((c) => c.codeDepartement === p.department) : undefined;
  const best = named ?? inDep ?? (p.department ? undefined : communes[0]);
  const [lon, lat] = best?.centre?.coordinates ?? [];
  return typeof lat === 'number' && typeof lon === 'number' ? { lat, lon } : null;
}

async function communes(params: Record<string, string>): Promise<Commune[]> {
  const res = await fetch(`${geo()}/communes?${new URLSearchParams({ ...params, fields: 'nom,centre,codeDepartement', format: 'json' })}`, {
    signal: AbortSignal.timeout(5000),
  });
  // Une panne n'est pas « commune introuvable » : elle lève une erreur, et le lieu sera recherché plus tard.
  if (!res.ok && res.status !== 404) throw new Error(`API Géo : HTTP ${res.status}`);
  return res.ok ? ((await res.json()) as Commune[]) : [];
}

/** Le centre de la commune d'une offre ; null si on ne la trouve pas. */
export async function geocodePlace(p: Place): Promise<{ lat: number; lon: number } | null> {
  if (p.postalCode && /^\d{5}$/.test(p.postalCode)) {
    const found = pickCommune(await communes({ codePostal: p.postalCode }), { ...p, department: null });
    if (found) return found;
  }
  const name = (p.city ?? '').replace(/\(.*?\)|\b\d+(e|er|eme)?\b|arrondissement|cedex/gi, ' ').replace(/\s+/g, ' ').trim();
  if (name.length < 2) return null;
  return pickCommune(await communes({ nom: name, boost: 'population', limit: '5' }), p);
}

const memory = new Map<string, Promise<{ lat: number; lon: number } | null>>();

/** Pour une fiche d'offre affichée : le centre de sa ville, gardé en mémoire. Ne lève jamais d'erreur. */
export function geocodeCached(p: Place): Promise<{ lat: number; lon: number } | null> {
  const key = placeKey(p);
  if (!memory.has(key)) {
    if (memory.size > 2000) memory.clear();
    memory.set(key, geocodePlace(p).catch(() => null));
  }
  // Une page ne doit pas attendre la carte : au-delà de 2,5 secondes, elle s'affiche sans.
  return Promise.race([memory.get(key)!, new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500))]);
}
