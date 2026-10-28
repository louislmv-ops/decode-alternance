// Lecture et écriture des offres dans Postgres. Sans DATABASE_URL, le site affiche les offres d'exemple.

import postgres from 'postgres';
import type { DecodedOffer } from '@/lib/decode/schema';
import type { AtsBoard, AtsProvider } from './connectors/ats';
import { type RemotePolicy, remoteOf, skillsOf } from './details';
import { normalizeText } from './normalize';
import { expandQuery } from './query';
import type { DiplomaLevel } from '@/lib/rules/employer';
import { SMIC } from '@/lib/rules/reference';
import { PAGE_SIZE } from './filter';
import { CAC40_SQL, LOW_ROLE_SQL, STRONG_ROLE_SQL } from './rank';
import type { CompanySizeTag, Offer, OfferContract, OfferFilters, OfferPage, OfferSource } from './types';

let sql: postgres.Sql | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function db(): postgres.Sql {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquant');
  // Les « déjà existant, on passe » du schéma ne disent rien d'utile.
  sql ??= postgres(process.env.DATABASE_URL, { max: 5, idle_timeout: 20, prepare: false, onnotice: () => {} });
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
  salary_max_cents?: number | null;
  start_date: Date | null;
  published_at: Date;
  description: string;
  direct: boolean;
  fingerprint: string;
  school_flags: string[];
  rome_code?: string | null;
  easy_apply?: boolean;
  remote?: RemotePolicy | null;
  skills?: string[] | null;
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
    salaryMaxCents: row.salary_max_cents ?? null,
    startDate: row.start_date ? row.start_date.toISOString().slice(0, 10) : null,
    publishedAt: row.published_at.toISOString(),
    description: row.description,
    direct: row.direct,
    fingerprint: row.fingerprint,
    schoolFlags: row.school_flags,
    alsoOn: row.also_on ?? [],
    romeCode: row.rome_code ?? null,
    easyApply: row.easy_apply ?? false,
    // Une base pas encore migrée n'a pas ces colonnes : le texte sera relu au besoin.
    ...(row.skills !== undefined ? { remote: row.remote ?? null, skills: row.skills ?? [] } : {}),
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
    salary_max_cents: o.salaryMaxCents ?? null,
    start_date: o.startDate,
    published_at: o.publishedAt,
    description: o.description,
    direct: o.direct,
    fingerprint: o.fingerprint,
    school_flags: o.schoolFlags,
    rome_code: o.romeCode ?? null,
    easy_apply: o.easyApply ?? false,
    // Toujours relus dans le texte : l'annonce a pu changer depuis la dernière collecte.
    remote: remoteOf(`${o.title}\n${o.description}`),
    skills: skillsOf(`${o.title}\n${o.description}`),
  }));
  const s = db();
  await s`
    insert into offers ${s(rows)}
    on conflict (id) do update set
      source_url = excluded.source_url, title = excluded.title, company = excluded.company,
      company_size = excluded.company_size, city = excluded.city, postal_code = excluded.postal_code,
      department = excluded.department, contract = excluded.contract, diploma_level = excluded.diploma_level,
      salary_text = excluded.salary_text, salary_monthly_cents = excluded.salary_monthly_cents, salary_max_cents = excluded.salary_max_cents,
      description = excluded.description, fingerprint = excluded.fingerprint,
      school_flags = excluded.school_flags, rome_code = excluded.rome_code, easy_apply = excluded.easy_apply,
      remote = excluded.remote, skills = excluded.skills, seen_at = now()`;
}

/** Retire les offres d'une source qu'aucune collecte n'a revues depuis `cutoff`. */
export async function removeStale(source: OfferSource, cutoff: Date): Promise<number> {
  const s = db();
  const result = await s`delete from offers where source = ${source} and seen_at < ${cutoff}`;
  return result.count;
}

