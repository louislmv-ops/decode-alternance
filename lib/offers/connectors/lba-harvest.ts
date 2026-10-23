// Collecte complète de La bonne alternance, pour la base : chaque département, chaque niveau de diplôme,
// et, quand une recherche touche le plafond de l'API (150 offres par source, 450 en tout), un nouveau
// découpage par métier (codes ROME vus dans le département). Un appel toutes les 1,2 seconde : 50 par
// minute, sous la limite de 60. Compter 15 à 30 minutes pour toute la France.

import type { Offer } from '../types';
import { fetchLba, type LbaQuery, lbaQueries } from './la-bonne-alternance';

/** Au-delà, la recherche a sans doute été coupée par le plafond : on la redécoupe. */
export const NEAR_CAP = 400;
const ROMES_PER_CALL = 15;

export interface LbaHarvestReport {
  fetched: number;
  calls: number;
  /** Recherches encore coupées après découpage par métier : des offres peuvent manquer. */
  stillTruncated: string[];
}

export async function harvestLba(opts: {
  departments: string[];
  onBatch: (offers: Offer[]) => Promise<void>;
  log?: (line: string) => void;
  /** Pause entre deux appels, en millisecondes (1 200 par défaut ; 0 dans les tests). */
  spacingMs?: number;
  fetcher?: (q: LbaQuery) => Promise<Offer[]>;
}): Promise<LbaHarvestReport> {
  const log = opts.log ?? console.log;
  const fetcher = opts.fetcher ?? fetchLba;
  const spacing = opts.spacingMs ?? 1200;
  const report: LbaHarvestReport = { fetched: 0, calls: 0, stillTruncated: [] };
  let last = 0;

  const call = async (q: LbaQuery): Promise<Offer[] | null> => {
    const wait = last + spacing - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    report.calls += 1;
    try {
      return await fetcher(q);
    } catch (error) {
      log(`La bonne alternance : échec ${JSON.stringify(q)} (${(error as Error).message})`);
      return null;
    }
  };

  for (const dep of opts.departments) {
    const byId = new Map<string, Offer>();
    const truncated: LbaQuery[] = [];
    for (const q of lbaQueries(dep, [])) {
      const offers = await call(q);
      if (!offers) continue;
      for (const o of offers) byId.set(o.id, o);
      if (offers.length >= NEAR_CAP) truncated.push(q);
    }
    // Une recherche coupée : on la refait métier par métier, avec les codes ROME vus dans le département.
    if (truncated.length > 0) {
      const romes = [...new Set([...byId.values()].map((o) => o.romeCode).filter((r): r is string => Boolean(r)))].sort();
      for (const q of truncated) {
        for (let i = 0; i < romes.length; i += ROMES_PER_CALL) {
          const sub = { ...q, romes: romes.slice(i, i + ROMES_PER_CALL) };
          const offers = await call(sub);
          if (!offers) continue;
          for (const o of offers) byId.set(o.id, o);
          if (offers.length >= NEAR_CAP) report.stillTruncated.push(`${dep}${q.level ? ` niveau ${q.level}` : ''} ${sub.romes.join(',')}`);
        }
      }
    }
    const offers = [...byId.values()];
    if (offers.length > 0) await opts.onBatch(offers);
    report.fetched += offers.length;
    log(`La bonne alternance ${dep} : ${offers.length} offres (${truncated.length} recherches redécoupées)`);
  }
  return report;
}
