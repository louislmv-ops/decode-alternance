import type { DiplomaLevel } from '@/lib/rules/employer';

/** D'où vient une offre. L'ordre de `SOURCE_PRIORITY` décide laquelle garder quand une offre est publiée deux fois. */
export type OfferSource = 'site-carriere' | 'france-travail' | 'la-bonne-alternance' | 'adzuna' | 'jooble' | 'exemple';

// Les agrégateurs passent en dernier : ils reprennent des offres publiées ailleurs.
export const SOURCE_PRIORITY: OfferSource[] = ['site-carriere', 'france-travail', 'la-bonne-alternance', 'adzuna', 'jooble', 'exemple'];

export const SOURCE_LABELS: Record<OfferSource, string> = {
  'site-carriere': 'Site carrière de l’entreprise',
  'france-travail': 'France Travail',
  'la-bonne-alternance': 'La bonne alternance',
  adzuna: 'Adzuna',
  jooble: 'Jooble',
  exemple: 'Exemple fictif',
};

export type CompanySizeTag = 'tpe' | 'pme' | 'eti' | 'grande';

export const COMPANY_SIZE_LABELS: Record<CompanySizeTag, string> = {
  tpe: 'Moins de 10 salariés',
  pme: 'PME',
  eti: 'Entreprise de taille intermédiaire',
  grande: 'Grande entreprise',
};

export type OfferContract = 'apprentissage' | 'professionnalisation' | 'alternance';

/** Une offre normalisée, quelle que soit sa source. */
export interface Offer {
  /** Identifiant stable : source + identifiant chez la source. */
  id: string;
  source: OfferSource;
  sourceId: string;
  /** Lien vers l'offre d'origine, où l'on postule. */
  sourceUrl: string;
  title: string;
  company: string | null;
  companySize: CompanySizeTag | null;
  city: string | null;
  postalCode: string | null;
  /** Code du département (« 75 », « 2A », « 974 »). */
  department: string | null;
  contract: OfferContract;
  diplomaLevel: DiplomaLevel | null;
  salaryText: string | null;
  /** Salaire mensuel brut annoncé, en centimes, quand il est chiffré. */
  salaryMonthlyCents: number | null;
  startDate: string | null;
  publishedAt: string;
  /** Texte brut de l'annonce, utilisé pour la traduction. */
  description: string;
  /** Prise directement sur le site carrière de l'entreprise. */
  direct: boolean;
  /** Clé de dédoublonnage : entreprise + intitulé + ville, normalisés. */
  fingerprint: string;
  /** Raisons de penser que l'annonce vient d'une école qui recrute des élèves. */
  schoolFlags: string[];
  /** Autres sources où la même offre a été vue. */
  alsoOn: OfferSource[];
  /** Site de l'entreprise, quand la source le donne : sert à afficher son logo. */
  companySite?: string | null;
  /** Logo fourni par la source elle-même. */
  logoUrl?: string | null;
}

export interface OfferFilters {
  q?: string;
  department?: string;
  contract?: OfferContract;
  level?: DiplomaLevel;
  bigCompany?: boolean;
  direct?: boolean;
  page?: number;
}

export interface OfferPage {
  offers: Offer[];
  total: number;
  page: number;
  pageSize: number;
  /** Les offres viennent-elles d'une vraie base ou des exemples fictifs ? */
  mode: 'base' | 'direct' | 'exemples';
  /** Dernière page qu'on peut demander, quand la source limite la pagination. */
  maxPage?: number;
}

/** Hôtes vers lesquels une fiche d'agrégateur oubliée peut renvoyer : jamais une adresse quelconque. */
const AGGREGATOR_HOSTS = /(^|\.)(adzuna\.(fr|com)|jooble\.org|apprentissage\.beta\.gouv\.fr)$/;

export function isAggregatorUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && AGGREGATOR_HOSTS.test(u.hostname);
  } catch {
    return false;
  }
}

/** Adresse de la fiche Décode d'une offre ; pour un agrégateur, elle garde le lien d'origine en secours. */
export function offerHref(offer: Pick<Offer, 'id' | 'source' | 'sourceUrl'>): string {
  const base = `/offres/${encodeURIComponent(offer.id)}`;
  return offer.source === 'adzuna' || offer.source === 'jooble' || offer.source === 'la-bonne-alternance'
    ? `${base}?u=${encodeURIComponent(offer.sourceUrl)}`
    : base;
}
