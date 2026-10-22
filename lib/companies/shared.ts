// Ce que le serveur et les pages partagent : seuils, critères, formes des données.

/** En dessous, une moyenne permettrait de deviner le salaire ou la note d'une personne. */
export const MIN_TO_SHOW = 3;

export const HIRED = ['oui', 'non', 'pas_encore'] as const;
export const HIRED_LABELS: Record<(typeof HIRED)[number], string> = { oui: 'Embauche proposée', non: 'Pas d’embauche', pas_encore: 'Contrat en cours' };

export const CRITERIA = [
  ['tutoring', 'Tuteur et encadrement'],
  ['missions', 'Missions confiées'],
  ['atmosphere', 'Ambiance'],
  ['schoolRhythm', 'Respect du rythme école'],
] as const;

export interface SalaryStats {
  count: number;
  /** null tant qu'il y a moins de MIN_TO_SHOW déclarations. */
  medianCents: number | null;
  /** Écart médian au minimum légal, en pourcentage (+12 = 12 % au-dessus). */
  aboveMinimumPercent: number | null;
  belowMinimum: number;
  jobs: { jobTitle: string; count: number; medianCents: number | null }[];
}

export interface ReviewStats {
  count: number;
  overall: number | null;
  criteria: Record<(typeof CRITERIA)[number][0], number | null>;
  hiredPercent: number | null;
}

export interface PublicReview {
  id: string;
  jobTitle: string;
  startYear: number;
  overall: number;
  hired: (typeof HIRED)[number];
  title: string;
  pros: string;
  cons: string;
  verified: boolean;
}

/** Le label « Top pour les alternants » : assez d'avis, une bonne note et un vrai tuteur. Il ne s'achète pas. */
export const TOP_MIN_REVIEWS = 5;
export const TOP_MIN_SCORE = 4;

export function isTopForApprentices(count: number, overall: number | null, tutoring: number | null): boolean {
  return count >= TOP_MIN_REVIEWS && overall !== null && tutoring !== null && overall >= TOP_MIN_SCORE && tutoring >= TOP_MIN_SCORE;
}
