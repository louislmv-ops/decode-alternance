import type { PayProfile } from '@/lib/profile';
import { comparePay, contractForOffer, minimumSalary, type PayComparison } from '@/lib/rules/salary';
import { type CommunityPay, mentionsLegalGrid, type PayEstimate, payEstimate } from './pay-estimate';
import { isCac40 } from './companies';
import { isQualifiedRole } from './rank';
import { type PayTier, payTier } from './pay-tier';
import type { Offer } from './types';

export interface Highlights {
  bigCompany: boolean;
  pay: PayComparison | null;
  minimumCents: number;
  /** Le chiffre retenu (annonce, alternants ou minimum légal) et d'où il vient. */
  estimate: PayEstimate;
  /** Les « € » de la liste : toujours une note, au moins « € » puisque le minimum légal est dû. */
  tier: PayTier;
  /**
   * Une pépite, et elle doit rester rare : un grand groupe (CAC 40 ou grande entreprise), un poste qualifié
   * (bac+3 à bac+5, pas un poste d'exécution) et une paie au moins 20 % au-dessus du minimum de la personne,
   * d'après le bas de la fourchette annoncée ou les salaires déclarés par ses alternants.
   */
  pepite: boolean;
  schoolBait: boolean;
}

export function highlights(
  offer: Pick<Offer, 'companySize' | 'salaryMonthlyCents' | 'schoolFlags'> &
    Partial<Pick<Offer, 'salaryText' | 'description' | 'company' | 'contract' | 'title' | 'diplomaLevel'>>,
  profile: PayProfile,
  community: CommunityPay | null = null,
): Highlights {
  const minimum = minimumSalary({ contract: contractForOffer(offer.contract, profile.contract), age: profile.age, year: profile.year, hasBacPro: profile.hasBacPro });
  const pay = offer.salaryMonthlyCents !== null ? comparePay(offer.salaryMonthlyCents, minimum.cents) : null;
  const estimate = payEstimate(offer.salaryMonthlyCents, minimum.cents, community, mentionsLegalGrid(offer.salaryText, offer.description));
  const bigCompany = offer.companySize === 'grande';
  const schoolBait = offer.schoolFlags.length > 0;
  return {
    bigCompany,
    pay,
    minimumCents: minimum.cents,
    estimate,
    tier: payTier(estimate.cents, minimum.cents) ?? 1,
    pepite:
      !schoolBait &&
      (bigCompany || isCac40(offer.company)) &&
      isQualifiedRole({ title: offer.title ?? '', diplomaLevel: offer.diplomaLevel ?? null }) &&
      estimate.source !== 'minimum' &&
      estimate.cents >= minimum.cents * 1.2,
    schoolBait,
  };
}
