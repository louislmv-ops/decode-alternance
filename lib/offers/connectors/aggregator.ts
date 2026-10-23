// Ce que les agrégateurs (Adzuna, Jooble) ont en commun : retrouver le département à partir d'un nom
// de lieu, et transformer une annonce en offre normalisée.

import { DEPARTMENT_NAMES } from '@/lib/departments';
import { departmentFromPostalCode, detectContract, detectDiplomaLevel, fingerprint, isAlternance, normalizeText, schoolBaitFlags } from '../normalize';
import type { Offer, OfferSource } from '../types';

const BY_NAME = new Map(Object.entries(DEPARTMENT_NAMES).map(([code, name]) => [normalizeText(name), code]));

/** « Lyon, Rhône » ou ["France", "Auvergne-Rhône-Alpes", "Rhône", "Lyon"] : le département quand on le reconnaît. */
export function departmentFromPlace(parts: (string | null | undefined)[]): string | null {
  for (const part of parts) {
    if (!part) continue;
    const cp = part.match(/\b\d{5}\b/)?.[0];
    if (cp) return departmentFromPostalCode(cp);
    for (const piece of part.split(/[,(]/)) {
      const code = BY_NAME.get(normalizeText(piece));
      if (code) return code;
    }
    // Paris n'est pas écrit « Paris (75) » partout : la ville vaut le département.
    if (/^paris\b/.test(normalizeText(part))) return '75';
  }
  return null;
}

/** Un salaire mensuel brut plausible, en centimes, ou rien. */
export function plausibleMonthly(cents: number | null): number | null {
  return cents !== null && cents >= 30_000 && cents <= 800_000 ? Math.round(cents) : null;
}

export function aggregatorOffer(input: {
  source: OfferSource;
  sourceId: string;
  sourceUrl: string;
  title: string;
  company: string | null;
  city: string | null;
  department: string | null;
  description: string;
  salaryText: string | null;
  salaryMonthlyCents: number | null;
  salaryMaxCents?: number | null;
  publishedAt: string;
}): Offer | null {
  if (!input.title || !input.sourceUrl || !isAlternance(input.title, input.description)) return null;
  const published = new Date(input.publishedAt);
  return {
    id: `${input.source}:${input.sourceId}`,
    source: input.source,
    sourceId: input.sourceId,
    sourceUrl: input.sourceUrl,
    title: input.title,
    company: input.company,
    companySize: null,
    city: input.city,
    postalCode: null,
    department: input.department,
    contract: detectContract(`${input.title} ${input.description}`),
    diplomaLevel: detectDiplomaLevel(`${input.title} ${input.description}`),
    salaryText: input.salaryText,
    salaryMonthlyCents: input.salaryMonthlyCents,
    salaryMaxCents: input.salaryMaxCents ?? null,
    startDate: null,
    publishedAt: Number.isNaN(published.getTime()) ? new Date().toISOString() : published.toISOString(),
    description: input.description,
    direct: false,
    fingerprint: fingerprint(input.company, input.title, input.city),
    schoolFlags: schoolBaitFlags({ company: input.company, title: input.title, description: input.description }),
    alsoOn: [],
  };
}
