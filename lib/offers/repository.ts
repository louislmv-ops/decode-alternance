// Point d'entrée des pages : la vraie base si elle est configurée, sinon les offres d'exemple.

import type { DecodedOffer } from '@/lib/decode/schema';
import { DEMO_DECODES, DEMO_OFFERS } from './demo';
import { dedupe, filterOffers } from './filter';
import { getCachedDecode, getOffer, isDatabaseConfigured, searchOffers } from './store';
import type { Offer, OfferFilters, OfferPage } from './types';

export async function listOffers(filters: OfferFilters): Promise<OfferPage> {
  if (isDatabaseConfigured()) return searchOffers(filters);
  return filterOffers(DEMO_OFFERS, filters, 'exemples');
}

export async function findOffer(id: string): Promise<Offer | null> {
  if (id.startsWith('exemple:')) return dedupe(DEMO_OFFERS).find((o) => o.id === id) ?? null;
  if (!isDatabaseConfigured()) return null;
  return getOffer(id);
}

/** Traduction déjà disponible sans appeler l'IA : celle des exemples, ou celle gardée en base. */
export async function findDecode(id: string): Promise<DecodedOffer | null> {
  if (id.startsWith('exemple:')) return DEMO_DECODES[id] ?? null;
  if (!isDatabaseConfigured()) return null;
  return getCachedDecode(id);
}
