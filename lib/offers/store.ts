// Lecture et écriture des offres dans Postgres. Sans DATABASE_URL, le site affiche les offres d'exemple.

import postgres from 'postgres';
import type { DecodedOffer } from '@/lib/decode/schema';
import type { DiplomaLevel } from '@/lib/rules/employer';
import { PAGE_SIZE } from './filter';
import type { CompanySizeTag, Offer, OfferContract, OfferFilters, OfferPage, OfferSource } from './types';

let sql: postgres.Sql | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function db(): postgres.Sql {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquant');
  sql ??= postgres(process.env.DATABASE_URL, { max: 5, idle_timeout: 20, prepare: false });
  return sql;
}

interface OfferRow {
  id: string;
  source: OfferSource;
  source_id: string;
  source_url: string;
  title: string;
  company: string | null;
  company_size: CompanySizeTag | null;
  city: string | null;
  postal_code: string | null;
  department: string | null;
  contract: OfferContract;
  diploma_level: number | null;
  salary_text: string | null;
  salary_monthly_cents: number | null;
  start_date: Date | null;
  published_at: Date;
  description: string;
  direct: boolean;
  fingerprint: string;
  school_flags: string[];
  also_on?: OfferSource[];
}

function toOffer(row: OfferRow): Offer {
  return {
    id: row.id,
    source: row.source,
    sourceId: row.source_id,
    sourceUrl: row.source_url,
    title: row.title,
    company: row.company,
    companySize: row.company_size,
    city: row.city,
    postalCode: row.postal_code,
    department: row.department,
    contract: row.contract,
    diplomaLevel: row.diploma_level as DiplomaLevel | null,
    salaryText: row.salary_text,
    salaryMonthlyCents: row.salary_monthly_cents,
    startDate: row.start_date ? row.start_date.toISOString().slice(0, 10) : null,
    publishedAt: row.published_at.toISOString(),
    description: row.description,
    direct: row.direct,
    fingerprint: row.fingerprint,
    schoolFlags: row.school_flags,
    alsoOn: row.also_on ?? [],
  };
}

export async function upsertOffers(offers: Offer[]): Promise<void> {
  if (offers.length === 0) return;
  const rows = offers.map((o) => ({
    id: o.id,
    source: o.source,
    source_id: o.sourceId,
    source_url: o.sourceUrl,
    title: o.title,
    company: o.company,
    company_size: o.companySize,
    city: o.city,
    postal_code: o.postalCode,
    department: o.department,
    contract: o.contract,
    diploma_level: o.diplomaLevel,
    salary_text: o.salaryText,
    salary_monthly_cents: o.salaryMonthlyCents,
    start_date: o.startDate,
    published_at: o.publishedAt,
    description: o.description,
    direct: o.direct,
    fingerprint: o.fingerprint,
    school_flags: o.schoolFlags,
  }));
  const s = db();
  await s`
    insert into offers ${s(rows)}
    on conflict (id) do update set
      source_url = excluded.source_url, title = excluded.title, company = excluded.company,
      company_size = excluded.company_size, city = excluded.city, postal_code = excluded.postal_code,
      department = excluded.department, contract = excluded.contract, diploma_level = excluded.diploma_level,
      salary_text = excluded.salary_text, salary_monthly_cents = excluded.salary_monthly_cents,
      description = excluded.description, fingerprint = excluded.fingerprint,
      school_flags = excluded.school_flags, seen_at = now()`;
}

/** Retire les offres d'une source qu'aucune collecte n'a revues depuis `cutoff`. */
export async function removeStale(source: OfferSource, cutoff: Date): Promise<number> {
  const s = db();
  const result = await s`delete from offers where source = ${source} and seen_at < ${cutoff}`;
  return result.count;
}

export async function searchOffers(filters: OfferFilters): Promise<OfferPage> {
  const s = db();
  // Les offres d'écoles déguisées ne sont jamais listées.
  const conditions = [s`cardinality(school_flags) = 0`];
  if (filters.department) conditions.push(s`department = ${filters.department}`);
  if (filters.contract) conditions.push(s`contract = ${filters.contract}`);
  if (filters.level) conditions.push(s`(diploma_level is null or diploma_level <= ${filters.level})`);
  if (filters.bigCompany) conditions.push(s`company_size = 'grande'`);
  if (filters.direct) conditions.push(s`direct`);
  if (filters.q) {
    conditions.push(
      s`to_tsvector('french', title || ' ' || coalesce(company, '') || ' ' || coalesce(city, '')) @@ plainto_tsquery('french', ${filters.q})`,
    );
  }
  const where = conditions.reduce((acc, c) => s`${acc} and ${c}`);
  const page = Math.max(1, filters.page ?? 1);

  const [rows, count] = await Promise.all([
    s<OfferRow[]>`select * from offers_unique where ${where} order by published_at desc limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`,
    s<{ n: number }[]>`select count(*)::int as n from offers_unique where ${where}`,
  ]);
  return { offers: rows.map(toOffer), total: count[0]?.n ?? 0, page, pageSize: PAGE_SIZE, mode: 'base' };
}

export async function getOffer(id: string): Promise<Offer | null> {
  const s = db();
  const rows = await s<OfferRow[]>`
    select o.*, array(select distinct other.source from offers other where other.fingerprint = o.fingerprint and other.id <> o.id) as also_on
    from offers o where o.id = ${id}`;
  return rows[0] ? toOffer(rows[0]) : null;
}

export async function getCachedDecode(offerId: string): Promise<DecodedOffer | null> {
  const s = db();
  const rows = await s<{ decoded: DecodedOffer }[]>`select decoded from offer_decodes where offer_id = ${offerId}`;
  return rows[0]?.decoded ?? null;
}

export async function saveDecode(offerId: string, decoded: DecodedOffer, model: string): Promise<void> {
  const s = db();
  await s`
    insert into offer_decodes (offer_id, decoded, model) values (${offerId}, ${s.json(decoded as postgres.JSONValue)}, ${model})
    on conflict (offer_id) do update set decoded = excluded.decoded, model = excluded.model, created_at = now()`;
}

/** Combien d'offres la collecte a mises en base ; échoue si la table n'existe pas encore. */
export async function countStoredOffers(): Promise<number> {
  const [row] = await db()<{ n: number }[]>`select count(*)::int as n from offers`;
  return row?.n ?? 0;
}

export async function closeDb(): Promise<void> {
  await sql?.end();
  sql = null;
}
