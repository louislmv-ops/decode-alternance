// Les pages entreprises, façon Glassdoor mais pour l'alternance : salaires réels déclarés par les
// alternants (comparés au minimum légal) et avis modérés. Tout reste anonyme : on ne montre jamais
// qui a écrit quoi, et les chiffres n'apparaissent qu'à partir de MIN_TO_SHOW déclarations.

import { z } from 'zod/v4';
import { ensureCommunitySchema } from '@/lib/community/store';
import { db } from '@/lib/offers/store';
import { minimumSalary } from '@/lib/rules/salary';
import { isAccountsConfigured } from '@/lib/account/store';
import { coreName } from '@/lib/offers/logo-resolve';
import { type CommunityPay, summarizePercents } from '@/lib/offers/pay-estimate';
import type { RatingOf } from '@/lib/offers/rank';
import type { Offer } from '@/lib/offers/types';
import type { CompanyRef } from './search';
import { HIRED, isTopForApprentices, MIN_TO_SHOW, type PublicReview, type ReviewStats, type SalaryStats } from './shared';
import { ensureOnce } from '@/lib/offers/schema-once';

export { CRITERIA, HIRED, HIRED_LABELS, MIN_TO_SHOW } from './shared';
export type { PublicReview, ReviewStats, SalaryStats } from './shared';

const thisYear = () => new Date().getFullYear();

export const SalaryInput = z.object({
  jobTitle: z.string().trim().min(2, 'Intitulé du poste trop court').max(80),
  contract: z.enum(['apprentissage', 'professionnalisation']),
  age: z.number().int().min(15).max(60),
  contractYear: z.number().int().min(1).max(3),
  hasBacPro: z.boolean().default(false),
  grossEuros: z.number().int().min(200, 'Montant brut mensuel, en euros').max(6000, 'Montant brut mensuel, en euros'),
  startYear: z
    .number()
    .int()
    .refine((y) => y >= thisYear() - 3 && y <= thisYear() + 1, 'Contrat des 3 dernières années'),
  department: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^(\d{2,3}|2[AB])$/, 'Département (ex. 69)'),
});
export type SalaryInput = z.infer<typeof SalaryInput>;

const rating = z.number().int().min(1).max(5);

export const ReviewInput = z.object({
  jobTitle: z.string().trim().min(2).max(80),
  startYear: z
    .number()
    .int()
    .refine((y) => y >= thisYear() - 5 && y <= thisYear(), 'Année de début : les 5 dernières années'),
  overall: rating,
  tutoring: rating,
  missions: rating,
  atmosphere: rating,
  schoolRhythm: rating,
  hired: z.enum(HIRED),
  title: z.string().trim().min(4, 'Titre trop court').max(80),
  pros: z.string().trim().min(30, 'Points forts : 30 caractères au moins').max(1200),
  cons: z.string().trim().min(30, 'Points faibles : 30 caractères au moins').max(1200),
});
export type ReviewInput = z.infer<typeof ReviewInput>;

export interface CompanyPage {
  company: CompanyRef;
  salaries: SalaryStats;
  reviews: ReviewStats;
  list: PublicReview[];
}

let ready: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  ready ??= ensureOnce('companies', async () => {
    await ensureCommunitySchema();
    const s = db();
    await s`create table if not exists companies (
      siren text primary key,
      name text not null,
      city text not null default '',
      postal_code text not null default '',
      size_code text,
      created_at timestamptz not null default now()
    )`;
    await s`create table if not exists salary_reports (
      id uuid primary key default gen_random_uuid(),
      account_id uuid not null references accounts(id) on delete cascade,
      siren text not null references companies(siren),
      job_title text not null,
      contract text not null,
      contract_year int not null,
      gross_cents int not null,
      minimum_cents int not null,
      start_year int not null,
      department text not null,
      hidden boolean not null default false,
      created_at timestamptz not null default now(),
      unique (account_id, siren, contract_year)
    )`;
    await s`create table if not exists company_reviews (
      id uuid primary key default gen_random_uuid(),
      account_id uuid not null references accounts(id) on delete cascade,
      siren text not null references companies(siren),
      job_title text not null,
      start_year int not null,
      overall int not null,
      tutoring int not null,
      missions int not null,
      atmosphere int not null,
      school_rhythm int not null,
      hired text not null,
      title text not null,
      pros text not null,
      cons text not null,
      status text not null default 'pending',
      reports int not null default 0,
      created_at timestamptz not null default now(),
      unique (account_id, siren)
    )`;
    await s`create table if not exists work_verifications (
      account_id uuid not null references accounts(id) on delete cascade,
      siren text not null references companies(siren),
      domain text not null,
      verified_at timestamptz not null default now(),
      primary key (account_id, siren)
    )`;
  }).catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

