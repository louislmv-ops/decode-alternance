import { describe, expect, it } from 'vitest';
import { DEMO_OFFERS } from './demo';
import { attractiveness, sortOffers } from './rank';

const now = Date.parse('2026-10-20T12:00:00Z');
const base = { ...DEMO_OFFERS[0]!, schoolFlags: [], direct: false, companySize: null, diplomaLevel: null, salaryMonthlyCents: null, title: 'Vendeur', publishedAt: '2026-10-20T08:00:00Z' };

describe('attractiveness', () => {
  it('met devant les grandes entreprises, les bons salaires et les postes qualifiés', () => {
    const plain = attractiveness(base, now);
    expect(attractiveness({ ...base, companySize: 'grande' }, now)).toBeGreaterThan(plain);
    expect(attractiveness({ ...base, salaryMonthlyCents: 180_000 }, now)).toBeGreaterThan(plain);
    expect(attractiveness({ ...base, title: 'Ingénieur data' }, now)).toBeGreaterThan(plain);
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
