// Jooble (jooble.org/api/about) : un autre agrégateur, clé gratuite sur demande : JOOBLE_API_KEY.

import { DEPARTMENT_NAMES } from '@/lib/departments';
import { htmlToText, parseSalaryRange } from '../normalize';
import type { Offer } from '../types';
import { aggregatorOffer, departmentFromPlace } from './aggregator';
import { fetchText } from './http';

const api = () => process.env.JOOBLE_API_URL || 'https://jooble.org/api';

export function isJoobleConfigured(): boolean {
  return Boolean(process.env.JOOBLE_API_KEY);
}

export interface JoobleJob {
  id?: string | number;
  title?: string;
  location?: string;
  snippet?: string;
  salary?: string;
  link?: string;
  company?: string;
  updated?: string;
}

export function joobleToOffer(job: JoobleJob, department: string | null = null): Offer | null {
  const location = job.location?.trim() || null;
  return aggregatorOffer({
    source: 'jooble',
    sourceId: String(job.id ?? job.link ?? ''),
    sourceUrl: job.link ?? '',
    title: htmlToText(job.title ?? ''),
    company: job.company?.trim() || null,
    city: location?.split(',')[0]?.trim() || null,
    department: departmentFromPlace([location]) ?? department,
    description: htmlToText(job.snippet ?? ''),
    salaryText: job.salary?.trim() || null,
    salaryMonthlyCents: parseSalaryRange(job.salary)?.minCents ?? null,
    salaryMaxCents: parseSalaryRange(job.salary)?.maxCents ?? null,
    publishedAt: job.updated ?? '',
  });
}

export async function searchJooble(opts: { q?: string; department?: string; page: number; perPage: number }): Promise<{ offers: Offer[]; total: number }> {
  const body = {
    keywords: ['alternance', opts.q].filter(Boolean).join(' '),
    location: opts.department ? (DEPARTMENT_NAMES[opts.department] ?? '') : '',
    page: String(opts.page),
    ResultOnPage: String(opts.perPage),
  };
  const res = await fetchText(`${api()}/${process.env.JOOBLE_API_KEY}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    timeoutMs: 8000,
  });
  if (res.status !== 200) throw new Error(`Jooble : HTTP ${res.status}`);
  const data = JSON.parse(res.text) as { totalCount?: number; jobs?: JoobleJob[] };
  const offers = (data.jobs ?? []).map((j) => joobleToOffer(j, opts.department ?? null)).filter((o): o is Offer => o !== null);
  return { offers, total: data.totalCount ?? offers.length };
}
