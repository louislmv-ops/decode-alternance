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

export function logoSrc(offer: Pick<Offer, 'logoUrl' | 'companySite'>): string | null {
  if (offer.logoUrl && /^https:\/\//i.test(offer.logoUrl) && domainOf(offer.logoUrl)) return `/api/logo?u=${encodeURIComponent(offer.logoUrl)}`;
  const domain = domainOf(offer.companySite);
  return domain ? `/api/logo?d=${encodeURIComponent(domain)}` : null;
}
