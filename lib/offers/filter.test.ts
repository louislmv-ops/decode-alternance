import { describe, expect, it } from 'vitest';
import { DEMO_OFFERS } from './demo';
import { dedupe, filterOffers, filtersQuery, filtersWithPlace, matchesFilters, parseFilters } from './filter';

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
    expect(filterOffers(DEMO_OFFERS, { departments: ['35'] }, 'exemples').offers.map((o) => o.company)).toEqual(['Kerlog Solutions']);
    expect(filterOffers(DEMO_OFFERS, { sizes: ['grande'] }, 'exemples').total).toBe(2);
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
    expect(parseFilters({ dep: 'abc', niveau: '9', contrat: 'cdi', page: '-2', taille: 'geante', secteur: 'Z', depuis: '3' })).toEqual({
      q: undefined,
      departments: [],
      contract: undefined,
      level: undefined,
      sizes: [],
      sectors: [],
      withSalary: false,
      sinceDays: undefined,
      direct: false,
      easyApply: false,
      sort: 'top',
      page: 1,
    });
  });
  it('lit des filtres valides, plusieurs départements et l’ancienne adresse « grandes »', () => {
    expect(
      parseFilters({ dep: ['2a', '75', '75'], niveau: '6', contrat: 'apprentissage', grandes: '1', taille: 'pme', secteur: ['m18', 'D'], simple: '1', tri: 'recent', depuis: '7' }),
    ).toMatchObject({
      departments: ['2A', '75'],
      level: 6,
      contract: 'apprentissage',
      sizes: ['pme', 'grande'],
      sectors: ['M18', 'D'],
      easyApply: true,
      sort: 'recent',
      sinceDays: 7,
    });
  });
});

describe('lieu mémorisé', () => {
  it('reprend les départements du cookie quand l’adresse ne dit rien du lieu', () => {
    expect(filtersWithPlace({}, '69.38').departments).toEqual(['69', '38']);
    expect(filtersWithPlace({}, 'fr').departments).toEqual([]);
    expect(filtersWithPlace({ dep: 'fr' }, '69').departments).toEqual([]);
    expect(filtersWithPlace({ dep: '13' }, '69').departments).toEqual(['13']);
  });
  it('écrit une adresse qui se relit à l’identique', () => {
    const f = parseFilters({ dep: ['75', '92'], taille: 'grande', simple: '1' });
    expect(parseFilters(Object.fromEntries([...new Set(filtersQuery(f).keys())].map((k) => [k, filtersQuery(f).getAll(k)])))).toEqual(f);
  });
});

describe('matchesFilters', () => {
  const base = DEMO_OFFERS.find((o) => o.schoolFlags.length === 0)!;
  it('écarte une donnée inconnue quand le filtre la demande', () => {
    expect(matchesFilters({ ...base, romeCode: null }, { sectors: ['D'] })).toBe(false);
    expect(matchesFilters({ ...base, romeCode: 'D1402' }, { sectors: ['D'] })).toBe(true);
    expect(matchesFilters({ ...base, romeCode: 'M1805' }, { sectors: ['M'] })).toBe(false);
    expect(matchesFilters({ ...base, romeCode: 'M1805' }, { sectors: ['M18'] })).toBe(true);
    expect(matchesFilters({ ...base, easyApply: false }, { easyApply: true })).toBe(false);
  });
  it('filtre par date de publication', () => {
    const now = Date.parse('2026-10-20T12:00:00Z');
    expect(matchesFilters({ ...base, publishedAt: '2026-10-19T12:00:00Z' }, { sinceDays: 7 }, now)).toBe(true);
    expect(matchesFilters({ ...base, publishedAt: '2026-10-01T12:00:00Z' }, { sinceDays: 7 }, now)).toBe(false);
  });
});

describe('plusieurs départements', () => {
  const base = DEMO_OFFERS.find((o) => o.schoolFlags.length === 0)!;
  it('écarte un département connu hors sélection, garde un lieu inconnu', () => {
    expect(matchesFilters({ ...base, department: '75' }, { departments: ['69', '13'] })).toBe(false);
    expect(matchesFilters({ ...base, department: '13' }, { departments: ['69', '13'] })).toBe(true);
    expect(matchesFilters({ ...base, department: null }, { departments: ['69'] })).toBe(true);
  });
});

describe('télétravail, salaire minimum et compétence', () => {
  const base = DEMO_OFFERS[0]!;
  const offer = (description: string, salaryMonthlyCents: number | null = 140000) => ({ ...base, description, salaryMonthlyCents, schoolFlags: [] });

  it('lit les filtres de l’adresse et les y remet', () => {
    const f = parseFilters({ teletravail: '1', salairemin: '1400', competence: 'excel' });
    expect(f).toMatchObject({ remote: 'partiel', minSalaryCents: 140000, skill: 'excel' });
    const q = filtersQuery(f);
    expect([q.get('teletravail'), q.get('salairemin'), q.get('competence')]).toEqual(['1', '1400', 'excel']);
  });

  it('ignore les valeurs inventées', () => {
    expect(parseFilters({ teletravail: 'oui', salairemin: '1337', competence: 'cobol' })).toMatchObject({ remote: undefined, minSalaryCents: undefined, skill: undefined });
  });

  it('« télétravail » garde le partiel et le complet, pas les annonces muettes', () => {
    expect(matchesFilters(offer('Télétravail 2 jours'), { remote: 'partiel' })).toBe(true);
    expect(matchesFilters(offer('Full remote'), { remote: 'partiel' })).toBe(true);
    expect(matchesFilters(offer('Full remote'), { remote: 'total' })).toBe(true);
    expect(matchesFilters(offer('Télétravail 2 jours'), { remote: 'total' })).toBe(false);
    expect(matchesFilters(offer('Rien à ce sujet'), { remote: 'partiel' })).toBe(false);
  });

  it('le salaire minimum écarte les offres sans montant', () => {
    expect(matchesFilters(offer('x', 140000), { minSalaryCents: 140000 })).toBe(true);
    expect(matchesFilters(offer('x', 120000), { minSalaryCents: 140000 })).toBe(false);
    expect(matchesFilters(offer('x', null), { minSalaryCents: 100000 })).toBe(false);
  });

  it('la compétence doit être citée', () => {
    expect(matchesFilters(offer('Excel avancé'), { skill: 'excel' })).toBe(true);
    expect(matchesFilters(offer('Word'), { skill: 'excel' })).toBe(false);
  });
});
