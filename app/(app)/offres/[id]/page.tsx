import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DecodedView, type OfferMeta } from '@/components/offer/DecodedView';
import { UndecodedOffer } from '@/components/offer/DecodeButton';
import { findDecode, findOffer } from '@/lib/offers/repository';
import { SOURCE_LABELS } from '@/lib/offers/types';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const offer = await findOffer(decodeURIComponent((await params).id));
  return { title: offer ? offer.title : 'Offre introuvable', robots: offer?.source === 'exemple' ? { index: false } : undefined };
}

export default async function OfferPage({ params }: Props) {
  const id = decodeURIComponent((await params).id);
  const offer = await findOffer(id);
  if (!offer) notFound();
  const decoded = await findDecode(id);

  const meta: OfferMeta = {
    id: offer.id,
    title: offer.title,
    company: offer.company,
    city: offer.city,
    sourceUrl: offer.sourceUrl,
    sourceLabel: offer.direct ? 'Direct entreprise' : SOURCE_LABELS[offer.source],
    salaryCents: offer.salaryMonthlyCents,
    schoolFlags: offer.schoolFlags,
    isExample: offer.source === 'exemple',
  };

  return decoded ? <DecodedView decoded={decoded} offer={meta} /> : <UndecodedOffer offer={meta} description={offer.description} />;
}