export async function saveCompany(c: CompanyRef): Promise<void> {
  await ensureSchema();
  await db()`insert into companies (siren, name, city, postal_code, size_code)
    values (${c.siren}, ${c.name}, ${c.city}, ${c.postalCode}, ${c.sizeCode})
    on conflict (siren) do update set name = excluded.name, city = excluded.city, postal_code = excluded.postal_code, size_code = excluded.size_code`;
}

export async function storedCompany(siren: string): Promise<CompanyRef | null> {
  await ensureSchema();
  const [row] = await db()<
    {
      siren: string;
      name: string;
      city: string;
      postal_code: string;
      size_code: string | null;
    }[]
  >`
    select * from companies where siren = ${siren}`;
  return row
    ? {
        siren: row.siren,
        name: row.name,
        city: row.city,
        postalCode: row.postal_code,
        sizeCode: row.size_code,
      }
    : null;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid]! : Math.round((v[mid - 1]! + v[mid]!) / 2);
}

export function salaryStats(rows: { job_title: string; gross_cents: number; minimum_cents: number }[]): SalaryStats {
  const enough = rows.length >= MIN_TO_SHOW;
  const byJob = new Map<string, number[]>();
  for (const r of rows) {
    const key = r.job_title.trim().toLowerCase();
    byJob.set(key, [...(byJob.get(key) ?? []), r.gross_cents]);
  }
  const ratio = median(rows.map((r) => Math.round((r.gross_cents / r.minimum_cents - 1) * 1000)));
  return {
    count: rows.length,
    medianCents: enough ? median(rows.map((r) => r.gross_cents)) : null,
    aboveMinimumPercent: enough && ratio !== null ? Math.round(ratio / 10) : null,
    belowMinimum: enough ? rows.filter((r) => r.gross_cents < r.minimum_cents).length : 0,
    jobs: enough
      ? [...byJob.entries()]
          .filter(([, v]) => v.length >= MIN_TO_SHOW)
          .map(([job, v]) => ({
            jobTitle: job.charAt(0).toUpperCase() + job.slice(1),
            count: v.length,
            medianCents: median(v),
          }))
          .sort((a, b) => b.count - a.count)
      : [],
  };
}

interface ReviewRow {
  id: string;
  job_title: string;
  start_year: number;
  overall: number;
  tutoring: number;
  missions: number;
  atmosphere: number;
  school_rhythm: number;
  hired: (typeof HIRED)[number];
  title: string;
  pros: string;
  cons: string;
  verified: boolean;
}

const avg = (values: number[]) => (values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null);

export function reviewStats(rows: Pick<ReviewRow, 'overall' | 'tutoring' | 'missions' | 'atmosphere' | 'school_rhythm' | 'hired'>[]): ReviewStats {
  const enough = rows.length >= MIN_TO_SHOW;
  const pick = (k: 'overall' | 'tutoring' | 'missions' | 'atmosphere' | 'school_rhythm') => (enough ? avg(rows.map((r) => r[k])) : null);
  const finished = rows.filter((r) => r.hired !== 'pas_encore');
  return {
    count: rows.length,
    overall: pick('overall'),
    criteria: {
      tutoring: pick('tutoring'),
      missions: pick('missions'),
      atmosphere: pick('atmosphere'),
      schoolRhythm: pick('school_rhythm'),
    },
    hiredPercent: finished.length >= MIN_TO_SHOW ? Math.round((finished.filter((r) => r.hired === 'oui').length / finished.length) * 100) : null,
  };
}

