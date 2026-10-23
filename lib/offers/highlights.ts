import type { PayProfile } from '@/lib/profile';
import { comparePay, minimumSalary, type PayComparison } from '@/lib/rules/salary';
import { type CommunityPay, mentionsLegalGrid, type PayEstimate, payEstimate } from './pay-estimate';
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
  /** Une pépite : grande entreprise ou salaire au moins 20 % au-dessus du minimum de la personne. */
  pepite: boolean;
  schoolBait: boolean;
}

export function highlights(
  offer: Pick<Offer, 'companySize' | 'salaryMonthlyCents' | 'schoolFlags'> & Partial<Pick<Offer, 'salaryText' | 'description'>>,
  profile: PayProfile,
  community: CommunityPay | null = null,
): Highlights {
  const minimum = minimumSalary({ contract: profile.contract, age: profile.age, year: profile.year, hasBacPro: profile.hasBacPro });
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
    pepite: !schoolBait && (bigCompany || pay?.verdict === 'bien-paye'),
    schoolBait,
  };
}
