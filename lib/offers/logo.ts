// Le logo d'une entreprise : celui fourni par la source, sinon l'icône de son site. Tout passe par
// /api/logo : les visiteurs ne contactent pas de service tiers, et l'image est mise en cache.
// Jamais de logo deviné à partir du seul nom : mieux vaut l'initiale qu'un logo d'une autre entreprise.

import type { Offer } from './types';

/** « https://www.decathlon.fr/carrieres » devient « decathlon.fr ». */
export function domainOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, '');
    return isPublicHost(host) ? host : null;
  } catch {
    return null;
  }
}

/** Un nom de domaine public : pas d'adresse IP, pas de nom local. */
export function isPublicHost(host: string): boolean {
  return /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/.test(host) && !/(^|\.)(localhost|local|internal|lan)$/.test(host);
}

/** Noms qui ne désignent pas une entreprise : pas la peine de chercher un logo. */
const NO_NAME = /^(entreprise|societe|confidentiel|anonyme|non communique|non renseigne|n c)\b/i;

export function logoSrc(offer: Pick<Offer, 'logoUrl' | 'companySite'> & { company?: string | null; source?: Offer['source'] }): string | null {
  if (offer.logoUrl && /^https:\/\//i.test(offer.logoUrl) && domainOf(offer.logoUrl)) return `/api/logo?u=${encodeURIComponent(offer.logoUrl)}`;
  const domain = domainOf(offer.companySite);
  if (domain) return `/api/logo?d=${encodeURIComponent(domain)}`;
  // Les entreprises des exemples sont fictives : surtout ne pas leur trouver le logo d'une vraie.
  if (offer.source === 'exemple') return null;
  const name = offer.company?.trim();
  return name && name.length >= 2 && !NO_NAME.test(name) ? `/api/logo?n=${encodeURIComponent(name)}` : null;
}
