// Recherche en direct dans l'API France Travail, sans base de données : chaque recherche interroge
// l'API, donc les offres sont toujours celles du jour. Un petit cache évite de répéter la même
// requête plusieurs fois par minute.

import { fetchText } from './connectors/http';
import { alternanceNatureCodes, API, cachedFtToken, toOffer, type FtOffer } from './connectors/france-travail';
import { matchesFilters } from './filter';
import { normalizeText } from './normalize';
import { sortOffers } from './rank';
import type { Offer, OfferFilters, OfferPage } from './types';

export const LIVE_PAGE = 20;
const TTL = 10 * 60_000;
/** L'API refuse de paginer au-delà de la 3 150e offre d'une recherche. */
const MAX_RANGE = 3149;
const cache = new Map<string, { until: number; value: unknown }>();

async function remember<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.value as T;
  const value = await load();
  if (cache.size > 500) cache.clear();
  cache.set(key, { until: Date.now() + TTL, value });
  return value;
}

export function isLiveConfigured(): boolean {
  return Boolean(process.env.FRANCE_TRAVAIL_CLIENT_ID && process.env.FRANCE_TRAVAIL_CLIENT_SECRET);
}

async function token(): Promise<string> {
  return cachedFtToken(process.env.FRANCE_TRAVAIL_CLIENT_ID!, process.env.FRANCE_TRAVAIL_CLIENT_SECRET!);
}

async function get(path: string): Promise<{ status: number; text: string; headers: Headers }> {
  return fetchText(`${API}${path}`, { headers: { Authorization: `Bearer ${await token()}`, Accept: 'application/json' } });
}

export async function liveSearch(filters: OfferFilters): Promise<OfferPage> {
  const natures = await remember('natures', async () => alternanceNatureCodes(await token()));
  // Une requête par nature de contrat (apprentissage, professionnalisation) et par département choisi.
  const places: (string | undefined)[] = filters.departments?.length ? filters.departments : [undefined];
  const per = Math.max(1, Math.ceil(LIVE_PAGE / Math.max(1, natures.length * places.length)));
  const page = Math.min(Math.max(1, filters.page ?? 1), Math.floor(MAX_RANGE / per));
  const results = await Promise.all(
    natures.flatMap((nature) =>
      places.map((place) =>
        remember(`s:${nature}:${filters.q ?? ''}:${place ?? ''}:${page}:${per}`, async () => {
          const params = new URLSearchParams({ natureContrat: nature, sort: '1', range: `${(page - 1) * per}-${page * per - 1}` });
          if (filters.q) params.set('motsCles', normalizeText(filters.q).split(' ').slice(0, 5).join(','));
          if (place) params.set('departement', place);
          const res = await get(`/offres/search?${params}`);
          if (res.status === 204) return { offers: [] as Offer[], total: 0 };
          if (res.status !== 200 && res.status !== 206) throw new Error(`France Travail : HTTP ${res.status}`);
          const offers = ((JSON.parse(res.text) as { resultats?: FtOffer[] }).resultats ?? []).map(toOffer);
          return { offers, total: Number(res.headers.get('content-range')?.split('/')[1] ?? offers.length) };
        }),
      ),
    ),
  );
  const offers = sortOffers(
    results.flatMap((r) => r.offers).filter((o) => matchesFilters(o, filters)),
    filters.sort,
  );
  return { offers, total: results.reduce((n, r) => n + r.total, 0), page, pageSize: LIVE_PAGE, mode: 'direct', maxPage: Math.floor(MAX_RANGE / per) };
}

export async function liveOffer(sourceId: string): Promise<Offer | null> {
  return remember(`o:${sourceId}`, async () => {
    const res = await get(`/offres/${encodeURIComponent(sourceId)}`);
    if (res.status !== 200) return null;
    return toOffer(JSON.parse(res.text) as FtOffer);
  });
}