export async function companyPage(siren: string): Promise<CompanyPage | null> {
  const company = await storedCompany(siren);
  if (!company) return null;
  const s = db();
  const salaries = await s<{ job_title: string; gross_cents: number; minimum_cents: number }[]>`
    select job_title, gross_cents, minimum_cents from salary_reports where siren = ${siren} and not hidden`;
  const reviews = await s<ReviewRow[]>`select r.id, r.job_title, r.start_year, r.overall, r.tutoring, r.missions, r.atmosphere, r.school_rhythm,
      r.hired, r.title, r.pros, r.cons, exists(select 1 from work_verifications w where w.account_id = r.account_id and w.siren = r.siren) as verified
    from company_reviews r where r.siren = ${siren} and r.status = 'published' order by r.created_at desc limit 50`;
  return {
    company,
    salaries: salaryStats(salaries),
    reviews: reviewStats(reviews),
    list: reviews.map((r) => ({
      id: r.id,
      jobTitle: r.job_title,
      startYear: r.start_year,
      overall: r.overall,
      hired: r.hired,
      title: r.title,
      pros: r.pros,
      cons: r.cons,
      verified: r.verified,
    })),
  };
}

export interface CompanySummary extends CompanyRef {
  reviews: number;
  salaries: number;
  overall: number | null;
  top: boolean;
}

/** Les entreprises les plus renseignées. */
export async function topCompanies(limit = 30): Promise<CompanySummary[]> {
  await ensureSchema();
  const rows = await db()<
    {
      siren: string;
      name: string;
      city: string;
      postal_code: string;
      size_code: string | null;
      reviews: number;
      salaries: number;
      overall: number | null;
      tutoring: number | null;
    }[]
  >`
    select c.*, coalesce(r.n, 0)::int as reviews, coalesce(p.n, 0)::int as salaries,
      case when coalesce(r.n, 0) >= ${MIN_TO_SHOW} then round(r.overall::numeric, 1)::float else null end as overall,
      case when coalesce(r.n, 0) >= ${MIN_TO_SHOW} then round(r.tutoring::numeric, 1)::float else null end as tutoring
    from companies c
    left join (select siren, count(*) as n, avg(overall) as overall, avg(tutoring) as tutoring from company_reviews where status = 'published' group by siren) r on r.siren = c.siren
    left join (select siren, count(*) as n from salary_reports where not hidden group by siren) p on p.siren = c.siren
    where coalesce(r.n, 0) + coalesce(p.n, 0) > 0
    order by coalesce(r.n, 0) + coalesce(p.n, 0) desc, c.name limit ${limit}`;
  return rows.map((r) => ({
    siren: r.siren,
    name: r.name,
    city: r.city,
    postalCode: r.postal_code,
    sizeCode: r.size_code,
    reviews: r.reviews,
    salaries: r.salaries,
    overall: r.overall,
    top: isTopForApprentices(r.reviews, r.overall, r.tutoring),
  }));
}

export class Duplicate extends Error {}

export async function addSalary(accountId: string, siren: string, input: SalaryInput): Promise<void> {
  await ensureSchema();
  const minimum = minimumSalary({
    contract: input.contract,
    age: input.age,
    year: input.contractYear,
    hasBacPro: input.hasBacPro,
  });
  const rows = await db()`insert into salary_reports (account_id, siren, job_title, contract, contract_year, gross_cents, minimum_cents, start_year, department)
    values (${accountId}, ${siren}, ${input.jobTitle}, ${input.contract}, ${input.contractYear}, ${input.grossEuros * 100}, ${minimum.cents},
      ${input.startYear}, ${input.department})
    on conflict (account_id, siren, contract_year) do nothing returning id`;
  if (rows.length === 0) throw new Duplicate('Tu as déjà déclaré ton salaire pour cette année de contrat.');
}

