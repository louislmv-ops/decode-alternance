import { describe, expect, it } from 'vitest';
import { DEMO_OFFERS } from './demo';
import { dedupe, filterOffers, parseFilters } from './filter';

describe('dedupe', () => {
  it('ne garde qu’une fois une offre publiée deux fois', () => {
    const unique = dedupe(DEMO_OFFERS);
    expect(unique.length).toBe(DEMO_OFFERS.length - 1);
    expect(unique.filter((o) => o.company === 'Groupe Orvane')).toHaveLength(1);
  });
});

describe('filterOffers', () => {
  it('ne liste jamais les offres d’écoles déguisées', () => {
    const listed = filterOffers(DEMO_OFFERS, {}, 'exemples').offers;
    expect(DEMO_OFFERS.some((o) => o.schoolFlags.length > 0)).toBe(true);
    expect(listed.some((o) => o.schoolFlags.length > 0)).toBe(false);
  });

  it('filtre par département et par grande entreprise', () => {
    expect(filterOffers(DEMO_OFFERS, { department: '35' }, 'exemples').offers.map((o) => o.company)).toEqual(['Kerlog Solutions']);
    expect(filterOffers(DEMO_OFFERS, { bigCompany: true }, 'exemples').total).toBe(2);
  });
  it('cherche dans l’intitulé sans tenir compte des accents', () => {
    expect(filterOffers(DEMO_OFFERS, { q: 'developpeur' }, 'exemples').total).toBe(1);
  });
  it('garde les offres accessibles avec le niveau donné', () => {
    const forBac2 = filterOffers(DEMO_OFFERS, { level: 5 }, 'exemples').offers;
    expect(forBac2.every((o) => o.diplomaLevel === null || o.diplomaLevel <= 5)).toBe(true);
  });
});

describe('parseFilters', () => {
  it('ignore les valeurs invalides', () => {
    expect(parseFilters({ dep: 'abc', niveau: '9', contrat: 'cdi', page: '-2' })).toEqual({
      q: undefined,
      department: undefined,
      contract: undefined,
      level: undefined,
      bigCompany: false,
      direct: false,
      page: 1,
    });
  });
  it('lit des filtres valides', () => {
    expect(parseFilters({ dep: '2a', niveau: '6', contrat: 'apprentissage', grandes: '1' })).toMatchObject({
      department: '2A',
      level: 6,
      contract: 'apprentissage',
      bigCompany: true,
    });
  });
});
