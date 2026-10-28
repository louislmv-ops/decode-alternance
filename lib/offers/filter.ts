import { detailsOf } from './details';
import { MIN_SALARIES, SKILL_OPTIONS } from './filter-options';
import { matchesQuery } from './query';
import { distanceKm } from '@/lib/geo';
import { decodeNearCookie, encodeCenter, MAX_DEPARTMENTS, parseNear } from '@/lib/place';
import { type OfferSort, SORT_OPTIONS, sortOffers } from './rank';
import { SECTOR_CODES, sectorOf } from './sectors';
import { type CompanySizeTag, SOURCE_PRIORITY, type Offer, type OfferFilters, type OfferPage } from './types';

export const PAGE_SIZE = 20;

/** Garde une seule offre par empreinte, celle de la source la plus directe, et note les autres sources. */
export function dedupe(offers: Offer[]): Offer[] {
  const byPrint = new Map<string, Offer[]>();
  for (const offer of offers) {
    const list = byPrint.get(offer.fingerprint) ?? [];
    list.push(offer);
    byPrint.set(offer.fingerprint, list);
  }
  return [...byPrint.values()].map((group) => {
    const sorted = [...group].sort(
      (a, b) =>
        SOURCE_PRIORITY.indexOf(a.source) - SOURCE_PRIORITY.indexOf(b.source) ||
        b.publishedAt.localeCompare(a.publishedAt),
    );
    const [best, ...others] = sorted as [Offer, ...Offer[]];
    return { ...best, alsoOn: [...new Set(others.map((o) => o.source).filter((s) => s !== best.source))] };
  });
}

/**
 * Les filtres qu'une source ne sait pas appliquer elle-même (taille, secteur, salaire, date…), vérifiés ici.
 * Une donnée inconnue (taille, secteur) ne passe pas un filtre qui la demande.
 */
export function matchesFilters(o: Offer, filters: OfferFilters, now = Date.now()): boolean {
  // Les offres d'écoles déguisées ne sont jamais listées.
  if (o.schoolFlags.length > 0) return false;
  if (filters.near && !isNear(o, filters.near)) return false;
  // Un département connu hors de la sélection (Jooble ne cherche qu'un lieu, par exemple).
  if (!filters.near && filters.departments?.length && o.department && !filters.departments.includes(o.department)) return false;
  if (filters.contract && o.contract !== filters.contract && o.contract !== 'alternance') return false;
  if (filters.level && o.diplomaLevel !== null && o.diplomaLevel > filters.level) return false;
  if (filters.sizes?.length && (!o.companySize || !filters.sizes.includes(o.companySize))) return false;
  if (filters.sectors?.length) {
    const sector = sectorOf(o.romeCode);
    if (!sector || !filters.sectors.includes(sector)) return false;
  }
  if (filters.withSalary && o.salaryMonthlyCents === null) return false;
  if (filters.sinceDays && now - Date.parse(o.publishedAt) > filters.sinceDays * 86_400_000) return false;
  if (filters.direct && !o.direct) return false;
  if (filters.easyApply && !o.easyApply) return false;
  if (filters.minSalaryCents && (o.salaryMonthlyCents === null || o.salaryMonthlyCents < filters.minSalaryCents)) return false;
  if (filters.remote || filters.skill) {
    const details = detailsOf(o);
    if (filters.remote === 'total' && details.remote !== 'total') return false;
    if (filters.remote === 'partiel' && details.remote !== 'partiel' && details.remote !== 'total') return false;
    if (filters.skill && !details.skills.includes(filters.skill)) return false;
  }
  return true;
}

/**
 * Dans le rayon ? Une offre sans position n'est gardée que dans le département du centre : mieux vaut une offre
 * un peu loin qu'une offre perdue.
 */
export function isNear(o: Offer, near: NonNullable<OfferFilters['near']>): boolean {
  if (o.lat == null || o.lon == null) return o.department === near.department;
  return distanceKm(near, { lat: o.lat, lon: o.lon }) <= near.km;
}

/** La distance au centre de la recherche, pour l'afficher sur l'offre. */
export function withDistance(o: Offer, near: OfferFilters['near']): Offer {
  if (!near || o.lat == null || o.lon == null) return o;
  return { ...o, distanceKm: Math.round(distanceKm(near, { lat: o.lat, lon: o.lon })) };
}

/** Le même filtrage que la requête SQL, pour les offres d'exemple. */
export function filterOffers(offers: Offer[], filters: OfferFilters, mode: OfferPage['mode']): OfferPage {
  const matching = sortOffers(
    dedupe(offers).filter((o) => {
      if (!matchesFilters(o, filters)) return false;
      if (!filters.near && filters.departments?.length && (!o.department || !filters.departments.includes(o.department))) return false;
      return matchesQuery(`${o.title} ${o.company ?? ''} ${o.city ?? ''} ${o.description.slice(0, 3000)}`, filters.q);
    }).map((o) => withDistance(o, filters.near)),
    filters.sort,
  );

  const page = Math.max(1, filters.page ?? 1);
  return {
    offers: matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: matching.length,
    page,
    pageSize: PAGE_SIZE,
    mode,
  };
}

