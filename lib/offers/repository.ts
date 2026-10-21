// Point d'entrée des pages : la vraie base si elle est configurée, sinon les offres d'exemple.

import type { DecodedOffer } from '@/lib/decode/schema';
import { DEMO_DECODES, DEMO_OFFERS } from './demo';
import { dedupe, filterOffers } from './filter';
import { getCachedDecode, getOffer, isDatabaseConfigured, searchOffers } from './store';
import { isLiveConfigured, liveOffer, liveSearch } from './live';
import type { Offer, OfferFilters, OfferPage } from './types';

export async function listOffers(filters: OfferFilters): Promise<OfferPage> {
  if (isDatabaseConfigured()) return searchOffers(filters);
  if (isLiveConfigured()) return liveSearch(filters);
  return filterOffers(DEMO_OFFERS, filters, 'exemples');
}

export async function findOffer(id: string): Promise<Offer | null> {
  if (id.startsWith('exemple:')) return dedupe(DEMO_OFFERS).find((o) => o.id === id) ?? null;
  if (isDatabaseConfigured()) return getOffer(id);
  if (isLiveConfigured() && id.startsWith('france-travail:')) return liveOffer(id.slice('france-travail:'.length));
  return null;
}

/** Traduction déjà disponible sans appeler l'IA : celle des exemples, ou celle gardée en base. */
export async function findDecode(id: string): Promise<DecodedOffer | null> {
  if (id.startsWith('exemple:')) return DEMO_DECODES[id] ?? null;
  if (!isDatabaseConfigured()) return memoryDecodes.get(id) ?? null;
  return getCachedDecode(id);
}

/** Sans base, les traductions sont gardées en mémoire le temps que le serveur tourne. */
const memoryDecodes = new Map<string, DecodedOffer>();

export function rememberDecode(id: string, decoded: DecodedOffer) {
  if (memoryDecodes.size > 2000) memoryDecodes.clear();
  memoryDecodes.set(id, decoded);
}
