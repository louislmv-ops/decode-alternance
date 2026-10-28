import type { DiplomaLevel } from '@/lib/rules/employer';
import type { RemotePolicy } from './details';
import type { OfferSort } from './rank';

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
  /** Haut de la fourchette annoncée, quand l'annonce en donne une. Jamais affiché seul comme le salaire. */
  salaryMaxCents?: number | null;
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
  /** On peut postuler en ligne avec son CV, sans passer par le site du recruteur (La bonne alternance). */
  easyApply?: boolean;
  /** Convention collective de l'employeur (IDCC), quand la source la donne. */
  idcc?: string | null;
  /** Code ROME du métier, quand la source le donne : sert au filtre par secteur. */
  romeCode?: string | null;
  /** SIREN de l'employeur, quand la source le donne : relie l'offre aux salaires et avis déclarés. */
  companySiren?: string | null;
  /** Logo fourni par la source elle-même. */
  logoUrl?: string | null;
  /** Télétravail lu dans l'annonce (lib/offers/details.ts) ; absent tant qu'il n'a pas été calculé. */
  remote?: RemotePolicy | null;
  /** Compétences citées dans l'annonce (slugs de SKILLS). */
  skills?: string[];
  /** Mise en avant payée par l'entreprise : toujours affichée « Sponsorisé ». */
  sponsored?: boolean;
  /** Le compte de l'entreprise qui paie, pour compter vues et clics. */
  sponsorId?: string;
  /** Position du lieu de travail, quand on la connaît. */
  lat?: number | null;
  lon?: number | null;
  /** « adresse » : l'adresse donnée par l'annonce ; « ville » : le centre de la ville, faute de mieux. */
  geoPrecision?: GeoPrecision | null;
  /** Distance au centre d'une recherche « autour de », en kilomètres. */
  distanceKm?: number | null;
  /** Le salaire que l'entreprise écrit dans ses autres annonces, quand celle-ci n'en donne pas. */
  employerPay?: { count: number; medianCents: number } | null;
}

export type GeoPrecision = 'adresse' | 'ville';

/** Une recherche autour d'un point : une ville choisie ou la position de la personne. */
export interface NearFilter {
  lat: number;
  lon: number;
  km: number;
  /** Le nom affiché (« Nanterre », « Autour de moi »). */
  label: string;
  /** Le département du centre : les offres sans position y sont gardées. */
  department: string;
}

export interface OfferFilters {
  q?: string;
  /** Un ou plusieurs départements ; vide pour toute la France. Ignorés si `near` est donné. */
  departments?: string[];
  /** Autour d'une ville, dans un rayon en kilomètres. */
  near?: NearFilter;
  contract?: OfferContract;
  level?: DiplomaLevel;
  sizes?: CompanySizeTag[];
  /** Secteurs (voir SECTORS) : lettre du domaine ROME, ou M18 pour l'informatique. */
  sectors?: string[];
  /** Seulement les offres qui chiffrent le salaire. */
  withSalary?: boolean;
  /** Publiées depuis au plus ce nombre de jours. */
  sinceDays?: number;
  direct?: boolean;
  /** Seulement les offres à candidature simplifiée. */
  easyApply?: boolean;
  /** « partiel » : au moins un peu de télétravail ; « total » : entièrement à distance. */
  remote?: 'partiel' | 'total';
  /** Salaire annoncé d'au moins ce montant mensuel brut, en centimes. */
  minSalaryCents?: number;
  /** Une compétence citée dans l'annonce (slug de SKILLS). */
  skill?: string;
  /** Interne : seulement les offres de ces entreprises (les entreprises mises en avant). */
  companies?: string[];
  /** Par défaut, les plus attirantes d'abord. */
  sort?: OfferSort;
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
  /** Aucune offre n'avait tous les mots cherchés : ce sont celles qui en ont le plus. */
  relaxed?: boolean;
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
