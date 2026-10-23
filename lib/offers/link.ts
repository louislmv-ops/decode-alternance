import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { isAggregatorUrl, type Offer } from './types';

// Lien de secours vers l'annonce d'origine, pour une offre d'agrégateur qu'un serveur n'a plus en mémoire.
// Les annonces de La bonne alternance renvoient vers des dizaines de sites partenaires : plutôt qu'une liste
// d'hôtes, le lien est signé. Personne ne peut fabriquer un lien Décode qui renvoie vers un site quelconque.

const secret = () => process.env.AUTH_SECRET || process.env.LBA_API_TOKEN || process.env.JOOBLE_API_KEY || '';

function sign(url: string): string {
  return createHmac('sha256', secret()).update(url).digest('base64url').slice(0, 22);
}

/** Adresse de la fiche Décode d'une offre ; pour un agrégateur, elle garde le lien d'origine, signé, en secours. */
export function offerHref(offer: Pick<Offer, 'id' | 'source' | 'sourceUrl'>): string {
  const base = `/offres/${encodeURIComponent(offer.id)}`;
  if (offer.source !== 'adzuna' && offer.source !== 'jooble' && offer.source !== 'la-bonne-alternance') return base;
  const params = new URLSearchParams({ u: offer.sourceUrl });
  if (secret()) params.set('s', sign(offer.sourceUrl));
  return `${base}?${params}`;
}

/** Ce lien de secours peut-il servir ? Signé par ce site, ou vers un agrégateur connu. Toujours en https. */
export function isTrustedSourceLink(url: string, signature: string | undefined): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  if (isAggregatorUrl(url)) return true;
  if (!signature || !secret()) return false;
  const expected = Buffer.from(sign(url));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
