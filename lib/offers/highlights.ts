import type { PayProfile } from '@/lib/profile';
import { comparePay, minimumSalary, type PayComparison } from '@/lib/rules/salary';
import type { Offer } from './types';

export interface Highlights {
  bigCompany: boolean;
  pay: PayComparison | null;
  minimumCents: number;
  /** Une pépite : grande entreprise ou salaire au moins 20 % au-dessus du minimum de la personne. */
  pepite: boolean;
  schoolBait: boolean;
}

export function highlights(offer: Pick<Offer, 'companySize' | 'salaryMonthlyCents' | 'schoolFlags'>, profile: PayProfile): Highlights {
  const minimum = minimumSalary({ contract: profile.contract, age: profile.age, year: profile.year, hasBacPro: profile.hasBacPro });
  const pay = offer.salaryMonthlyCents !== null ? comparePay(offer.salaryMonthlyCents, minimum.cents) : null;
  const bigCompany = offer.companySize === 'grande';
  const schoolBait = offer.schoolFlags.length > 0;
  return {
    bigCompany,
    pay,
    minimumCents: minimum.cents,
    pepite: !schoolBait && (bigCompany || pay?.verdict === 'bien-paye'),
    schoolBait,
  };
}
