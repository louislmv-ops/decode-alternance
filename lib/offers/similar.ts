// Peu de résultats ? Comme les grands sites d'emploi, on complète la page avec des offres proches au lieu de
// la laisser presque vide : la même recherche sans les filtres secondaires, puis ailleurs en France, puis
// d'autres métiers près de chez toi. Chaque élargissement est dit clairement.

import type { Offer, OfferFilters } from './types';

export interface Widening {
  label: string;
  filters: OfferFilters;
}

const SECONDARY: (keyof OfferFilters)[] = [
  'level',
  'contract',
  'sizes',
  'sectors',
  'withSalary',
  'sinceDays',
  'direct',
  'easyApply',
  'remote',
  'minSalaryCents',
  'skill',
];

/** Les recherches plus larges à essayer, de la plus proche à la plus éloignée. */
export function widenings(filters: OfferFilters): Widening[] {
  const base: OfferFilters = { ...filters, page: 1, sort: 'top' };
  const loose: OfferFilters = { ...base };
  for (const key of SECONDARY) delete loose[key];
  const out: Widening[] = [];
  const hasSecondary = SECONDARY.some((k) => filters[k] !== undefined && filters[k] !== false);
  if (hasSecondary) out.push({ label: 'Même recherche, sans les autres filtres', filters: loose });
  if (filters.q && filters.departments?.length) out.push({ label: 'Même métier, ailleurs en France', filters: { ...loose, departments: [] } });
  if (filters.q && filters.departments?.length) out.push({ label: 'D’autres métiers près de chez toi', filters: { ...loose, q: undefined } });
  if (filters.q && !filters.departments?.length) out.push({ label: 'D’autres offres du moment', filters: { ...loose, q: undefined } });
  if (!filters.q && filters.departments?.length) out.push({ label: 'Ailleurs en France', filters: { ...loose, departments: [] } });
  return out;
}

/** Ajoute les offres des élargissements jusqu'à `needed`, sans doublon avec celles déjà affichées. */
export async function completeWith(
  filters: OfferFilters,
  shown: Offer[],
  needed: number,
  search: (f: OfferFilters) => Promise<{ offers: Offer[] }>,
): Promise<{ label: string; offers: Offer[] }[]> {
  const seen = new Set(shown.flatMap((o) => [o.id, o.fingerprint]));
  const groups: { label: string; offers: Offer[] }[] = [];
  let missing = needed;
  for (const w of widenings(filters)) {
    if (missing <= 0) break;
    const page = await search(w.filters).catch(() => ({ offers: [] as Offer[] }));
    const fresh = page.offers.filter((o) => !o.sponsored && !seen.has(o.id) && !seen.has(o.fingerprint)).slice(0, missing);
    for (const o of fresh) seen.add(o.id).add(o.fingerprint);
    if (fresh.length > 0) groups.push({ label: w.label, offers: fresh });
    missing -= fresh.length;
  }
  return groups;
}
