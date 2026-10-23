// API Apprentissage (api.apprentissage.beta.gouv.fr), route /job/v1/search : les offres d'alternance
// recensées par La bonne alternance (France Travail, sites partenaires, offres déposées chez eux),
// réutilisables gratuitement. Jeton personnel : LBA_API_TOKEN. Limite : 60 appels par minute.
// La route ne cherche ni par mot-clé ni par page : on filtre par département, puis ici par mots.

import { normalizeText, departmentFromPostalCode, fingerprint, parseSalary, schoolBaitFlags, sizeFromHeadcount } from '../normalize';
import type { DiplomaLevel } from '@/lib/rules/employer';
import type { Offer, OfferContract } from '../types';
import { departmentFromPlace } from './aggregator';
import { fetchText } from './http';

const api = () => process.env.LBA_API_URL || 'https://api.apprentissage.beta.gouv.fr/api';

export function isLbaConfigured(): boolean {
  return Boolean(process.env.LBA_API_TOKEN);
}

export interface LbaJob {
  identifier?: { id?: string | null; partner_job_id?: string; partner_label?: string };
  workplace?: {
    name?: string | null;
    brand?: string | null;
    legal_name?: string | null;
    size?: string | null;
    location?: { address?: string };
  };
  apply?: { url?: string };
  contract?: { type?: string[]; start?: string | null };
  offer?: {
    title?: string;
    description?: string;
    desired_skills?: string[];
    access_conditions?: string[];
    publication?: { creation?: string | null };
    target_diploma?: { european?: string } | null;
    status?: string;
  };
}

export function lbaToOffer(job: LbaJob): Offer | null {
  const title = job.offer?.title?.trim();
  const url = job.apply?.url;
  const id = job.identifier?.id ?? job.identifier?.partner_job_id;
  if (!title || !url || !id || (job.offer?.status && job.offer.status !== 'Active')) return null;
  const company = job.workplace?.brand || job.workplace?.name || job.workplace?.legal_name || null;
  const address = job.workplace?.location?.address ?? '';
  const postalCode = address.match(/\b\d{5}\b/)?.[0] ?? null;
  const city = address.replace(/^.*\b\d{5}\b\s*/, '').trim() || null;
  const types = job.contract?.type ?? [];
  const contract: OfferContract = types.length === 1 ? (types[0] === 'Professionnalisation' ? 'professionnalisation' : 'apprentissage') : 'alternance';
  const level = Number(job.offer?.target_diploma?.european);
  const description = [
    job.offer?.description ?? '',
    job.offer?.desired_skills?.length ? `Compétences attendues : ${job.offer.desired_skills.join(', ')}` : '',
    job.offer?.access_conditions?.length ? `Conditions : ${job.offer.access_conditions.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  return {
    id: `la-bonne-alternance:${id}`,
    source: 'la-bonne-alternance',
    sourceId: String(id),
    sourceUrl: url,
    title,
    company,
    companySize: sizeFromHeadcount(job.workplace?.size),
    city,
    postalCode,
    department: departmentFromPostalCode(postalCode) ?? departmentFromPlace([address]),
    contract,
    diplomaLevel: level >= 3 && level <= 7 ? (level as DiplomaLevel) : null,
    salaryText: null,
    salaryMonthlyCents: parseSalary(description),
    startDate: job.contract?.start ? job.contract.start.slice(0, 10) : null,
    publishedAt: job.offer?.publication?.creation ?? new Date().toISOString(),
    description,
    direct: false,
    fingerprint: fingerprint(company, title, city),
    schoolFlags: schoolBaitFlags({ company, title, description }),
    alsoOn: [],
  };
}

/** Toutes les offres d'un département (ou de la France entière), en un appel. */
export async function fetchLba(department?: string): Promise<Offer[]> {
  const params = new URLSearchParams();
  if (department) params.set('departements', department);
  const res = await fetchText(`${api()}/job/v1/search${params.size ? `?${params}` : ''}`, {
    headers: { Authorization: `Bearer ${process.env.LBA_API_TOKEN}`, Accept: 'application/json' },
    timeoutMs: 15_000,
  });
  if (res.status !== 200) throw new Error(`La bonne alternance : HTTP ${res.status} ${res.text.slice(0, 200)}`);
  const data = JSON.parse(res.text) as { jobs?: LbaJob[]; warnings?: { message: string }[] };
  if (data.warnings?.length) console.warn('La bonne alternance :', data.warnings.map((w) => w.message).join(' · '));
  return (data.jobs ?? []).map(lbaToOffer).filter((o): o is Offer => o !== null);
}

/** Une page de résultats, filtrée par mots côté Décode puisque l'API ne le fait pas. */
export function pageOf(offers: Offer[], q: string | undefined, page: number, perPage: number): { offers: Offer[]; total: number } {
  const words = normalizeText(q ?? '').split(' ').filter(Boolean);
  const matching = words.length
    ? offers.filter((o) => {
        const hay = normalizeText(`${o.title} ${o.company ?? ''} ${o.city ?? ''} ${o.description.slice(0, 600)}`);
        return words.every((w) => hay.includes(w));
      })
    : offers;
  const sorted = [...matching].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return { offers: sorted.slice((page - 1) * perPage, page * perPage), total: sorted.length };
}
