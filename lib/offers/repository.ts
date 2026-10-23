// Point d'entrée des pages : la vraie base si elle est configurée, sinon les offres d'exemple.

import type { DecodedOffer } from '@/lib/decode/schema';
import { DEMO_DECODES, DEMO_OFFERS } from './demo';
import { dedupe, filterOffers } from './filter';
import { countStoredOffers, getCachedDecode, getOffer, isDatabaseConfigured, searchOffers } from './store';
import { aggregatorSearch, isAggregatorsConfigured, recallAggregatorOffer } from './aggregators';
import { isLiveConfigured, liveOffer, liveSearch } from './live';
import type { Offer, OfferFilters, OfferPage } from './types';

/**
 * La base sert aussi aux comptes : elle ne remplace la recherche en direct que si la collecte
 * l'a vraiment remplie. Vérifié au plus toutes les 10 minutes.
 */
let stored: { until: number; value: boolean } | null = null;

async function hasStoredOffers(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  if (stored && stored.until > Date.now()) return stored.value;
  let value = false;
  try {
    value = await countStoredOffers().then((n) => n > 0);
  } catch {
    value = false;
  }
  stored = { until: Date.now() + 600_000, value };
  return value;
}

/** Les filtres que les agrégateurs ne savent pas appliquer eux-mêmes. */
function keepAggregated(o: Offer, filters: OfferFilters): boolean {
  if (o.schoolFlags.length > 0) return false;
  if (filters.contract && o.contract !== filters.contract && o.contract !== 'alternance') return false;
  if (filters.level && o.diplomaLevel !== null && o.diplomaLevel > filters.level) return false;
  // Taille d'entreprise inconnue et jamais en direct : ces deux filtres les écartent.
  return !filters.bigCompany && !filters.direct;
}

async function primarySearch(filters: OfferFilters): Promise<OfferPage | null> {
  if (await hasStoredOffers()) return searchOffers(filters);
  if (isLiveConfigured()) return liveSearch(filters);
  return null;
}

export async function listOffers(filters: OfferFilters): Promise<OfferPage> {
  const aggregators = isAggregatorsConfigured();
  const primary = await primarySearch(filters).catch((error) => {
    // Sans agrégateur, une panne de la source principale doit se voir ; avec, ils prennent le relais.
    if (!aggregators) throw error;
    console.error(error);
    return null;
  });
  if (!aggregators) return primary ?? filterOffers(DEMO_OFFERS, filters, 'exemples');

  const pageSize = primary?.pageSize ?? 20;
  const extra = await aggregatorSearch(filters, primary ? Math.ceil(pageSize / 2) : pageSize);
  const kept = extra.offers.filter((o) => keepAggregated(o, filters));
  const offers = dedupe([...(primary?.offers ?? []), ...kept]).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return {
    offers,
    total: (primary?.total ?? 0) + extra.total,
    page: Math.max(1, filters.page ?? 1),
    pageSize: Math.max(pageSize, offers.length),
    mode: primary?.mode === 'base' ? 'base' : 'direct',
    maxPage: primary?.maxPage,
  };
}

export async function findOffer(id: string): Promise<Offer | null> {
  if (id.startsWith('exemple:')) return dedupe(DEMO_OFFERS).find((o) => o.id === id) ?? null;
  if (await hasStoredOffers()) {
    const offer = await getOffer(id).catch(() => null);
    if (offer) return offer;
  }
  if (isLiveConfigured() && id.startsWith('france-travail:')) return liveOffer(id.slice('france-travail:'.length));
  if (id.startsWith('adzuna:') || id.startsWith('jooble:') || id.startsWith('la-bonne-alternance:')) return recallAggregatorOffer(id);
  return null;
}

/** Traduction déjà disponible sans appeler l'IA : celle des exemples, ou celle gardée en base. */
export async function findDecode(id: string): Promise<DecodedOffer | null> {
  if (id.startsWith('exemple:')) return DEMO_DECODES[id] ?? null;
  if (!(await hasStoredOffers())) return memoryDecodes.get(id) ?? null;
  return (await getCachedDecode(id).catch(() => null)) ?? memoryDecodes.get(id) ?? null;
}

/** Sans base, les traductions sont gardées en mémoire le temps que le serveur tourne. */
const memoryDecodes = new Map<string, DecodedOffer>();

export function rememberDecode(id: string, decoded: DecodedOffer) {
  if (memoryDecodes.size > 2000) memoryDecodes.clear();
  memoryDecodes.set(id, decoded);
}
