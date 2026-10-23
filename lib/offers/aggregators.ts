// Les sources interrogées en direct à chaque recherche, en plus de la source principale (la base ou
// France Travail) : La bonne alternance, Adzuna, Jooble. Elles n'ont pas toutes d'adresse pour relire
// une offre seule : celles qu'on a montrées sont gardées en mémoire pour leur fiche.

import { isAdzunaConfigured, searchAdzuna } from './connectors/adzuna';
import { isJoobleConfigured, searchJooble } from './connectors/jooble';
import { after } from 'next/server';
import { DEPARTMENT_NAMES } from '@/lib/departments';
import { fetchLba, isLbaConfigured, type LbaQuery, lbaQueries, pageOf } from './connectors/la-bonne-alternance';
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

/**
 * La bonne alternance plafonne chaque appel à 450 offres. Première visite : un seul appel, pour répondre vite,
 * puis la collecte complète (plusieurs appels découpés) tourne après la réponse et remplace le résultat.
 * Le tout est rafraîchi toutes les 30 minutes, sans jamais faire attendre la page.
 */
const LBA_TTL = 30 * 60_000;
const lbaStore = new Map<string, { at: number; offers: Offer[]; full: boolean }>();
const lbaHarvests = new Map<string, Promise<void>>();

// L'API accepte 60 appels par minute : on en garde une marge, pour tout le serveur.
const LBA_PER_MINUTE = 50;
let lbaCalls: number[] = [];
async function lbaSlot(): Promise<void> {
  for (;;) {
    const now = Date.now();
    lbaCalls = lbaCalls.filter((t) => now - t < 60_000);
    if (lbaCalls.length < LBA_PER_MINUTE) {
      lbaCalls.push(now);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 60_000 - (now - lbaCalls[0]!) + 50));
  }
}
const lbaCall = async (query: LbaQuery) => {
  await lbaSlot();
  return fetchLba(query);
};

async function harvestLba(department: string | undefined): Promise<Offer[]> {
  const all = Object.keys(DEPARTMENT_NAMES);
  let queries = lbaQueries(department, all);
  const byId = new Map<string, Offer>();
  // Si l'API refuse plusieurs départements dans un même appel, on repasse à un département par appel.
  if (!department) {
    try {
      for (const o of await lbaCall(queries[0]!)) byId.set(o.id, o);
      queries = queries.slice(1);
    } catch (error) {
      if (!/HTTP 400/.test(String(error))) throw error;
      queries = lbaQueries(undefined, all, 1);
    }
  }
  for (let i = 0; i < queries.length; i += 6) {
    const results = await Promise.allSettled(queries.slice(i, i + 6).map(lbaCall));
    for (const r of results) {
      if (r.status === 'fulfilled') for (const o of r.value) byId.set(o.id, o);
      else console.error(r.reason);
    }
  }
  return [...byId.values()];
}

function scheduleLbaHarvest(key: string, department: string | undefined): void {
  if (lbaHarvests.has(key)) return;
  const job = harvestLba(department)
    .then((offers) => {
      if (offers.length > 0) lbaStore.set(key, { at: Date.now(), offers, full: true });
      else throw new Error('La bonne alternance : collecte vide');
    })
    .catch((error) => {
      console.error(error);
      // En cas d'échec, on garde ce qu'on a et on ne réessaie qu'au prochain rafraîchissement.
      const entry = lbaStore.get(key);
      if (entry) lbaStore.set(key, { ...entry, at: Date.now(), full: true });
    })
    .finally(() => lbaHarvests.delete(key));
  lbaHarvests.set(key, job);
  try {
    after(() => job);
  } catch {
    // Hors d'une requête (tests, scripts) : la collecte continue simplement en tâche de fond.
  }
}

export async function lbaOffers(department: string | undefined): Promise<Offer[]> {
  const key = department ?? 'france';
  const entry = lbaStore.get(key);
  if (!entry) {
    const quick = await lbaCall(department ? { departements: [department] } : {});
    lbaStore.set(key, { at: Date.now(), offers: quick, full: false });
    scheduleLbaHarvest(key, department);
    return quick;
  }
  if (!entry.full || Date.now() - entry.at > LBA_TTL) scheduleLbaHarvest(key, department);
  return entry.offers;
}

const lba: Search = async (filters, page, perPage) => pageOf(await lbaOffers(filters.department), filters.q, page, perPage);

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
