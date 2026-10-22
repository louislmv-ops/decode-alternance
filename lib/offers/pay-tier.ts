/**
 * La paie en un coup d'œil, comme les « € » d'un guide de restaurants :
 * € au minimum légal (jusqu'à +10 %), €€ correct (jusqu'à +30 %), €€€ bien payé (au-delà).
 * Sans montant dans l'annonce, pas de note : on n'invente pas de salaire.
 */
export type PayTier = 1 | 2 | 3;

export function payTier(offerCents: number | null, minimumCents: number): PayTier | null {
  if (offerCents === null || minimumCents <= 0) return null;
  const ratio = offerCents / minimumCents;
  if (ratio > 1.3) return 3;
  if (ratio > 1.1) return 2;
  return 1;
}

export const PAY_TIER_LABELS: Record<PayTier, string> = {
  1: 'Payé au minimum légal',
  2: 'Correct : au-dessus du minimum',
  3: 'Bien payé : plus de 30 % au-dessus du minimum',
};
