import {
  APPRENTISSAGE_RATES,
  APPRENTI_EXEMPTION_SHARE,
  PROFESSIONNALISATION_RATES,
  SMIC,
} from './reference';
import { type GridSource, gridFor } from './convention-grids';
import type { DiplomaLevel } from './employer';

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

/** Le contrat qui fixe le minimum : celui de l'offre quand elle le précise, sinon celui du profil. */
export function contractForOffer(offerContract: string | null | undefined, profileContract: ContractKind): ContractKind {
  return offerContract === 'apprentissage' || offerContract === 'professionnalisation' ? offerContract : profileContract;
}

export const CONTRACT_NAMES: Record<ContractKind, string> = { apprentissage: 'apprentissage', professionnalisation: 'contrat pro' };

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

export interface ConventionMinimum {
  /** Minimum mensuel brut prévu par la convention, en centimes (un treizième mois compris si la convention le prévoit). */
  cents: number;
  /** Pourcentage du SMIC du texte, avant le treizième mois. */
  rate: number;
  idcc: string;
  name: string;
  months: 12 | 13;
  /** Le texte prévoit aussi un pourcentage du minimum conventionnel du poste : le chiffre est un plancher. */
  orConventionMinimum: boolean;
  source: GridSource;
}

/**
 * Le minimum prévu par la convention collective de l'employeur, s'il est plus élevé que le minimum légal. Parmi
 * plusieurs conventions, la plus favorable. Rien quand aucune convention connue ne fait mieux que la loi.
 */
export function conventionMinimum(input: SalaryInput, idccs: readonly string[], diplomaLevel: DiplomaLevel | null = null): ConventionMinimum | null {
  const legal = minimumSalary(input).cents;
  const age = Math.max(15, Math.floor(input.age));
  let best: ConventionMinimum | null = null;
  for (const idcc of idccs) {
    const grid = gridFor(idcc);
    if (!grid) continue;
    const months = grid.months ?? 12;
    let rate: number | null = null;
    let source: GridSource | null = null;
    if (input.contract === 'apprentissage' && grid.apprentissage) {
      const bracket = grid.apprentissage.brackets.find(
        (b) => age >= b.minAge && age <= b.maxAge && (!b.levels || (diplomaLevel !== null && b.levels.includes(diplomaLevel))),
      );
      if (bracket) {
        rate = bracket.byYear[clampYear(input.year) - 1]!;
        source = grid.apprentissage.source;
      }
    } else if (input.contract === 'professionnalisation' && grid.professionnalisation) {
      const bracket = grid.professionnalisation.brackets.find((b) => age >= b.minAge && age <= b.maxAge);
      if (bracket) {
        rate = input.hasBacPro ? bracket.withBac : bracket.base;
        source = grid.professionnalisation.source;
      }
    }
    if (rate === null || !source) continue;
    const cents = Math.round((SMIC.monthlyCents * rate * months) / 12 / 100);
    if (cents <= legal || (best && cents <= best.cents)) continue;
    best = { cents, rate, idcc: grid.idcc, name: grid.name, months, orConventionMinimum: Boolean(grid.orConventionMinimum), source };
  }
  return best;
}
