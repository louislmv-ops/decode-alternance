import { JsonLd } from '@/components/JsonLd';
import { breadcrumbJsonLd, jobPostingJsonLd } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import { extractPerks } from '@/lib/offers/perks';
import { tasteOf } from '@/lib/taste';
import { offerHref } from '@/lib/offers/link';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { DecodedView, type OfferMeta } from '@/components/offer/DecodedView';
import { BackLink } from '@/components/BackLink';
import { InterviewPrep } from '@/components/pro/InterviewPrep';
import { isAccountsConfigured } from '@/lib/account/store';
import { UndecodedOffer } from '@/components/offer/DecodeButton';
import { findDecode, findOffer, withEmployerPay } from '@/lib/offers/repository';
import { payContext } from '@/lib/offers/pay-context';
import { isTrustedSourceLink } from '@/lib/offers/link';
import { SOURCE_LABELS } from '@/lib/offers/types';
import { detailsOf, REMOTE_LABELS, skillLabel } from '@/lib/offers/details';
import { geocodeCached } from '@/lib/offers/geocode';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ u?: string; s?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const offer = await findOffer(decodeURIComponent((await params).id));
  if (!offer) return { title: 'Offre introuvable', robots: { index: false } };
  const where = [offer.company, offer.city].filter(Boolean).join(', ');
  return {
    title: offer.title,
    description: `Alternance ${offer.title}${where ? ` chez ${where}` : ''} : missions en clair, salaire comparé à ton minimum et qui contacter.`,
    robots: offer.source === 'exemple' ? { index: false } : undefined,
    // Le lien de secours (?u=…) ne doit pas créer de doublons dans Google.
    alternates: { canonical: `/offres/${encodeURIComponent(offer.id)}` },
  };
}

export default async function OfferPage({ params, searchParams }: Props) {
  const id = decodeURIComponent((await params).id);
  const found = await findOffer(id);
  if (!found) {
    // Une offre d'agrégateur que ce serveur n'a plus en mémoire : on renvoie vers l'annonce d'origine.
    const { u, s } = await searchParams;
    if (u && isTrustedSourceLink(u, s)) redirect(u);
    notFound();
  }
  // Sans salaire dans l'annonce : celui que l'entreprise écrit dans ses autres annonces, quand on le connaît.
  const [offer] = (await withEmployerPay([found])) as [typeof found];
  const [decoded, pay, point] = await Promise.all([
    findDecode(id),
    payContext(offer),
    // La position donnée par la source, sinon le centre de sa ville (cherché une fois, puis gardé en mémoire).
    offer.lat != null && offer.lon != null
      ? Promise.resolve({ lat: offer.lat, lon: offer.lon })
      : offer.city || offer.postalCode
        ? geocodeCached({ postalCode: offer.postalCode, city: offer.city, department: offer.department })
        : Promise.resolve(null),
  ]);

  const meta: OfferMeta = {
    id: offer.id,
    title: offer.title,
    company: offer.company,
    city: offer.city,
    sourceUrl: offer.sourceUrl,
    sourceLabel: offer.direct ? 'Direct entreprise' : SOURCE_LABELS[offer.source],
    salaryCents: offer.salaryMonthlyCents,
    salaryMaxCents: offer.salaryMaxCents ?? null,
    schoolFlags: offer.schoolFlags,
    isExample: offer.source === 'exemple',
    department: offer.department,
    diplomaLevel: offer.diplomaLevel,
    pay,
    perks: extractPerks(offer.description, offer.salaryText),
    taste: tasteOf(offer, offerHref(offer), extractPerks(offer.description, offer.salaryText)),
    publishedAt: offer.publishedAt,
    description: offer.description,
    excerpt: offer.source === 'adzuna' || offer.source === 'jooble',
    contractKind: offer.contract,
    easyApply: offer.easyApply ?? false,
    remote: (() => {
      const r = detailsOf(offer).remote;
      return r ? REMOTE_LABELS[r] : null;
    })(),
    skills: detailsOf(offer).skills.map((x) => skillLabel(x) ?? x),
    contract: offer.contract === 'apprentissage' ? 'Apprentissage' : offer.contract === 'professionnalisation' ? 'Contrat pro' : null,
    place: point
      ? {
          ...point,
          precision: offer.lat != null && offer.geoPrecision === 'adresse' ? 'adresse' : 'ville',
          label: [offer.postalCode, offer.city].filter(Boolean).join(' ') || null,
        }
      : null,
  };

  const posting = offer.source === 'exemple' ? null : jobPostingJsonLd(offer, `${SITE_URL}/offres/${encodeURIComponent(offer.id)}`);

  return (
    <>
      {posting && <JsonLd data={posting} />}
      {offer.source !== 'exemple' && (
        <JsonLd
          data={breadcrumbJsonLd([
            { name: 'Accueil', path: '/' },
            { name: 'Offres', path: '/offres' },
            { name: offer.title, path: `/offres/${encodeURIComponent(offer.id)}` },
          ])}
        />
      )}
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
