// Données structurées (schema.org) : le site, l'organisation, la FAQ et les offres d'emploi.
// Google s'en sert pour les résultats enrichis et Google for Jobs ; les assistants IA pour citer le site.

import type { Offer } from '@/lib/offers/types';
import { SITE_URL } from '@/lib/site';

export const SITE_NAME = 'Décode';

export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organisation`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon.png`,
        description: 'Décode traduit les offres d’alternance en langage clair, calcule le salaire minimum légal de l’alternant et écarte les fausses offres d’écoles.',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#site`,
        name: 'Décode : l’alternance, en clair',
        url: SITE_URL,
        inLanguage: 'fr-FR',
        publisher: { '@id': `${SITE_URL}/#organisation` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/offres?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

/** Sources dont l'annonce est complète : seules celles-là peuvent être déclarées à Google for Jobs. */
const FULL_TEXT: Offer['source'][] = ['france-travail', 'la-bonne-alternance', 'site-carriere'];

/** L'offre au format JobPosting, ou null quand l'annonce n'est qu'un extrait ou un exemple. */
export function jobPostingJsonLd(offer: Offer, url: string) {
  if (!FULL_TEXT.includes(offer.source) || !offer.company || offer.description.length < 120) return null;
  const posted = new Date(offer.publishedAt);
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: offer.title,
    description: offer.description
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`)
      .join(''),
    datePosted: posted.toISOString(),
    // Un contrat d'alternance est un contrat de travail à temps plein (école comprise).
    employmentType: 'FULL_TIME',
    hiringOrganization: { '@type': 'Organization', name: offer.company, ...(offer.companySite ? { sameAs: offer.companySite } : {}) },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        ...(offer.city ? { addressLocality: offer.city } : {}),
        ...(offer.postalCode ? { postalCode: offer.postalCode } : {}),
        addressCountry: 'FR',
      },
    },
    ...(offer.salaryMonthlyCents
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'EUR',
            value: {
              '@type': 'QuantitativeValue',
              unitText: 'MONTH',
              minValue: offer.salaryMonthlyCents / 100,
              ...(offer.salaryMaxCents ? { maxValue: offer.salaryMaxCents / 100 } : { value: offer.salaryMonthlyCents / 100 }),
            },
          },
        }
      : {}),
    directApply: false,
    url,
  };
}
