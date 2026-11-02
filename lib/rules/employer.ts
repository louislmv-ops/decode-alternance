import { aidRowFor, EMPLOYER_PARTICIPATION, type EmployerAidRow } from './employer-aids';
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
  /** La ligne du tableau des aides qui s'applique (lib/rules/employer-aids.ts), ou null. */
  aid: EmployerAidRow | null;
  /** Participation forfaitaire due par l'employeur, en centimes (0 si aucune). */
  participationCents: number;
}

export function employerFigures(input: EmployerInput): EmployerFigures {
  if (input.contract !== 'apprentissage') {
    return {
      aidCents: 0,
      aidLabel: 'Pas d’aide exceptionnelle pour un contrat de professionnalisation en 2026',
      aid: null,
      participationCents: 0,
    };
  }
  const participationCents = EMPLOYER_PARTICIPATION.levels.includes(input.level) ? EMPLOYER_PARTICIPATION.cents : 0;
  const aid = aidRowFor(input);
  return {
    aidCents: aid?.maxCents ?? 0,
    aidLabel: aid?.label ?? 'Aucune aide connue pour ce cas',
    aid,
    participationCents,
  };
}

const sizeLabel = (size: CompanySize) => (size === 'moins-de-250' ? 'entreprise de moins de 250 salariés' : 'entreprise de 250 salariés et plus');

/**
 * Le texte à glisser dans une candidature, envoyé tel quel à des employeurs. Il ne cite un montant
 * que si la ligne du tableau a été vérifiée dans le texte officiel ; sinon, une formulation prudente.
 */
export function employerPitch(input: EmployerInput & { minimumLabel: string; levelLabel: string; formatCents: (cents: number) => string }): string {
  if (input.contract !== 'apprentissage') {
    return `En contrat de professionnalisation, mon salaire minimum légal est de ${input.minimumLabel} brut par mois et ma formation peut être prise en charge par l’OPCO de l’entreprise.`;
  }
  const figures = employerFigures(input);
  const aid = figures.aid;
  const aidSentence = aid?.verified
    ? `votre entreprise peut recevoir jusqu’à ${input.formatCents(aid.maxCents)} d’aide de l’État la première année (${input.disabledWorker ? 'apprenti reconnu travailleur handicapé' : sizeLabel(input.size)}, ${aid.legalRef}).`
    : 'votre entreprise peut avoir droit à une aide de l’État selon le niveau du diplôme et sa taille (à vérifier auprès de l’ASP).';
  const participation = figures.participationCents
    ? EMPLOYER_PARTICIPATION.verified
      ? ` Une participation de ${input.formatCents(figures.participationCents)} à la formation est due pour ce niveau de diplôme.`
      : ' Une participation forfaitaire de l’employeur à la formation peut être due pour ce niveau de diplôme.'
    : '';
  return `En m’embauchant en apprentissage (${input.levelLabel.toLowerCase()}), ${aidSentence} Mon salaire minimum légal est de ${input.minimumLabel} brut par mois.${participation} ${figures.participationCents ? 'Le reste du coût de ma formation est pris' : 'Ma formation est prise'} en charge par l’OPCO de l’entreprise.`;
}
