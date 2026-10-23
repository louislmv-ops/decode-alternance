// Les sources interrogées en direct à chaque recherche, en plus de la source principale (la base ou
// France Travail) : La bonne alternance, Adzuna, Jooble. Elles n'ont pas toutes d'adresse pour relire
// une offre seule : celles qu'on a montrées sont gardées en mémoire pour leur fiche.

import { isAdzunaConfigured, searchAdzuna } from './connectors/adzuna';
import { isJoobleConfigured, searchJooble } from './connectors/jooble';
import { fetchLba, isLbaConfigured, pageOf } from './connectors/la-bonne-alternance';
import type { Offer, OfferFilters } from './types';

type Result = { offers: Offer[]; total: number };
type Search = (filters: OfferFilters, page: number, perPage: number) => Promise<Result>;

const cache = new Map<string, { until: number; value: unknown }>();
const seen = new Map<string, Offer>();

async function remember<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.value as T;
  const value = await load();
  if (cache.size > 500) cache.clear();
  cache.set(key, { until: Date.now() + ttlMs, value });
  return value;
}

/** La bonne alternance : tout un département d'un coup, gardé 30 minutes, puis filtré ici. */
const lba: Search = async (filters, page, perPage) => {
  const all = await remember(`lba:${filters.department ?? 'france'}`, 30 * 60_000, () => fetchLba(filters.department));
  return pageOf(all, filters.q, page, perPage);
};

const adzuna: Search = (filters, page, perPage) =>
  remember(`adzuna:${filters.q ?? ''}:${filters.department ?? ''}:${page}:${perPage}`, 10 * 60_000, () =>
    searchAdzuna({ q: filters.q, department: filters.department, page, perPage }),
  );

/**
 * Jooble n'accorde que 500 requêtes : seulement la première page, gardée 12 heures, et au plus
 * JOOBLE_DAILY appels par jour et par serveur.
 */
const JOOBLE_DAILY = Number(process.env.JOOBLE_DAILY || 15);
let joobleDay = { date: '', calls: 0 };
const jooble: Search = async (filters, page, perPage) => {
  if (page > 1) return { offers: [], total: 0 };
  return remember(`jooble:${filters.q ?? ''}:${filters.department ?? ''}`, 12 * 3_600_000, async () => {
    const today = new Date().toISOString().slice(0, 10);
    if (joobleDay.date !== today) joobleDay = { date: today, calls: 0 };
    if (joobleDay.calls >= JOOBLE_DAILY) return { offers: [], total: 0 };
    joobleDay.calls += 1;
    return searchJooble({ q: filters.q, department: filters.department, page: 1, perPage });
  });
};

function sources(): Search[] {
  const list: Search[] = [];
  if (isLbaConfigured()) list.push(lba);
  if (isAdzunaConfigured()) list.push(adzuna);
  if (isJoobleConfigured()) list.push(jooble);
  return list;
}

export function isAggregatorsConfigured(): boolean {
  return sources().length > 0;
}

/** Une page de chaque source. Une source en panne ne bloque pas les autres. */
export async function aggregatorSearch(filters: OfferFilters, perSource: number): Promise<Result> {
  const page = Math.max(1, filters.page ?? 1);
  const results = await Promise.allSettled(sources().map((search) => search(filters, page, perSource)));
  const ok = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
  for (const r of results) if (r.status === 'rejected') console.error(r.reason);
  const offers = ok.flatMap((r) => r.offers);
  if (seen.size > 5000) seen.clear();
  for (const o of offers) seen.set(o.id, o);
  return { offers, total: ok.reduce((n, r) => n + r.total, 0) };
}

/** La fiche d'une offre déjà montrée dans une liste. */
export function recallAggregatorOffer(id: string): Offer | null {
  return seen.get(id) ?? null;
}
