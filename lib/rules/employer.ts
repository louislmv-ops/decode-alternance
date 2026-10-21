import { EMPLOYER_AID_2026, EMPLOYER_PARTICIPATION } from './reference';
import type { ContractKind } from './salary';

export type CompanySize = 'moins-de-250' | '250-et-plus';

/** Niveaux de diplôme du cadre national : 3 = CAP, 4 = bac, 5 = bac+2, 6 = bac+3, 7 = bac+5. */
export type DiplomaLevel = 3 | 4 | 5 | 6 | 7;

export const DIPLOMA_LEVELS: { level: DiplomaLevel; label: string }[] = [
  { level: 3, label: 'CAP, BEP' },
  { level: 4, label: 'Bac, bac pro, BP' },
  { level: 5, label: 'BTS, BUT 2e année, bac+2' },
  { level: 6, label: 'Licence, BUT, bachelor, bac+3' },
  { level: 7, label: 'Master, école d’ingé ou de commerce, bac+5' },
];

export interface EmployerInput {
  contract: ContractKind;
  size: CompanySize;
  level: DiplomaLevel;
  disabledWorker: boolean;
}

export interface EmployerFigures {
  /** Aide maximale de l'État la première année, en centimes (0 si aucune). */
  aidCents: number;
  aidLabel: string;
  /** Participation forfaitaire due par l'employeur, en centimes (0 si aucune). */
  participationCents: number;
}

export function employerFigures(input: EmployerInput): EmployerFigures {
  if (input.contract !== 'apprentissage') {
    return {
      aidCents: 0,
      aidLabel: 'Pas d’aide exceptionnelle pour un contrat de professionnalisation en 2026',
      participationCents: 0,
    };
  }

  const participationCents = input.level >= 6 ? EMPLOYER_PARTICIPATION.cents : 0;

  if (input.disabledWorker) {
    return { aidCents: EMPLOYER_AID_2026.disabledWorker, aidLabel: 'Aide exceptionnelle, apprenti reconnu travailleur handicapé', participationCents };
  }

  const table = input.size === 'moins-de-250' ? EMPLOYER_AID_2026.under250 : EMPLOYER_AID_2026.from250;
  if (input.level <= 4) {
    return {
      aidCents: table.level3to4,
      aidLabel: input.size === 'moins-de-250' ? 'Aide unique à l’embauche d’un apprenti' : 'Aide exceptionnelle à l’embauche d’un apprenti',
      participationCents,
    };
  }
  return {
    aidCents: input.level === 5 ? table.level5 : table.level6to7,
    aidLabel: 'Aide exceptionnelle à l’embauche d’un apprenti',
    participationCents,
  };
}
