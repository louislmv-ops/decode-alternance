// Les agrégateurs (Adzuna, Jooble) sont interrogés en direct à chaque recherche, en plus de la source
// principale (la base ou France Travail). Ils n'ont pas d'adresse pour relire une offre seule : celles
// qu'on a montrées sont gardées en mémoire pour leur fiche.

import { isAdzunaConfigured, searchAdzuna } from './connectors/adzuna';
import { isJoobleConfigured, searchJooble } from './connectors/jooble';
import type { Offer, OfferFilters } from './types';

const TTL = 10 * 60_000;
const cache = new Map<string, { until: number; value: { offers: Offer[]; total: number } }>();
const seen = new Map<string, Offer>();

type Search = (opts: { q?: string; department?: string; page: number; perPage: number }) => Promise<{ offers: Offer[]; total: number }>;

function sources(): [string, Search][] {
  const list: [string, Search][] = [];
  if (isAdzunaConfigured()) list.push(['adzuna', searchAdzuna]);
  if (isJoobleConfigured()) list.push(['jooble', searchJooble]);
  return list;
}

export function isAggregatorsConfigured(): boolean {
  return sources().length > 0;
}

/** Une page de chaque agrégateur. Une source en panne ne bloque pas les autres. */
export async function aggregatorSearch(filters: OfferFilters, perSource: number): Promise<{ offers: Offer[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const results = await Promise.allSettled(
    sources().map(async ([name, search]) => {
      const key = `${name}:${filters.q ?? ''}:${filters.department ?? ''}:${page}:${perSource}`;
      const hit = cache.get(key);
      if (hit && hit.until > Date.now()) return hit.value;
      const value = await search({ q: filters.q, department: filters.department, page, perPage: perSource });
      if (cache.size > 500) cache.clear();
      cache.set(key, { until: Date.now() + TTL, value });
      return value;
    }),
  );
  const ok = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
  for (const r of results) if (r.status === 'rejected') console.error(r.reason);
  const offers = ok.flatMap((r) => r.offers);
  if (seen.size > 5000) seen.clear();
  for (const o of offers) seen.set(o.id, o);
  return { offers, total: ok.reduce((n, r) => n + r.total, 0) };
}

/** La fiche d'une offre d'agrégateur déjà montrée dans une liste. */
export function recallAggregatorOffer(id: string): Offer | null {
  return seen.get(id) ?? null;
}
