import { describe, expect, it } from 'vitest';
import { completeWith, widenings } from './similar';
import type { Offer, OfferFilters } from './types';

const offer = (id: string) => ({ id, fingerprint: `fp-${id}` }) as Offer;

describe('widenings', () => {
  it('élargit d’abord les filtres secondaires, puis le lieu, puis le métier', () => {
    const w = widenings({ q: 'marketing', departments: ['69'], level: 6, easyApply: true });
    expect(w.map((x) => x.label)).toEqual([
      'Même recherche, sans les autres filtres',
      'Même métier, ailleurs en France',
      'D’autres métiers près de chez toi',
    ]);
    expect(w[0]!.filters).toMatchObject({ q: 'marketing', departments: ['69'] });
    expect(w[0]!.filters.level).toBeUndefined();
    expect(w[1]!.filters.departments).toEqual([]);
  });
});

describe('completeWith', () => {
  it('complète jusqu’au nombre demandé, sans doublon', async () => {
    const pages: Record<string, Offer[]> = { loose: [offer('a'), offer('b')], ailleurs: [offer('b'), offer('c'), offer('d')] };
    const search = async (f: OfferFilters) => ({ offers: f.level === undefined && f.departments?.length ? pages.loose! : pages.ailleurs! });
    const groups = await completeWith({ q: 'rh', departments: ['75'], level: 5 }, [offer('a')], 3, search);
    expect(groups.map((g) => [g.label, g.offers.map((o) => o.id)])).toEqual([
      ['Même recherche, sans les autres filtres', ['b']],
      ['Même métier, ailleurs en France', ['c', 'd']],
    ]);
  });
});
