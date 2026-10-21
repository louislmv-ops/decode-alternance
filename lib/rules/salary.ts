import {
  APPRENTISSAGE_RATES,
  APPRENTI_EXEMPTION_SHARE,
  PROFESSIONNALISATION_RATES,
  SMIC,
} from './reference';

export type ContractKind = 'apprentissage' | 'professionnalisation';

export interface SalaryInput {
  contract: ContractKind;
  /** Âge au premier jour du contrat (apprentissage) ou à la signature (professionnalisation). */
  age: number;
  /** Année d'exécution du contrat, de 1 à 3 (apprentissage seulement). */
  year: number;
  /** Au moins un bac pro ou un titre de même niveau (professionnalisation seulement). */
  hasBacPro: boolean;
}

export interface MinimumSalary {
  /** Salaire mensuel brut minimum, en centimes. */
  cents: number;
  /** Pourcentage du SMIC appliqué. */
  rate: number;
  bracket: string;
  /** Dès 21 ans, une convention collective peut imposer plus. */
  conventionMayRaise: boolean;
}

export function clampYear(year: number): 1 | 2 | 3 {
  if (!Number.isFinite(year) || year <= 1) return 1;
  if (year >= 3) return 3;
  return Math.round(year) as 1 | 2 | 3;
}

export function minimumSalary(input: SalaryInput): MinimumSalary {
  const age = Math.max(15, Math.floor(input.age));

  if (input.contract === 'apprentissage') {
    const bracket = APPRENTISSAGE_RATES.find((b) => age >= b.minAge && age <= b.maxAge) ?? APPRENTISSAGE_RATES[0];
    const rate = bracket.byYear[clampYear(input.year) - 1] ?? bracket.byYear[0];
    return {
      cents: Math.round((SMIC.monthlyCents * rate) / 100),
      rate,
      bracket: bracket.label,
      conventionMayRaise: age >= 21,
    };
  }

  const bracket = PROFESSIONNALISATION_RATES.find((b) => age >= b.minAge && age <= b.maxAge) ?? PROFESSIONNALISATION_RATES[0];
  const rate = input.hasBacPro ? bracket.withBac : bracket.base;
  return {
    cents: Math.round((SMIC.monthlyCents * rate) / 100),
    rate,
    bracket: bracket.label,
    conventionMayRaise: age >= 26,
  };
}

/** Sous ce montant mensuel, le net d'un apprenti est égal à son brut. */
export function apprenticeNetThresholdCents(): number {
  return Math.round(SMIC.monthlyCents * APPRENTI_EXEMPTION_SHARE);
}

export type PayVerdict = 'sous-le-minimum' | 'au-minimum' | 'au-dessus' | 'bien-paye';

export interface PayComparison {
  verdict: PayVerdict;
  /** Écart en centimes entre le salaire annoncé et le minimum légal. */
  diffCents: number;
  /** Écart en pourcentage du minimum, arrondi à l'unité. */
  diffPercent: number;
}

/** À partir de cet écart au-dessus du minimum, l'offre est surlignée comme bien payée. */
export const WELL_PAID_THRESHOLD_PERCENT = 20;

export function comparePay(offerCents: number, minimumCents: number): PayComparison {
  const diffCents = offerCents - minimumCents;
  const diffPercent = minimumCents > 0 ? Math.round((diffCents / minimumCents) * 100) : 0;
  let verdict: PayVerdict;
  if (diffCents < -100) verdict = 'sous-le-minimum';
  else if (diffPercent < 3) verdict = 'au-minimum';
  else if (diffPercent < WELL_PAID_THRESHOLD_PERCENT) verdict = 'au-dessus';
  else verdict = 'bien-paye';
  return { verdict, diffCents, diffPercent };
}
