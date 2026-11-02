import { describe, expect, it } from 'vitest';
import { DEMO_OFFERS } from '../demo';
import type { Offer } from '../types';
import type { LbaQuery } from './la-bonne-alternance';
import { harvestLba, NEAR_CAP } from './lba-harvest';
import { lbaCapped, LBA_PER_SOURCE_CAP } from './la-bonne-alternance';

const base = DEMO_OFFERS[0]!;
const make = (id: string, rome: string): Offer => ({ ...base, id: `la-bonne-alternance:${id}`, source: 'la-bonne-alternance', romeCode: rome });

describe('collecte complète de La bonne alternance', () => {
  it('redécoupe par métier une recherche qui touche le plafond', async () => {
    const queries: LbaQuery[] = [];
    // Sans niveau : 450 offres (plafond atteint), réparties sur deux métiers ; par métier, 300 de plus chacun.
    const fetcher = async (q: LbaQuery) => {
      queries.push(q);
      if (q.romes) return q.romes.flatMap((r) => Array.from({ length: 300 }, (_, i) => make(`${r}-${i}`, r)));
      if (!q.level) return Array.from({ length: NEAR_CAP + 50 }, (_, i) => make(`a${i}`, i % 2 ? 'M1805' : 'D1402'));
      return [make(`n${q.level}`, 'D1402')];
    };
    const stored: Offer[] = [];
    const report = await harvestLba({ departments: ['75'], onBatch: async (o) => void stored.push(...o), spacingMs: 0, fetcher, log: () => {} });
    expect(queries.filter((q) => q.romes)).toHaveLength(1);
    expect(queries.find((q) => q.romes)?.romes).toEqual(['D1402', 'M1805']);
    expect(report.fetched).toBe(450 + 5 + 600);
    expect(stored).toHaveLength(report.fetched);
    expect(report.stillTruncated).toHaveLength(1);
  });

  it('redécoupe aussi quand une seule source touche son plafond, même loin des 450', async () => {
    const queries: LbaQuery[] = [];
    // Sans niveau : 150 offres d'une source (plafond) et 20 d'une autre : 170 en tout, bien sous NEAR_CAP.
    const fetcher = async (q: LbaQuery) => {
      queries.push(q);
      if (q.romes) return { offers: q.romes.map((r) => make(`r-${r}`, r)), capped: false };
      if (!q.level) return { offers: Array.from({ length: 170 }, (_, i) => make(`b${i}`, 'M1705')), capped: true };
      return { offers: [], capped: false };
    };
    const report = await harvestLba({ departments: ['75'], onBatch: async () => {}, spacingMs: 0, fetcher, log: () => {} });
    expect(queries.filter((q) => q.romes)).toHaveLength(1);
    expect(report.stillTruncated).toHaveLength(0);
  });

  it('continue quand un appel échoue', async () => {
    const fetcher = async (q: LbaQuery) => {
      if (q.level === '5') throw new Error('HTTP 500');
      return [make(`x${q.level ?? 0}`, 'D1402')];
    };
    const report = await harvestLba({ departments: ['69'], onBatch: async () => {}, spacingMs: 0, fetcher, log: () => {} });
    expect(report.fetched).toBe(5);
  });
});

describe('plafond par source de La bonne alternance', () => {
  const job = (label: string) => ({ identifier: { partner_label: label } });
  it('repère une source arrivée à 150, pas un total de 300 réparti', () => {
    expect(lbaCapped([...Array.from({ length: LBA_PER_SOURCE_CAP }, () => job('France Travail')), job('La bonne alternance')])).toBe(true);
    expect(lbaCapped([...Array.from({ length: 149 }, () => job('France Travail')), ...Array.from({ length: 149 }, () => job('Autre'))])).toBe(false);
  });
});
