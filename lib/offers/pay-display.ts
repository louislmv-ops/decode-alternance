// Ce qu'on a le droit d'afficher sur la paie d'une offre, selon ce qu'on sait vraiment :
// - écrit dans l'annonce : le montant, et un verdict (« Bien payé », « Correct », « Au minimum ») ;
// - estimé d'après les alternants de l'entreprise : un verdict prudent (« Plutôt bien payé »), jamais de chiffre ;
// - sans montant ni déclaration : une tendance tirée d'indices (région, taille, siège, métier), sans chiffre ;
// - inconnu : « Non précisé », ni chiffre ni verdict. Seul le minimum légal, fixé par la loi, reste chiffré ailleurs.

import type { PayEstimate } from './pay-estimate';
import type { PayLean } from './pay-signals';
import { type PayTier, payTier } from './pay-tier';

export type PayDisplay =
  | { kind: 'annonce'; tier: PayTier; word: string; hint: string }
  | { kind: 'estime'; tier: PayTier; word: string; hint: string }
  | { kind: 'inconnu'; tier: null; word: string; hint: string };

const SURE: Record<PayTier, string> = { 1: 'Au minimum', 2: 'Correct', 3: 'Bien payé' };
const LIKELY: Record<PayTier, string> = { 1: 'Plutôt au minimum', 2: 'Plutôt correct', 3: 'Plutôt bien payé' };

export function payDisplay(e: PayEstimate, minimumCents: number, lean: PayLean | null = null): PayDisplay {
  const tier = payTier(e.cents, minimumCents) ?? 1;
  if (e.source === 'annonce') {
    return { kind: 'annonce', tier, word: SURE[tier], hint: `${SURE[tier]}, d’après le salaire écrit dans l’annonce` };
  }
  if (e.source === 'alternants') {
    return {
      kind: 'estime',
      tier,
      word: LIKELY[tier],
      hint: `${LIKELY[tier]}, estimé d’après ${e.count} alternant${e.count > 1 ? 's' : ''} de cette entreprise ; salaire exact à demander`,
    };
  }
  // Une annonce qui renvoie à la grille légale paie le minimum : les indices n'y changent rien.
  if (lean && !e.legalGrid) {
    const word = LIKELY[lean.tier];
    return {
      kind: 'estime',
      tier: lean.tier,
      word,
      hint: `${word}, tendance sans montant d’après : ${lean.reasons.join(', ')}. Salaire exact à demander, jamais sous ton minimum légal`,
    };
  }
  return {
    kind: 'inconnu',
    tier: null,
    word: 'Non précisé',
    hint: e.legalGrid ? 'L’annonce renvoie à la grille légale : au moins ton minimum légal' : 'Pas de salaire dans l’annonce : au moins ton minimum légal',
  };
}
