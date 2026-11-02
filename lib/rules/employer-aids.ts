// Les aides de l'État à l'employeur d'un apprenti et la participation qu'il doit à la formation :
// un seul tableau, lu par le calculateur de /salaire, par le texte à copier dans une candidature
// et par la section Sources. Quand un texte change, on met à jour ce fichier et rien d'autre.
//
// `verified` dit si le montant a été relu dans le texte officiel (Légifrance, ASP). Tant qu'il vaut
// false, le calculateur montre le montant comme une estimation à confirmer, et le texte envoyé aux
// employeurs ne cite aucun chiffre. Passer une ligne à true seulement après lecture du texte.

import type { CompanySize, DiplomaLevel } from './employer';

export type AidScheme = 'aide-unique' | 'aide-exceptionnelle';

export interface EmployerAidRow {
  scheme: AidScheme;
  /** Nom affiché dans le calculateur. */
  label: string;
  /** Niveaux de diplôme préparé couverts. */
  levels: readonly DiplomaLevel[];
  /** Taille d'entreprise couverte ; null : toutes. */
  size: CompanySize | null;
  /** Ligne réservée à un apprenti reconnu travailleur handicapé. */
  disabledWorker: boolean;
  /** Montant maximal la première année, en centimes. */
  maxCents: number;
  /** Conditions à rappeler, en clair. */
  conditions: readonly string[];
  /** Contrats conclus à partir de cette date (incluse). */
  concludedFrom: string;
  /** Contrats conclus jusqu'à cette date (incluse). */
  concludedUntil: string;
  /** Le texte qui fonde la ligne, tel qu'on le cite. */
  legalRef: string;
  /** Où le vérifier. */
  sourceUrl: string;
  /** Montant relu dans le texte officiel. */
  verified: boolean;
}

const DECREE_2026 = 'Décret n° 2026-168 du 6 mars 2026 relatif à l’aide exceptionnelle aux employeurs d’apprentis';
const DECREE_2026_URL = 'https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000053634597';
const ASP_URL = 'https://www.asp.gouv.fr';

const COMMON = [
  'contrat d’apprentissage, première année d’exécution',
  'montant proratisé selon les jours effectués dans le contrat',
  'hors outre-mer, où des montants différents peuvent s’appliquer',
] as const;

const EXCEPTIONNELLE = {
  scheme: 'aide-exceptionnelle',
  label: 'Aide exceptionnelle à l’embauche d’un apprenti',
  disabledWorker: false,
  concludedFrom: '2026-03-08',
  concludedUntil: '2026-12-31',
  legalRef: DECREE_2026,
  sourceUrl: DECREE_2026_URL,
  verified: false,
} as const;

const LARGE = [...COMMON, 'entreprise de 250 salariés et plus : seuil d’alternants à respecter (voir ASP)'] as const;

/**
 * Relevé le 28 octobre 2026 dans des synthèses concordantes du décret (OPCO EP, Centre Inffo, Ocapiat),
 * pas dans le texte de Légifrance, inaccessible au moment de la relecture : d'où verified: false.
 */
export const EMPLOYER_AIDS: readonly EmployerAidRow[] = [
  {
    scheme: 'aide-unique',
    label: 'Aide unique à l’embauche d’un apprenti',
    levels: [3, 4],
    size: 'moins-de-250',
    disabledWorker: false,
    maxCents: 500_000,
    conditions: [...COMMON, 'non cumulable avec l’aide exceptionnelle'],
    concludedFrom: '2026-01-01',
    concludedUntil: '2026-12-31',
    legalRef: 'Aide unique aux employeurs d’apprentis (Code du travail)',
    sourceUrl: ASP_URL,
    verified: false,
  },
  { ...EXCEPTIONNELLE, levels: [5], size: 'moins-de-250', maxCents: 450_000, conditions: COMMON },
  { ...EXCEPTIONNELLE, levels: [6, 7], size: 'moins-de-250', maxCents: 200_000, conditions: COMMON },
  { ...EXCEPTIONNELLE, levels: [3, 4], size: '250-et-plus', maxCents: 200_000, conditions: LARGE },
  { ...EXCEPTIONNELLE, levels: [5], size: '250-et-plus', maxCents: 150_000, conditions: LARGE },
  { ...EXCEPTIONNELLE, levels: [6, 7], size: '250-et-plus', maxCents: 75_000, conditions: LARGE },
  {
    ...EXCEPTIONNELLE,
    label: 'Aide exceptionnelle, apprenti reconnu travailleur handicapé',
    levels: [3, 4, 5, 6, 7],
    size: null,
    disabledWorker: true,
    maxCents: 600_000,
    conditions: [...COMMON, 'apprenti reconnu travailleur handicapé'],
  },
];

/** Participation forfaitaire de l'employeur au coût de la formation, pour un diplôme de niveau 6 ou 7. */
export const EMPLOYER_PARTICIPATION = {
  cents: 75_000,
  levels: [6, 7] as readonly DiplomaLevel[],
  concludedFrom: '2025-07-01',
  legalRef: 'Décrets publiés au JO du 29 juin 2025 sur le financement de l’apprentissage',
  verified: false,
} as const;

/** La ligne qui s'applique, ou null (contrat de professionnalisation, ou aucune aide connue). */
export function aidRowFor(input: { size: CompanySize; level: DiplomaLevel; disabledWorker: boolean }): EmployerAidRow | null {
  if (input.disabledWorker) return EMPLOYER_AIDS.find((r) => r.disabledWorker && r.levels.includes(input.level)) ?? null;
  return EMPLOYER_AIDS.find((r) => !r.disabledWorker && r.size === input.size && r.levels.includes(input.level)) ?? null;
}

/** « 8 mars 2026 », pour les dates de validité affichées. */
export function frenchDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
}
