// Quand l'annonce ne chiffre pas le salaire et qu'aucun alternant de l'entreprise n'en a déclaré,
// on donne une tendance, jamais un montant : quelques indices connus pour tirer les salaires vers le haut
// (Île-de-France, grand groupe, siège, métiers qualifiés) ou vers le minimum (petits commerces, restauration).
// Chaque indice est affiché : la personne voit pourquoi, et sait que c'est à confirmer en entretien.

import { isCac40 } from './companies';
import type { Offer } from './types';
import type { PayTier } from './pay-tier';

export interface PayLean {
  tier: PayTier;
  /** Les indices retenus, en clair (« Île-de-France », « grand groupe »…). */
  reasons: string[];
}

const IDF = new Set(['75', '77', '78', '91', '92', '93', '94', '95']);

/** Métiers où les entreprises paient souvent au-dessus du minimum : banque, assurance, informatique, audit, ingénierie. */
const WELL_PAID_ROME = /^(C1|M18|M120[1-6]|H12|H13|H14)/;
const WELL_PAID_WORDS = /\b(data|developpeu|devops|cyber|ingenieu|finance|financier|audit|controle de gestion|banque|actuari)/;
/** Métiers où l'alternance est le plus souvent payée au minimum. */
const MINIMUM_ROME = /^(G1|D11|D12|K22)/;

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function paySignals(offer: Partial<Pick<Offer, 'department' | 'companySize' | 'romeCode' | 'diplomaLevel' | 'title' | 'description' | 'company'>>): PayLean | null {
  let score = 0;
  const reasons: string[] = [];
  const text = strip(`${offer.title ?? ''} ${offer.description ?? ''}`);

  if (offer.department && IDF.has(offer.department)) {
    score += 1;
    reasons.push('Île-de-France');
  }
  if (offer.companySize === 'grande' || offer.companySize === 'eti' || isCac40(offer.company ?? null)) {
    score += 1;
    reasons.push('grand groupe');
  } else if (offer.companySize === 'tpe') {
    score -= 1;
    reasons.push('très petite entreprise');
  }
  if (/\bsiege\b|head ?office|headquarters/.test(text)) {
    score += 1;
    reasons.push('poste au siège');
  }
  if ((offer.romeCode && WELL_PAID_ROME.test(offer.romeCode)) || WELL_PAID_WORDS.test(strip(offer.title ?? ''))) {
    score += 1;
    reasons.push('métier recherché');
  } else if (offer.romeCode && MINIMUM_ROME.test(offer.romeCode)) {
    score -= 1;
    reasons.push('secteur souvent au minimum');
  }
  if (offer.diplomaLevel === 7) {
    score += 1;
    reasons.push('niveau bac+5');
  }

  if (reasons.length === 0) return null;
  const tier: PayTier = score >= 3 ? 3 : score >= 1 ? 2 : 1;
  return { tier, reasons };
}
