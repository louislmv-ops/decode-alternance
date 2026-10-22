// Adzuna (developer.adzuna.com) : un agrégateur qui ramasse les offres de centaines de sites.
// Clé gratuite et immédiate : ADZUNA_APP_ID et ADZUNA_APP_KEY. Leurs conditions demandent de citer
// Adzuna et de passer par leur lien de redirection pour postuler, ce que fait sourceUrl.

import { DEPARTMENT_NAMES } from '@/lib/departments';
import { htmlToText, parseSalary } from '../normalize';
import type { Offer } from '../types';
import { aggregatorOffer, departmentFromPlace, plausibleMonthly } from './aggregator';
import { fetchText } from './http';

const api = () => process.env.ADZUNA_API_URL || 'https://api.adzuna.com/v1/api';

export function isAdzunaConfigured(): boolean {
  return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
}

export interface AdzunaJob {
  id: string | number;
  title?: string;
  description?: string;
  created?: string;
  redirect_url?: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  salary_min?: number;
  salary_is_predicted?: string | number;
}

export function adzunaToOffer(job: AdzunaJob, department: string | null = null): Offer | null {
  const title = htmlToText(job.title ?? '');
  const description = htmlToText(job.description ?? '');
  const area = job.location?.area ?? [];
  const city = area.length > 0 ? area[area.length - 1]! : (job.location?.display_name?.split(',')[0]?.trim() ?? null);
  // Adzuna estime parfois le salaire : on ne garde que celui écrit dans l'annonce. Il est annuel.
  const announced = job.salary_min && String(job.salary_is_predicted) !== '1' ? job.salary_min : null;
  const monthly = announced ? plausibleMonthly((announced > 6000 ? announced / 12 : announced) * 100) : null;
  return aggregatorOffer({
    source: 'adzuna',
    sourceId: String(job.id),
    sourceUrl: job.redirect_url ?? '',
    title,
    company: job.company?.display_name?.trim() || null,
    city,
    department: departmentFromPlace([...area.slice(2).reverse(), job.location?.display_name]) ?? department,
    description,
    salaryText: monthly ? `${Math.round(monthly / 100)} € brut par mois` : null,
    salaryMonthlyCents: monthly ?? parseSalary(description),
    publishedAt: job.created ?? '',
  });
}

/** Une page de résultats d'alternance, la plus récente d'abord. */
export async function searchAdzuna(opts: { q?: string; department?: string; page: number; perPage: number }): Promise<{ offers: Offer[]; total: number }> {
  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID!,
    app_key: process.env.ADZUNA_APP_KEY!,
    results_per_page: String(opts.perPage),
    what: ['alternance', opts.q].filter(Boolean).join(' '),
    sort_by: 'date',
    'content-type': 'application/json',
  });
  if (opts.department && DEPARTMENT_NAMES[opts.department]) params.set('where', DEPARTMENT_NAMES[opts.department]!);
  const res = await fetchText(`${api()}/jobs/fr/search/${opts.page}?${params}`, { headers: { Accept: 'application/json' }, timeoutMs: 8000 });
  if (res.status !== 200) throw new Error(`Adzuna : HTTP ${res.status}`);
  const data = JSON.parse(res.text) as { count?: number; results?: AdzunaJob[] };
  const offers = (data.results ?? []).map((j) => adzunaToOffer(j, opts.department ?? null)).filter((o): o is Offer => o !== null);
  return { offers, total: data.count ?? offers.length };
}