/** Un avis attend la modération avant d'être publié. */
export async function addReview(accountId: string, siren: string, input: ReviewInput): Promise<void> {
  await ensureSchema();
  const rows = await db()`insert into company_reviews (account_id, siren, job_title, start_year, overall, tutoring, missions, atmosphere,
      school_rhythm, hired, title, pros, cons)
    values (${accountId}, ${siren}, ${input.jobTitle}, ${input.startYear}, ${input.overall}, ${input.tutoring}, ${input.missions},
      ${input.atmosphere}, ${input.schoolRhythm}, ${input.hired}, ${input.title}, ${input.pros}, ${input.cons})
    on conflict (account_id, siren) do nothing returning id`;
  if (rows.length === 0) throw new Duplicate('Tu as déjà donné ton avis sur cette entreprise.');
}

/** Trois signalements renvoient un avis en modération. */
export async function reportReview(id: string): Promise<void> {
  await ensureSchema();
  await db()`update company_reviews set reports = reports + 1,
      status = case when reports + 1 >= 3 and status = 'published' then 'pending' else status end
    where id = ${id}`;
}

export interface PendingReview extends PublicReview {
  companyName: string;
  siren: string;
  reports: number;
  verifiedDomain: string | null;
}

export async function pendingReviews(): Promise<PendingReview[]> {
  await ensureSchema();
  const rows = await db()<
    (ReviewRow & {
      company_name: string;
      siren: string;
      reports: number;
      domain: string | null;
    })[]
  >`
    select r.*, c.name as company_name, w.domain, w.domain is not null as verified
    from company_reviews r join companies c on c.siren = r.siren
    left join work_verifications w on w.account_id = r.account_id and w.siren = r.siren
    where r.status = 'pending' order by r.created_at limit 100`;
  return rows.map((r) => ({
    id: r.id,
    jobTitle: r.job_title,
    startYear: r.start_year,
    overall: r.overall,
    hired: r.hired,
    title: r.title,
    pros: r.pros,
    cons: r.cons,
    verified: r.verified,
    companyName: r.company_name,
    siren: r.siren,
    reports: r.reports,
    verifiedDomain: r.domain,
  }));
}

export async function moderateReview(id: string, publish: boolean): Promise<void> {
  await ensureSchema();
  await db()`update company_reviews set status = ${publish ? 'published' : 'rejected'}, reports = 0 where id = ${id}`;
}

export async function myContributions(
  accountId: string,
  siren: string,
): Promise<{
  review: 'pending' | 'published' | 'rejected' | null;
  salaryYears: number[];
  verifiedDomain: string | null;
}> {
  await ensureSchema();
  const s = db();
  const [review] = await s<
    { status: 'pending' | 'published' | 'rejected' }[]
  >`select status from company_reviews where account_id = ${accountId} and siren = ${siren}`;
  const years = await s<{ contract_year: number }[]>`select contract_year from salary_reports where account_id = ${accountId} and siren = ${siren}`;
  const [work] = await s<{ domain: string }[]>`select domain from work_verifications where account_id = ${accountId} and siren = ${siren}`;
  return {
    review: review?.status ?? null,
    salaryYears: years.map((y) => y.contract_year),
    verifiedDomain: work?.domain ?? null,
  };
}

/** Les messageries grand public ne prouvent rien sur l'employeur. */
const FREE_MAIL =
  /(^|\.)(gmail|googlemail|yahoo|hotmail|outlook|live|msn|icloud|me|mac|aol|proton|protonmail|gmx|laposte|orange|wanadoo|free|sfr|neuf|bbox|yopmail)\.[a-z.]+$/i;

export function workDomain(email: string): string | null {
  const m = /^[^\s@]+@([a-z0-9.-]+\.[a-z]{2,})$/i.exec(email.trim());
  if (!m) return null;
  const domain = m[1]!.toLowerCase();
  return FREE_MAIL.test(domain) ? null : domain;
}

export async function markWorkVerified(accountId: string, siren: string, domain: string): Promise<void> {
  await ensureSchema();
  await db()`insert into work_verifications (account_id, siren, domain) values (${accountId}, ${siren}, ${domain})
    on conflict (account_id, siren) do update set domain = excluded.domain, verified_at = now()`;
}

/** Les entreprises où au moins MIN_TO_SHOW alternants ont déclaré leur salaire, gardées 10 minutes en mémoire. */
interface PayCompany {
  names: string[];
  pay: CommunityPay;
}
let payCache: { until: number; list: Promise<PayCompany[]> } | null = null;

