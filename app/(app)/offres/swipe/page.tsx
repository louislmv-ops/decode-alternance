import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { SwipeDeck, type SwipeCard } from '@/components/offer/SwipeDeck';
import { DEPARTMENT_NAMES } from '@/lib/departments';
import { relativeDays } from '@/lib/format';
import { filtersWithPlace } from '@/lib/offers/filter';
import { PLACE_COOKIE } from '@/lib/place';
import { highlights } from '@/lib/offers/highlights';
import { communityPayFor } from '@/lib/companies/store';
import { payEstimateHint } from '@/lib/offers/pay-estimate';
import { PAY_TIER_LABELS } from '@/lib/offers/pay-tier';
import { listOffers } from '@/lib/offers/repository';
import { cleanTitle } from '@/lib/offers/title';
import { offerHref } from '@/lib/offers/link';
import { logoSrc } from '@/lib/offers/logo';
import { decodePayCookie, PROFILE_COOKIE } from '@/lib/profile';

export const metadata: Metadata = { title: 'Mode swipe', robots: { index: false } };

const CONTRACT_LABELS = { apprentissage: 'Apprentissage', professionnalisation: 'Contrat pro', alternance: 'Alternance' };

/** Une offre à la fois, plein écran : on garde ou on passe. Mêmes filtres que la liste. */
export default async function SwipePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const jar = await cookies();
  const filters = filtersWithPlace(params, jar.get(PLACE_COOKIE)?.value);
  const profile = decodePayCookie(jar.get(PROFILE_COOKIE)?.value);
  const result = await listOffers(filters).catch(() => null);
  const community = await communityPayFor(result?.offers ?? []);
  const cards: SwipeCard[] = (result?.offers ?? [])
    .map((offer) => ({ offer, h: highlights(offer, profile, community.get(offer.id)) }))
    .filter(({ h }) => !h.schoolBait)
    .map(({ offer, h }) => ({
      id: offer.id,
      href: offerHref(offer),
      logo: logoSrc(offer),
      company: offer.company ?? 'Entreprise non nommée',
      title: cleanTitle(offer.title),
      facts: [offer.city ?? (offer.department ? DEPARTMENT_NAMES[offer.department] : null), CONTRACT_LABELS[offer.contract], relativeDays(offer.publishedAt), offer.easyApply ? '⚡ Candidature simplifiée' : null]
        .filter((x): x is string => Boolean(x))
        .join(' · '),
      tier: h.tier,
      payHint: payEstimateHint(h.estimate, PAY_TIER_LABELS[h.tier]),
      pepite: h.pepite,
    }));
  const next = new URLSearchParams(Object.entries(params).flatMap(([k, v]) => (typeof v === 'string' && k !== 'page' ? [[k, v]] : [])));
  const page = result?.page ?? 1;
  const hasMore = result ? page * result.pageSize < result.total : false;
  if (hasMore) next.set('page', String(page + 1));
  return <SwipeDeck cards={cards} nextHref={hasMore ? `/offres/swipe?${next}` : null} />;
}
