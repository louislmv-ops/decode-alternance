// L'ordre des offres. Par défaut, les plus attirantes d'abord : bien payées, grandes entreprises,
// postes qualifiés, encore fraîches. Une offre d'il y a un mois passe derrière une offre correcte du jour.

import { SMIC } from '@/lib/rules/reference';
import { isCac40 } from './companies';
import { normalizeText } from './normalize';
import type { Offer } from './types';

export type OfferSort = 'top' | 'recent' | 'salary' | 'reviews';

export const SORT_OPTIONS: { value: OfferSort; label: string }[] = [
  { value: 'top', label: 'Les plus attirantes' },
  { value: 'recent', label: 'Les plus récentes' },
  { value: 'salary', label: 'Salaire annoncé le plus haut' },
  { value: 'reviews', label: 'Entreprises les mieux notées' },
];

/** La note moyenne des avis d'alternants sur l'employeur d'une offre, quand il y en a assez. */
export type RatingOf = (o: Pick<Offer, 'company' | 'companySiren'>) => number | null;

/** Intitulés de postes qualifiés, recherchés et souvent mieux payés. */
export const STRONG_ROLE =
  /\b(ingenieur|chef de projet|charge d affaires|business develop\w*|data|developpeur|consultant|audit\w*|analyste|controleur de gestion|product|juriste|finance|cybersecurite|architecte|achats?|ressources humaines)\b/;

const SIZE_POINTS = { grande: 3, eti: 1.5, pme: 0.3, tpe: 0 } as const;

export function attractiveness(
  o: Pick<Offer, 'salaryMonthlyCents' | 'companySize' | 'company' | 'diplomaLevel' | 'title' | 'direct' | 'publishedAt' | 'schoolFlags'>,
  now = Date.now(),
): number {
  let score = 0;
  // Payé au SMIC, c'est déjà beaucoup pour une alternance : 4 points ; au minimum d'un 18 ans, aucun.
  if (o.salaryMonthlyCents !== null) score += Math.min(4, Math.max(0, (o.salaryMonthlyCents / SMIC.monthlyCents - 0.4) * 6.7));
  if (o.companySize) score += SIZE_POINTS[o.companySize];
  if (isCac40(o.company)) score += o.companySize === 'grande' ? 1 : 4;
  if (o.diplomaLevel === 7) score += 1.5;
  else if (o.diplomaLevel === 6) score += 1;
  else if (o.diplomaLevel === 5) score += 0.3;
  if (STRONG_ROLE.test(normalizeText(o.title))) score += 1;
  if (o.direct) score += 0.5;
  const days = Math.max(0, (now - Date.parse(o.publishedAt)) / 86_400_000);
  score -= Math.min(3, days / 10);
  if (o.schoolFlags.length > 0) score -= 10;
  return score;
}

/**
 * Trie les offres. Salaire et avis : les offres sans montant ou sans note passent après les autres,
 * elles-mêmes rangées des plus attirantes aux moins attirantes.
 */
export function sortOffers<T extends Offer>(offers: T[], sort: OfferSort = 'top', ratingOf?: RatingOf): T[] {
  if (sort === 'recent') return [...offers].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const now = Date.now();
  const key = (o: T): number | null =>
    sort === 'salary' ? o.salaryMonthlyCents : sort === 'reviews' ? (ratingOf?.(o) ?? null) : attractiveness(o, now);
  const scored = offers.map((o) => ({ o, k: key(o), s: attractiveness(o, now) }));
  return scored
    .sort((a, b) => {
      if (a.k !== b.k) {
        if (a.k === null) return 1;
        if (b.k === null) return -1;
        return b.k - a.k;
      }
      return b.s - a.s || b.o.publishedAt.localeCompare(a.o.publishedAt);
    })
    .map((x) => x.o);
}

/** STRONG_ROLE pour Postgres, qui compare les intitulés avec leurs accents. */
export const STRONG_ROLE_SQL =
  'ing[ée]nieur|chef de projet|charg[ée] d.affaires|business develop|data|d[ée]veloppeu|consultant|audit|analyste|contr[ôo]leur de gestion|product|juriste|financ|cybers[ée]curit|architecte|achat|ressources humaines';
