import { unstable_cache } from 'next/cache';
// Point d'entrée des pages : la vraie base si elle est configurée, sinon les offres d'exemple.

import type { DecodedOffer } from '@/lib/decode/schema';
import { DEMO_DECODES, DEMO_OFFERS } from './demo';
import { dedupe, filterOffers, matchesFilters, withDistance } from './filter';
import { diversify, sortOffers } from './rank';
import { canonicalQuery } from './query';
import { isAccountsConfigured } from '@/lib/account/store';
import { injectSponsored, sponsorOf } from '@/lib/sponsors/match';
import { activeSponsors } from '@/lib/sponsors/store';
import { companyRatingOf } from '@/lib/companies/store';
import { countStoredOffers, getCachedDecode, getOffer, isDatabaseConfigured, searchOffers } from './store';
import { aggregatorSearch, isAggregatorsConfigured, recallAggregatorOffer, rememberSeen } from './aggregators';
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

/** La base contient-elle des offres de La bonne alternance ? Vérifié au plus toutes les 10 minutes. */
let storedLba: { until: number; value: boolean } | null = null;

async function hasStoredLba(): Promise<boolean> {
  if (!(await hasStoredOffers())) return false;
  if (storedLba && storedLba.until > Date.now()) return storedLba.value;
  const value = await countStoredOffers('la-bonne-alternance')
    .then((n) => n > 0)
    .catch(() => false);
  storedLba = { until: Date.now() + 600_000, value };
  return value;
}

/**
 * Les API ne connaissent pas nos synonymes : elles reçoivent la forme la plus courante (« compta » : « comptable »).
 * Ni nos rayons : elles cherchent dans le département du centre, et le rayon est vérifié ensuite.
 */
const forApis = (filters: OfferFilters): OfferFilters => ({
  ...filters,
  q: canonicalQuery(filters.q),
  ...(filters.near ? { departments: [filters.near.department] } : {}),
});

async function primarySearch(filters: OfferFilters): Promise<OfferPage | null> {
  if (await hasStoredOffers()) return searchOffers(filters);
  if (isLiveConfigured()) return liveSearch(forApis(filters));
  return null;
}

/**
 * Les mêmes recherches reviennent sans cesse (l'accueil, les départements, les métiers courants) :
 * le résultat est gardé cinq minutes dans le cache partagé du serveur, au lieu d'interroger
 * France Travail et les agrégateurs à chaque visite.
 */
const cachedSearch = unstable_cache(
  async (key: string) => {
    const filters = JSON.parse(key) as OfferFilters;
    const page = await fetchOffers(filters);
    // En tête de la première page, des entreprises différentes : cinq offres du même groupe d'affilée lassent.
    const top = (filters.sort ?? 'top') === 'top' && page.page === 1;
    if (!top) return page;
    return { ...page, offers: injectSponsored(diversify(page.offers), await sponsoredFor(filters, page.offers)) };
  },
  ['offres-v3'],
  { revalidate: 300 },
);

/**
 * Les offres des entreprises qui paient la mise en avant et qui correspondent à la recherche : celles de la base
 * quand il y en a une, sinon celles de la page. Jamais une offre qui ne passe pas les filtres de la personne.
 */
async function sponsoredFor(filters: OfferFilters, pageOffers: Offer[]): Promise<Offer[]> {
  if (!isAccountsConfigured()) return [];
  const sponsors = await activeSponsors().catch(() => []);
  if (sponsors.length === 0) return [];
  const candidates = (await hasStoredOffers())
    ? (await searchOffers({ ...filters, companies: sponsors.map((s) => s.company), page: 1 }).catch(() => null))?.offers ?? []
    : pageOffers;
  return candidates.flatMap((o) => {
    const sponsor = sponsorOf(o, sponsors);
    return sponsor ? [{ ...o, sponsorId: sponsor.accountId }] : [];
  });
}

export async function listOffers(filters: OfferFilters): Promise<OfferPage> {
  const page = await cachedSearch(JSON.stringify(filters));
  rememberSeen(page.offers);
  return page;
}

async function fetchOffers(filters: OfferFilters): Promise<OfferPage> {
  // La collecte de nuit range toute La bonne alternance en base : inutile de l'interroger en plus à chaque visite.
  const withLba = !(await hasStoredLba());
  const aggregators = isAggregatorsConfigured(withLba);
  const primary = await primarySearch(filters).catch((error) => {
    // Sans agrégateur, une panne de la source principale doit se voir ; avec, ils prennent le relais.
    if (!aggregators) throw error;
    console.error(error);
    return null;
  });
  if (!aggregators) return primary ?? filterOffers(DEMO_OFFERS, filters, 'exemples');

  const pageSize = primary?.pageSize ?? 20;
  const extra = await aggregatorSearch(forApis(filters), primary ? Math.ceil(pageSize / 2) : pageSize, withLba);
  // Les agrégateurs ne savent filtrer ni la taille, ni le secteur, ni le salaire : on le fait ici.
  const kept = extra.offers.filter((o) => matchesFilters(o, filters)).map((o) => withDistance(o, filters.near));
  const offers = sortOffers(dedupe([...(primary?.offers ?? []), ...kept]), filters.sort, filters.sort === 'reviews' ? await companyRatingOf() : undefined);
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

/** De vraies offres peuvent-elles s'afficher ? Sans aucune source, le site montre les exemples fictifs. */
export function hasRealOfferSource(): boolean {
  return isDatabaseConfigured() || isLiveConfigured() || isAggregatorsConfigured(true);
}