function payCompanies(): Promise<PayCompany[]> {
  if (payCache && payCache.until > Date.now()) return payCache.list;
  const list = (async () => {
    await ensureSchema();
    const rows = await db()<{ siren: string; name: string; percents: number[] }[]>`
      select c.siren, c.name, array_agg((p.gross_cents::float / p.minimum_cents - 1) * 100) as percents
      from salary_reports p join companies c on c.siren = p.siren
      where not p.hidden and p.minimum_cents > 0
      group by c.siren, c.name having count(*) >= ${MIN_TO_SHOW}`;
    return rows.map((r) => ({ names: companyNames(r.name), pay: summarizePercents(r.siren, r.percents.map(Number)) }));
  })();
  list.catch(() => (payCache = null));
  payCache = { until: Date.now() + 10 * 60_000, list };
  return list;
}

/** « Decathlon France (Decathlon) » se reconnaît sous « Decathlon France » comme sous « Decathlon ». */
export function companyNames(official: string): string[] {
  const inside = official.match(/\(([^)]+)\)/)?.[1];
  return [official, official.replace(/\([^)]*\)/g, ''), inside].map((n) => (n ? coreName(n) : '')).filter((n) => n.length >= 2);
}

/** Les salaires déclarés pour l'entreprise de chaque offre : par SIREN quand la source le donne, sinon par le nom exact. */
export async function communityPayFor(offers: Pick<Offer, 'id' | 'company' | 'companySiren' | 'source'>[]): Promise<Map<string, CommunityPay>> {
  const found = new Map<string, CommunityPay>();
  if (!isAccountsConfigured()) return found;
  let list: PayCompany[];
  try {
    list = await payCompanies();
  } catch {
    return found;
  }
  if (list.length === 0) return found;
  for (const offer of offers) {
    if (offer.source === 'exemple') continue;
    const name = offer.company ? coreName(offer.company) : '';
    const hit = list.find((c) => (offer.companySiren && c.pay.siren === offer.companySiren) || (name.length >= 2 && c.names.includes(name)));
    if (hit) found.set(offer.id, hit.pay);
  }
  return found;
}

/** Une entreprise déjà connue de la base sous le même nom (pages entreprise créées par les alternants). */
export async function findCompanySiren(company: string | null): Promise<string | null> {
  if (!company) return null;
  const name = coreName(company);
  if (name.length < 2) return null;
  await ensureSchema();
  const rows = await db()<{ siren: string; name: string }[]>`select siren, name from companies`;
  return rows.find((r) => companyNames(r.name).includes(name))?.siren ?? null;
}

/** Note moyenne des avis publiés, par entreprise ayant au moins MIN_TO_SHOW avis. Gardée 10 minutes. */
let ratingCache: { until: number; list: Promise<{ siren: string; names: string[]; overall: number }[]> } | null = null;

export async function companyRatingOf(): Promise<RatingOf> {
  const none: RatingOf = () => null;
  if (!isAccountsConfigured()) return none;
  if (!ratingCache || ratingCache.until < Date.now()) {
    const list = (async () => {
      await ensureSchema();
      const rows = await db()<{ siren: string; name: string; overall: number }[]>`
        select c.siren, c.name, avg(r.overall)::float as overall
        from company_reviews r join companies c on c.siren = r.siren
        where r.status = 'published'
        group by c.siren, c.name having count(*) >= ${MIN_TO_SHOW}`;
      return rows.map((r) => ({ siren: r.siren, names: companyNames(r.name), overall: Math.round(r.overall * 10) / 10 }));
    })();
    list.catch(() => (ratingCache = null));
    ratingCache = { until: Date.now() + 10 * 60_000, list };
  }
  const list = await ratingCache.list.catch(() => []);
  if (list.length === 0) return none;
  return (o) => {
    const name = o.company ? coreName(o.company) : '';
    return list.find((c) => (o.companySiren && c.siren === o.companySiren) || (name.length >= 2 && c.names.includes(name)))?.overall ?? null;
  };
}
