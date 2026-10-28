// La mise en avant payante : une entreprise abonnée voit ses offres remonter, toujours avec la
// mention « Sponsorisé » (une publicité doit être identifiable comme telle, LCEN art. 20).
// Elle ne passe jamais devant une recherche : seules ses offres qui correspondent aux filtres
// de la personne remontent, et au plus deux par page, aux places 1 et 6.

import { companyKey } from '@/lib/offers/normalize';
import type { Offer } from '@/lib/offers/types';

export interface Sponsor {
  accountId: string;
  company: string;
  /** Les 9 premiers chiffres du SIRET : relie l'entreprise à ses offres quand la source les donne. */
  siren: string;
}

/** Les places des offres mises en avant sur une page (la 1re et la 6e). */
export const SPONSORED_SLOTS = [0, 5];

/** L'offre vient-elle d'une entreprise abonnée ? Même SIREN, ou exactement le même nom (formes juridiques à part). */
export function sponsorOf(offer: Pick<Offer, 'company'> & Partial<Pick<Offer, 'companySiren'>>, sponsors: Sponsor[]): Sponsor | null {
  const key = companyKey(offer.company);
  return (
    sponsors.find((s) => (offer.companySiren && offer.companySiren === s.siren) || (key.length >= 2 && key === companyKey(s.company))) ?? null
  );
}

/**
 * Place les offres sponsorisées aux places prévues, marquées comme telles, sans doublon. Les autres offres gardent
 * leur ordre. Sans offre sponsorisée, la page est inchangée.
 */
export function injectSponsored<T extends Pick<Offer, 'id'>>(offers: T[], sponsored: T[], slots = SPONSORED_SLOTS): (T & { sponsored?: boolean })[] {
  const picked: (T & { sponsored?: boolean })[] = sponsored.slice(0, slots.length).map((o) => ({ ...o, sponsored: true }));
  if (picked.length === 0) return offers;
  const ids = new Set(picked.map((o) => o.id));
  const rest = offers.filter((o) => !ids.has(o.id));
  const out: (T & { sponsored?: boolean })[] = [...rest];
  picked.forEach((o, i) => out.splice(Math.min(slots[i]!, out.length), 0, o));
  return out;
}
