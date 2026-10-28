// Les pages d'atterrissage « alternance + métier + ville », celles que les gens tapent dans Google
// et demandent aux assistants IA : « alternance marketing Lyon », « alternance Paris », « alternance data ».
// Une ville renvoie à son département : les offres sont rangées par département, pas par commune.

import { DEPARTMENT_NAMES } from './departments';
import { type Domain, DOMAINS } from './domains';
import type { OfferFilters } from './offers/types';

export interface City {
  slug: string;
  name: string;
  department: string;
}

/** Les plus grandes villes étudiantes, avec le département où leurs offres sont cherchées. */
export const CITIES: City[] = [
  { slug: 'paris', name: 'Paris', department: '75' },
  { slug: 'lyon', name: 'Lyon', department: '69' },
  { slug: 'marseille', name: 'Marseille', department: '13' },
  { slug: 'toulouse', name: 'Toulouse', department: '31' },
  { slug: 'bordeaux', name: 'Bordeaux', department: '33' },
  { slug: 'lille', name: 'Lille', department: '59' },
  { slug: 'nantes', name: 'Nantes', department: '44' },
  { slug: 'nice', name: 'Nice', department: '06' },
  { slug: 'montpellier', name: 'Montpellier', department: '34' },
  { slug: 'strasbourg', name: 'Strasbourg', department: '67' },
  { slug: 'rennes', name: 'Rennes', department: '35' },
  { slug: 'grenoble', name: 'Grenoble', department: '38' },
  { slug: 'rouen', name: 'Rouen', department: '76' },
  { slug: 'tours', name: 'Tours', department: '37' },
  { slug: 'dijon', name: 'Dijon', department: '21' },
  { slug: 'angers', name: 'Angers', department: '49' },
  { slug: 'reims', name: 'Reims', department: '51' },
  { slug: 'clermont-ferrand', name: 'Clermont-Ferrand', department: '63' },
  { slug: 'orleans', name: 'Orléans', department: '45' },
  { slug: 'caen', name: 'Caen', department: '14' },
  { slug: 'nancy', name: 'Nancy', department: '54' },
  { slug: 'metz', name: 'Metz', department: '57' },
  { slug: 'toulon', name: 'Toulon', department: '83' },
  { slug: 'nimes', name: 'Nîmes', department: '30' },
  { slug: 'limoges', name: 'Limoges', department: '87' },
  { slug: 'amiens', name: 'Amiens', department: '80' },
  { slug: 'besancon', name: 'Besançon', department: '25' },
  { slug: 'brest', name: 'Brest', department: '29' },
  { slug: 'la-defense', name: 'La Défense', department: '92' },
];

/** « Ressources humaines » → « ressources-humaines », « Développeur » → « developpeur ». */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface Landing {
  slug: string;
  domain: Domain | null;
  city: City | null;
}

function build(): Map<string, Landing> {
  const all = new Map<string, Landing>();
  for (const domain of DOMAINS) all.set(slugify(domain.label), { slug: slugify(domain.label), domain, city: null });
  for (const city of CITIES) all.set(city.slug, { slug: city.slug, domain: null, city });
  for (const domain of DOMAINS) {
    for (const city of CITIES) {
      const slug = `${slugify(domain.label)}-${city.slug}`;
      all.set(slug, { slug, domain, city });
    }
  }
  return all;
}

const LANDINGS = build();

export function findLanding(slug: string): Landing | null {
  return LANDINGS.get(slug) ?? null;
}

export function allLandings(): Landing[] {
  return [...LANDINGS.values()];
}

export function landingHref(domain: Domain | null, city: City | null): string {
  const slug = [domain && slugify(domain.label), city?.slug].filter(Boolean).join('-');
  return slug ? `/alternance/${slug}` : '/alternance';
}

/** « marketing » en minuscules dans une phrase, sauf les sigles (« BTP »). */
export function domainWord(domain: Domain): string {
  return domain.label === domain.label.toUpperCase() ? domain.label : domain.label.toLowerCase();
}

/** Où, en clair : « à Lyon (Rhône, 69) », ou « en France » pour une page métier seule. */
export function placeText(city: City | null): string {
  if (!city) return 'en France';
  const dep = DEPARTMENT_NAMES[city.department];
  return dep === city.name ? `à ${city.name} (${city.department})` : `à ${city.name} (${dep}, ${city.department})`;
}

/** Le titre de la page, tel qu'il est cherché : « Alternance marketing à Lyon ». */
export function landingTitle({ domain, city }: Pick<Landing, 'domain' | 'city'>): string {
  return ['Alternance', domain && domainWord(domain), city && `à ${city.name}`].filter(Boolean).join(' ');
}

/** La recherche lancée pour la page, la même que sur /offres. */
export function landingFilters({ domain, city }: Pick<Landing, 'domain' | 'city'>): OfferFilters {
  return { q: domain?.query, departments: city ? [city.department] : [], sort: 'top' };
}
