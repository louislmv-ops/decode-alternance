import { describe, expect, it } from 'vitest';
import { DEMO_OFFERS } from './demo';
import { attractiveness, diversify, sortOffers } from './rank';

const now = Date.parse('2026-10-20T12:00:00Z');
const base = { ...DEMO_OFFERS[0]!, schoolFlags: [], direct: false, companySize: null, diplomaLevel: null, salaryMonthlyCents: null, title: 'Vendeur', publishedAt: '2026-10-20T08:00:00Z' };

describe('attractiveness', () => {
  it('met devant les grandes entreprises, les bons salaires et les postes qualifiés', () => {
    const plain = attractiveness(base, now);
    expect(attractiveness({ ...base, companySize: 'grande' }, now)).toBeGreaterThan(plain);
    expect(attractiveness({ ...base, salaryMonthlyCents: 180_000 }, now)).toBeGreaterThan(plain);
    expect(attractiveness({ ...base, title: 'Ingénieur data' }, now)).toBeGreaterThan(plain);
  });
  it('ne fait pas passer un poste d’exécution bien payé devant un poste qualifié d’un grand groupe', () => {
    const security = attractiveness({ ...base, title: 'Futur Agent de Sécurité', companySize: 'grande', salaryMonthlyCents: 186_700 }, now);
    const pm = attractiveness({ ...base, title: 'Chef de projet marketing', companySize: 'grande', diplomaLevel: 7, salaryMonthlyCents: null }, now);
    expect(pm).toBeGreaterThan(security);
  });
  it('fait reculer les offres anciennes', () => {
    expect(attractiveness({ ...base, publishedAt: '2026-09-01T08:00:00Z' }, now)).toBeLessThan(attractiveness(base, now));
  });
});

describe('sortOffers', () => {
  it('trie par date quand on le demande', () => {
    const old = { ...base, id: 'a', companySize: 'grande' as const, publishedAt: '2026-10-01T08:00:00Z' };
    const fresh = { ...base, id: 'b' };
    expect(sortOffers([old, fresh], 'recent').map((o) => o.id)).toEqual(['b', 'a']);
  });
});

describe('tri par salaire et par avis', () => {
  it('met les salaires annoncés les plus hauts devant, les offres sans montant après', () => {
    const a = { ...base, id: 'a', salaryMonthlyCents: 120_000 };
    const b = { ...base, id: 'b', salaryMonthlyCents: 180_000 };
    const c = { ...base, id: 'c', salaryMonthlyCents: null };
    expect(sortOffers([c, a, b], 'salary').map((o) => o.id)).toEqual(['b', 'a', 'c']);
  });
  it('met les entreprises les mieux notées devant', () => {
    const a = { ...base, id: 'a', company: 'Alpha' };
    const b = { ...base, id: 'b', company: 'Beta' };
    const c = { ...base, id: 'c', company: 'Gamma' };
    const notes: Record<string, number> = { Alpha: 3.2, Beta: 4.6 };
    expect(sortOffers([c, a, b], 'reviews', (o) => notes[o.company ?? ''] ?? null).map((o) => o.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('diversify', () => {
  const o = (company: string | null, n: number) => ({ company, n });
  it('met des entreprises différentes en tête, sans perdre d’offre', () => {
    const list = [o('Alpha', 1), o('ALPHA', 2), o('Alpha', 3), o('Beta', 4), o(null, 5), o('Gamma', 6), o('Delta', 7)];
    expect(diversify(list, 4).map((x) => x.n)).toEqual([1, 4, 5, 6, 2, 3, 7]);
  });
  it('ne change rien quand les entreprises sont déjà variées', () => {
    const list = [o('A', 1), o('B', 2), o('C', 3)];
    expect(diversify(list)).toEqual(list);
  });
});