const SIZES: CompanySizeTag[] = ['tpe', 'pme', 'eti', 'grande'];

const SINCE = [1, 7, 30];

type Params = Record<string, string | string[] | undefined>;

function many(params: Params, key: string): string[] {
  const v = params[key];
  return (Array.isArray(v) ? v : v ? [v] : []).flatMap((x) => x.split(',')).map((x) => x.trim()).filter(Boolean);
}

/** Départements valides d'une liste (« 75 », « 2a », « 974 »), sans doublon. */
export function validDepartments(values: string[]): string[] {
  return [...new Set(values.map((d) => d.toUpperCase()).filter((d) => /^(\d{2,3}|2[AB])$/.test(d)))].slice(0, MAX_DEPARTMENTS);
}

/** Lit les filtres d'une URL de recherche, en ignorant ce qui n'est pas valide. */
export function parseFilters(params: Params): OfferFilters {
  const one = (key: string) => many(params, key)[0];
  const level = Number(one('niveau'));
  const contract = one('contrat');
  const since = Number(one('depuis'));
  const sizes = many(params, 'taille').filter((t): t is CompanySizeTag => (SIZES as string[]).includes(t));
  // Ancienne adresse : « grandes=1 ».
  if (one('grandes') === '1' && !sizes.includes('grande')) sizes.push('grande');
  const near = parseNear(one('autour'), one('km'), one('ville')) ?? undefined;
  return {
    q: one('q')?.slice(0, 120),
    departments: near ? [] : validDepartments(many(params, 'dep')),
    near,
    contract: contract === 'apprentissage' || contract === 'professionnalisation' ? contract : undefined,
    level: level >= 3 && level <= 7 ? (level as OfferFilters['level']) : undefined,
    sizes: [...new Set(sizes)],
    sectors: [...new Set(many(params, 'secteur').map((x) => x.toUpperCase()))].filter((x) => SECTOR_CODES.includes(x)),
    withSalary: one('salaire') === '1',
    sinceDays: SINCE.includes(since) ? since : undefined,
    direct: one('direct') === '1',
    easyApply: one('simple') === '1',
    remote: one('teletravail') === 'total' ? 'total' : one('teletravail') === '1' ? 'partiel' : undefined,
    minSalaryCents: MIN_SALARIES.includes(Number(one('salairemin'))) ? Number(one('salairemin')) * 100 : undefined,
    skill: SKILL_OPTIONS.some((x) => x.slug === one('competence')) ? one('competence') : undefined,
    sort: SORT_OPTIONS.some((o) => o.value === one('tri')) ? (one('tri') as OfferSort) : 'top',
    page: Math.max(1, Number(one('page')) || 1),
  };
}

/**
 * Les filtres de la page, plus le lieu mémorisé : si l'adresse ne dit rien du lieu (pas de « dep »),
 * on reprend les départements choisis au premier passage. « dep=fr » veut dire toute la France.
 */
export function filtersWithPlace(params: Params, placeCookie: string | undefined): OfferFilters {
  const filters = parseFilters(params);
  if (params.dep !== undefined || params.autour !== undefined || !placeCookie || placeCookie === 'fr') return filters;
  const near = decodeNearCookie(placeCookie);
  if (near) return { ...filters, near, departments: [] };
  filters.departments = validDepartments(placeCookie.split('.'));
  return filters;
}

/** L'adresse d'une recherche, sans les valeurs par défaut. */
export function filtersQuery(f: OfferFilters, page = 1): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.near) {
    p.set('autour', encodeCenter(f.near));
    p.set('km', String(f.near.km));
    p.set('ville', f.near.label);
  } else if (f.departments?.length) for (const d of f.departments) p.append('dep', d);
  else p.set('dep', 'fr');
  if (f.level) p.set('niveau', String(f.level));
  if (f.contract) p.set('contrat', f.contract);
  for (const t of f.sizes ?? []) p.append('taille', t);
  for (const x of f.sectors ?? []) p.append('secteur', x);
  if (f.withSalary) p.set('salaire', '1');
  if (f.sinceDays) p.set('depuis', String(f.sinceDays));
  if (f.direct) p.set('direct', '1');
  if (f.easyApply) p.set('simple', '1');
  if (f.remote) p.set('teletravail', f.remote === 'total' ? 'total' : '1');
  if (f.minSalaryCents) p.set('salairemin', String(f.minSalaryCents / 100));
  if (f.skill) p.set('competence', f.skill);
  if (f.sort && f.sort !== 'top') p.set('tri', f.sort);
  if (page > 1) p.set('page', String(page));
  return p;
}

/** Nombre de filtres rangés dans « Plus de filtres », pour l'afficher sur le bouton. */
export function moreFiltersCount(f: OfferFilters): number {
  return (
    (f.contract ? 1 : 0) +
    (f.sizes?.length ?? 0) +
    (f.sectors?.length ?? 0) +
    (f.withSalary ? 1 : 0) +
    (f.minSalaryCents ? 1 : 0) +
    (f.skill ? 1 : 0) +
    (f.sinceDays ? 1 : 0) +
    (f.direct ? 1 : 0) +
    (f.easyApply ? 1 : 0)
  );
}
