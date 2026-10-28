// Tout ce qui éclaire la paie d'une offre, rassemblé côté serveur pour sa fiche :
// salaires déclarés par les alternants de l'entreprise, leurs avis, sa convention collective.

import { communityPayFor, companyPage, findCompanySiren, MIN_TO_SHOW } from '@/lib/companies/store';
import { companyBySiren, searchCompanies } from '@/lib/companies/search';
import { isAccountsConfigured } from '@/lib/account/store';
import { CONVENTION_NAMES } from '@/lib/rules/conventions';
import { sameName } from './logo-resolve';
import { mentionsLegalGrid, type PayContext } from './pay-estimate';
import type { Offer } from './types';

/** Le SIREN de l'employeur : donné par la source, connu de la base, ou retrouvé dans l'annuaire sous le même nom exact. */
async function sirenAndConventions(offer: Offer): Promise<{ siren: string | null; idcc: string[] }> {
  const known = offer.companySiren ?? (isAccountsConfigured() ? await findCompanySiren(offer.company).catch(() => null) : null);
  if (known) return { siren: known, idcc: (await companyBySiren(known).catch(() => null))?.idcc ?? [] };
  if (!offer.company) return { siren: null, idcc: [] };
  const results = await searchCompanies(offer.company).catch(() => []);
  const hit = results.find((r) => sameName(r.name, offer.company!) || sameName(r.name.replace(/\([^)]*\)/g, ''), offer.company!));
  return { siren: hit?.siren ?? null, idcc: hit?.idcc ?? [] };
}

export async function payContext(offer: Offer): Promise<PayContext> {
  const legalGrid = mentionsLegalGrid(offer.salaryText, offer.description);
  const empty: PayContext = { community: null, legalGrid, jobs: [], reviews: [], reviewCount: 0, companyHref: null, conventions: [] };
  if (offer.source === 'exemple') return empty;

  const { siren, idcc } = await sirenAndConventions(offer);
  const conventions = [...new Set([...(offer.idcc ? [offer.idcc] : []), ...idcc])].map((code) => ({ idcc: code, name: CONVENTION_NAMES[code] ?? null }));
  const withSiren = { ...offer, companySiren: siren };
  const community = (await communityPayFor([withSiren])).get(offer.id) ?? null;
  const page = siren && isAccountsConfigured() ? await companyPage(siren).catch(() => null) : null;
  return {
    community,
    legalGrid,
    jobs: page?.salaries.jobs.filter((j) => j.count >= MIN_TO_SHOW) ?? [],
    reviews: page?.list.slice(0, 3) ?? [],
    reviewCount: page?.reviews.count ?? 0,
    companyHref: page ? `/entreprises/${page.company.siren}` : null,
    conventions,
    employer: offer.employerPay ?? null,
  };
}