/** La note de attractiveness() (lib/offers/rank.ts) en SQL, pour trier toute la base. */
const TOP_ORDER = (s: ReturnType<typeof db>) => s`(
    coalesce(least(case when title ~* ${LOW_ROLE_SQL} then 1 else 4 end, greatest(0, (salary_monthly_cents::float / ${SMIC.monthlyCents} - 0.4) * 6.7)), 0)
    + case company_size when 'grande' then 3 when 'eti' then 1.5 when 'pme' then 0.3 else 0 end
    + case when coalesce(company, '') ~* ${CAC40_SQL} then (case when company_size = 'grande' then 1.5 else 4.5 end) else 0 end
    + case diploma_level when 7 then 2.5 when 6 then 1.5 when 5 then 0.3 else 0 end
    + case when title ~* ${STRONG_ROLE_SQL} then 1.5 else 0 end
    - case when title ~* ${LOW_ROLE_SQL} then 3 else 0 end
    + case when direct then 0.5 else 0 end
    - least(3, extract(epoch from now() - published_at) / 864000)
  ) desc, published_at desc`;

/** Codes Postgres d'une base pas encore migrée : fonction ou colonne inconnue. */
const NOT_MIGRATED = new Set(['42883', '42703']);
let migrating: Promise<void> | null = null;

/**
 * La collecte de nuit applique db/schema.sql ; si le site est déployé avant elle, la première recherche
 * qui tombe sur une base pas encore à jour l'applique une fois, puis recommence.
 */
export async function searchOffers(filters: OfferFilters): Promise<OfferPage> {
  try {
    return await runSearch(filters);
  } catch (error) {
    if (!NOT_MIGRATED.has((error as { code?: string }).code ?? '')) throw error;
    migrating ??= ensureOfferSchema().finally(() => {
      migrating = null;
    });
    await migrating;
    return runSearch(filters);
  }
}

