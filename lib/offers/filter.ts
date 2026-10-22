import { normalizeText } from './normalize';
import { SOURCE_PRIORITY, type Offer, type OfferFilters, type OfferPage } from './types';

export const PAGE_SIZE = 20;

/** Garde une seule offre par empreinte, celle de la source la plus directe, et note les autres sources. */
export function dedupe(offers: Offer[]): Offer[] {
  const byPrint = new Map<string, Offer[]>();
  for (const offer of offers) {
    const list = byPrint.get(offer.fingerprint) ?? [];
    list.push(offer);
    byPrint.set(offer.fingerprint, list);
  }
  return [...byPrint.values()].map((group) => {
    const sorted = [...group].sort(
      (a, b) =>
        SOURCE_PRIORITY.indexOf(a.source) - SOURCE_PRIORITY.indexOf(b.source) ||
        b.publishedAt.localeCompare(a.publishedAt),
    );
    const [best, ...others] = sorted as [Offer, ...Offer[]];
    return { ...best, alsoOn: [...new Set(others.map((o) => o.source).filter((s) => s !== best.source))] };
  });
}

/** Le même filtrage que la requête SQL, pour les offres d'exemple. */
export function filterOffers(offers: Offer[], filters: OfferFilters, mode: OfferPage['mode']): OfferPage {
  const words = normalizeText(filters.q ?? '').split(' ').filter(Boolean);
  const matching = dedupe(offers)
    .filter((o) => {
      // Les offres d'écoles déguisées ne sont jamais listées.
      if (o.schoolFlags.length > 0) return false;
      if (filters.department && o.department !== filters.department) return false;
      if (filters.contract && o.contract !== filters.contract) return false;
      if (filters.level && o.diplomaLevel !== null && o.diplomaLevel > filters.level) return false;
      if (filters.bigCompany && o.companySize !== 'grande') return false;
      if (filters.direct && !o.direct) return false;
      if (words.length > 0) {
        const hay = normalizeText(`${o.title} ${o.company ?? ''} ${o.city ?? ''}`);
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const page = Math.max(1, filters.page ?? 1);
  return {
    offers: matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: matching.length,
    page,
    pageSize: PAGE_SIZE,
    mode,
  };
}

/** Lit les filtres d'une URL de recherche, en ignorant ce qui n'est pas valide. */
export function parseFilters(params: Record<string, string | string[] | undefined>): OfferFilters {
  const one = (key: string) => {
    const v = params[key];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const level = Number(one('niveau'));
  const contract = one('contrat');
  const department = one('dep')?.toUpperCase();
  return {
    q: one('q')?.slice(0, 120),
    department: department && /^(\d{2,3}|2[AB])$/.test(department) ? department : undefined,
    contract: contract === 'apprentissage' || contract === 'professionnalisation' ? contract : undefined,
    level: level >= 3 && level <= 7 ? (level as OfferFilters['level']) : undefined,
    bigCompany: one('grandes') === '1',
    direct: one('direct') === '1',
    page: Math.max(1, Number(one('page')) || 1),
  };
}
