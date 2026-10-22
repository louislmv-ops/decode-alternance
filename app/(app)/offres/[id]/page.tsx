import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DecodedView, type OfferMeta } from '@/components/offer/DecodedView';
import { BackLink } from '@/components/BackLink';
import { InterviewPrep } from '@/components/pro/InterviewPrep';
import { UndecodedOffer } from '@/components/offer/DecodeButton';
import { findDecode, findOffer } from '@/lib/offers/repository';
import { SOURCE_LABELS } from '@/lib/offers/types';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const offer = await findOffer(decodeURIComponent((await params).id));
  if (!offer) return { title: 'Offre introuvable', robots: { index: false } };
  const where = [offer.company, offer.city].filter(Boolean).join(', ');
  return {
    title: offer.title,
    description: `Alternance ${offer.title}${where ? ` chez ${where}` : ''} : missions en clair, salaire comparé à ton minimum et qui contacter.`,
    robots: offer.source === 'exemple' ? { index: false } : undefined,
  };
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
    department: offer.department,
    diplomaLevel: offer.diplomaLevel,
    contract: offer.contract === 'apprentissage' ? 'Apprentissage' : offer.contract === 'professionnalisation' ? 'Contrat pro' : null,
  };

  return (
    <>
      <div className="back-row">
        <BackLink fallback="/offres" label="Offres" />
        {offer.company && offer.source !== 'exemple' && (
          <Link href={`/entreprises?q=${encodeURIComponent(offer.company)}`} className="link back-row__aside">
            Avis et salaires
          </Link>
        )}
      </div>
      {decoded ? <DecodedView decoded={decoded} offer={meta} /> : <UndecodedOffer offer={meta} description={offer.description} />}
      {offer.source !== 'exemple' && <InterviewPrep offerId={offer.id} />}
    </>
  );
}