async function runSearch(filters: OfferFilters): Promise<OfferPage> {
  const s = db();
  // Les offres d'écoles déguisées ne sont jamais listées.
  const conditions = [s`cardinality(school_flags) = 0`];
  if (filters.departments?.length) conditions.push(s`department = any(${filters.departments})`);
  if (filters.contract) conditions.push(s`contract = ${filters.contract}`);
  if (filters.level) conditions.push(s`(diploma_level is null or diploma_level <= ${filters.level})`);
  if (filters.sizes?.length) conditions.push(s`company_size = any(${filters.sizes})`);
  if (filters.sectors?.length) {
    // « M18 » : l'informatique ; une lettre seule : tout le domaine ROME, informatique comprise sauf si on l'exclut.
    const sectorConds = filters.sectors.map((x) =>
      x === 'M18' ? s`rome_code like 'M18%'` : x === 'M' ? s`(rome_code like 'M%' and rome_code not like 'M18%')` : s`rome_code like ${`${x}%`}`,
    );
    conditions.push(s`(${sectorConds.reduce((acc, c) => s`${acc} or ${c}`)})`);
  }
  if (filters.withSalary) conditions.push(s`salary_monthly_cents is not null`);
  if (filters.sinceDays) conditions.push(s`published_at > now() - ${`${filters.sinceDays} days`}::interval`);
  if (filters.direct) conditions.push(s`direct`);
  if (filters.easyApply) conditions.push(s`easy_apply`);
  if (filters.minSalaryCents) conditions.push(s`salary_monthly_cents >= ${filters.minSalaryCents}`);
  if (filters.remote === 'total') conditions.push(s`remote = 'total'`);
  else if (filters.remote === 'partiel') conditions.push(s`remote in ('partiel', 'total')`);
  if (filters.skill) conditions.push(s`skills @> ${[filters.skill]}::text[]`);
  const variants = expandQuery(filters.q);
  if (variants.length > 0) {
    // La saisie ou un de ses synonymes (« dev » : « développeur »), sans tenir compte des accents.
    const query = variants.map((v) => s`plainto_tsquery('french', decode_fold(${v}))`).reduce((acc, c) => s`${acc} || ${c}`);
    conditions.push(s`to_tsvector('french', decode_fold(title || ' ' || coalesce(company, '') || ' ' || coalesce(city, ''))) @@ (${query})`);
  }
  const where = conditions.reduce((acc, c) => s`${acc} and ${c}`);
  const page = Math.max(1, filters.page ?? 1);

  const [rows, count] = await Promise.all([
    s<OfferRow[]>`select * from offers_unique where ${where} order by ${filters.sort === 'recent' ? s`published_at desc` : filters.sort === 'salary' ? s`salary_monthly_cents desc nulls last, published_at desc` : TOP_ORDER(s)} limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`,
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

/** Les offres récentes à annoncer dans le sitemap : identifiant et date, sans les offres d'écoles. */
export async function sitemapOffers(limit = 5000): Promise<{ id: string; publishedAt: Date }[]> {
  const s = db();
  const rows = await s<{ id: string; published_at: Date }[]>`
    select id, published_at from offers_unique
    where cardinality(school_flags) = 0 and source in ('france-travail', 'la-bonne-alternance', 'site-carriere')
      and published_at > now() - interval '60 days'
    order by published_at desc limit ${limit}`;
  return rows.map((r) => ({ id: r.id, publishedAt: r.published_at }));
}

/** Combien d'offres la collecte a mises en base ; échoue si la table n'existe pas encore. */
export async function countStoredOffers(source?: OfferSource): Promise<number> {
  const s = db();
  const [row] = await s<{ n: number }[]>`select count(*)::int as n from offers ${source ? s`where source = ${source}` : s``}`;
  return row?.n ?? 0;
}

/** Crée ou met à jour les tables des offres (db/schema.sql), sans rien effacer : la collecte le fait d'elle-même. */
export async function ensureOfferSchema(): Promise<void> {
  const { readFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  await db().unsafe(await readFile(join(process.cwd(), 'db', 'schema.sql'), 'utf8'));
}

export async function closeDb(): Promise<void> {
  await sql?.end();
  sql = null;
}

/** Les tableaux d'offres connus, sauf ceux qui échouent depuis cinq collectes. */
export async function listAtsBoards(): Promise<AtsBoard[]> {
  const s = db();
  const rows = await s<{ provider: AtsProvider; slug: string; company: string; company_size: CompanySizeTag | null }[]>`
    select provider, slug, company, company_size from ats_boards where failures < 5 order by provider, slug`;
  return rows.map((r) => ({ provider: r.provider, slug: r.slug, company: r.company, size: r.company_size }));
}

export async function saveAtsBoard(board: AtsBoard): Promise<void> {
  const s = db();
  await s`
    insert into ats_boards (provider, slug, company, company_size) values (${board.provider}, ${board.slug}, ${board.company}, ${board.size ?? null})
    on conflict (provider, slug) do update set company = excluded.company, failures = 0`;
}

export async function markAtsBoard(board: AtsBoard, result: { offers: number } | { error: true; disable?: boolean }): Promise<void> {
  const s = db();
  // Un tableau qui n'est pas celui de l'employeur est écarté tout de suite (cinq échecs d'un coup).
  if ('error' in result && result.disable) await s`update ats_boards set failures = 5, checked_at = now() where provider = ${board.provider} and slug = ${board.slug}`;
  else if ('error' in result) await s`update ats_boards set failures = failures + 1, checked_at = now() where provider = ${board.provider} and slug = ${board.slug}`;
  else await s`update ats_boards set failures = 0, offers = ${result.offers}, checked_at = now() where provider = ${board.provider} and slug = ${board.slug}`;
}

/**
 * Les employeurs à chercher cette nuit : ceux de la liste de départ puis ceux qui publient le plus d'offres en base,
 * sauf ceux déjà cherchés depuis moins de 30 jours.
 */
export async function companiesToProbe(seeds: string[], limit: number): Promise<{ company: string; size: CompanySizeTag | null }[]> {
  const s = db();
  const probed = new Set((await s<{ company_key: string }[]>`select company_key from ats_probes where probed_at > now() - interval '30 days'`).map((r) => r.company_key));
  const frequent = await s<{ company: string; size: CompanySizeTag | null }[]>`
    select company, (array_agg(company_size) filter (where company_size is not null))[1] as size from offers
    where company is not null and source <> 'site-carriere' and cardinality(school_flags) = 0
    group by company order by count(*) desc limit 2000`;
  const out: { company: string; size: CompanySizeTag | null }[] = [];
  const seen = new Set<string>();
  for (const c of [...seeds.map((company) => ({ company, size: 'grande' as CompanySizeTag })), ...frequent]) {
    const key = normalizeText(c.company);
    if (!key || probed.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length >= limit) break;
  }
  return out;
}

export async function markProbed(company: string, found: boolean): Promise<void> {
  const s = db();
  await s`
    insert into ats_probes (company_key, company, found) values (${normalizeText(company)}, ${company}, ${found})
    on conflict (company_key) do update set probed_at = now(), found = excluded.found`;
}
