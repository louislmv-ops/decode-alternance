import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { DecodedView, type OfferMeta } from '@/components/offer/DecodedView';
import { BackLink } from '@/components/BackLink';
import { InterviewPrep } from '@/components/pro/InterviewPrep';
import { isAccountsConfigured } from '@/lib/account/store';
import { UndecodedOffer } from '@/components/offer/DecodeButton';
import { findDecode, findOffer } from '@/lib/offers/repository';
import { payContext } from '@/lib/offers/pay-context';
import { isAggregatorUrl, SOURCE_LABELS } from '@/lib/offers/types';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ u?: string }> };

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

export default async function OfferPage({ params, searchParams }: Props) {
  const id = decodeURIComponent((await params).id);
  const offer = await findOffer(id);
  if (!offer) {
    // Une offre d'agrégateur que ce serveur n'a plus en mémoire : on renvoie vers l'annonce d'origine.
    const { u } = await searchParams;
    if (u && isAggregatorUrl(u)) redirect(u);
    notFound();
  }
  const [decoded, pay] = await Promise.all([findDecode(id), payContext(offer)]);

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
    pay,
    publishedAt: offer.publishedAt,
    contractKind: offer.contract,
    easyApply: offer.easyApply ?? false,
    contract: offer.contract === 'apprentissage' ? 'Apprentissage' : offer.contract === 'professionnalisation' ? 'Contrat pro' : null,
  };

  return (
    <>
      <div className="back-row">
        <BackLink fallback="/offres" label="Offres" />
        {offer.company && offer.source !== 'exemple' && (
          <Link href={`/entreprises?q=${encodeURIComponent(offer.company)}`} className="link back-row__aside" data-needs="comptes">
            Avis et salaires
          </Link>
        )}
      </div>
      {decoded ? <DecodedView decoded={decoded} offer={meta} /> : <UndecodedOffer offer={meta} description={offer.description} />}
      {offer.source !== 'exemple' && isAccountsConfigured() && <InterviewPrep offerId={offer.id} />}
    </>
  );
}
