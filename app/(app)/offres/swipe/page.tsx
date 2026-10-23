import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { SwipeDeck, type SwipeCard } from '@/components/offer/SwipeDeck';
import { DEPARTMENT_NAMES } from '@/lib/departments';
import { relativeDays } from '@/lib/format';
import { parseFilters } from '@/lib/offers/filter';
import { highlights } from '@/lib/offers/highlights';
import { payTier } from '@/lib/offers/pay-tier';
import { listOffers } from '@/lib/offers/repository';
import { cleanTitle } from '@/lib/offers/title';
import { offerHref } from '@/lib/offers/types';
import { logoSrc } from '@/lib/offers/logo';
import { decodePayCookie, PROFILE_COOKIE } from '@/lib/profile';

export const metadata: Metadata = { title: 'Mode swipe', robots: { index: false } };

const CONTRACT_LABELS = { apprentissage: 'Apprentissage', professionnalisation: 'Contrat pro', alternance: 'Alternance' };

/** Une offre à la fois, plein écran : on garde ou on passe. Mêmes filtres que la liste. */
export default async function SwipePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const profile = decodePayCookie((await cookies()).get(PROFILE_COOKIE)?.value);
  const result = await listOffers(filters).catch(() => null);
  const cards: SwipeCard[] = (result?.offers ?? [])
    .map((offer) => ({ offer, h: highlights(offer, profile) }))
    .filter(({ h }) => !h.schoolBait)
    .map(({ offer, h }) => ({
      id: offer.id,
      href: offerHref(offer),
      logo: logoSrc(offer),
      company: offer.company ?? 'Entreprise non nommée',
      title: cleanTitle(offer.title),
      facts: [offer.city ?? (offer.department ? DEPARTMENT_NAMES[offer.department] : null), CONTRACT_LABELS[offer.contract], relativeDays(offer.publishedAt)]
        .filter((x): x is string => Boolean(x))
        .join(' · '),
      payCents: offer.salaryMonthlyCents,
      minimumCents: h.minimumCents,
      tier: payTier(offer.salaryMonthlyCents, h.minimumCents),
      diffPercent: h.pay && h.pay.diffPercent > 0 ? h.pay.diffPercent : null,
      pepite: h.pepite,
    }));
  const next = new URLSearchParams(Object.entries(params).flatMap(([k, v]) => (typeof v === 'string' && k !== 'page' ? [[k, v]] : [])));
  const page = result?.page ?? 1;
  const hasMore = result ? page * result.pageSize < result.total : false;
  if (hasMore) next.set('page', String(page + 1));
  return <SwipeDeck cards={cards} nextHref={hasMore ? `/offres/swipe?${next}` : null} />;
}
