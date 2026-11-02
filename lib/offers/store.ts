// Lecture et écriture des offres dans Postgres. Sans DATABASE_URL, le site affiche les offres d'exemple.

import postgres from 'postgres';
import type { DecodedOffer } from '@/lib/decode/schema';
import type { AtsBoard, AtsProvider } from './connectors/ats';
import { type RemotePolicy, remoteOf, skillsOf } from './details';
import { companyKey, normalizeText } from './normalize';
import { queryTerms, tsQueryText } from './query';
import { boundingBox } from '@/lib/geo';
import type { DiplomaLevel } from '@/lib/rules/employer';
import { SMIC } from '@/lib/rules/reference';
import { PAGE_SIZE } from './filter';
import { CAC40_SQL, EMPLOYER_CAP, EMPLOYER_KEY_SQL, LOW_ROLE_SQL, STRONG_ROLE_SQL } from './rank';
import type { CompanySizeTag, GeoPrecision, Offer, OfferContract, OfferFilters, OfferPage, OfferSource } from './types';

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
  logo_url?: string | null;
  company_site?: string | null;
  company_siren?: string | null;
  lat?: number | null;
  lon?: number | null;
  geo_precision?: GeoPrecision | null;
  distance_km?: number | null;
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
    logoUrl: row.logo_url ?? null,
    companySite: row.company_site ?? null,
    companySiren: row.company_siren ?? null,
    lat: row.lat ?? null,
    lon: row.lon ?? null,
    geoPrecision: row.geo_precision ?? null,
    distanceKm: row.distance_km == null ? null : Math.round(row.distance_km),
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
    logo_url: o.logoUrl ?? null,
    company_site: o.companySite ?? null,
    company_siren: o.companySiren ?? null,
    lat: o.lat ?? null,
    lon: o.lon ?? null,
    geo_precision: o.lat != null ? (o.geoPrecision ?? 'ville') : null,
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
      remote = excluded.remote, skills = excluded.skills,
      logo_url = coalesce(excluded.logo_url, offers.logo_url), company_site = coalesce(excluded.company_site, offers.company_site),
      company_siren = coalesce(excluded.company_siren, offers.company_siren),
      -- Une position trouvée plus tard (géocodage de la ville) reste tant que la source n'en donne pas une meilleure.
      lat = coalesce(excluded.lat, offers.lat), lon = coalesce(excluded.lon, offers.lon),
      geo_precision = coalesce(excluded.geo_precision, offers.geo_precision), seen_at = now()`;
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

/** La distance en kilomètres entre le lieu de l'offre et un point, en SQL (formule de haversine). */
const DISTANCE = (s: ReturnType<typeof db>, near: NonNullable<OfferFilters['near']>) =>
  s`(12742 * asin(least(1, sqrt(power(sin(radians(lat - ${near.lat}) / 2), 2) + cos(radians(${near.lat})) * cos(radians(lat)) * power(sin(radians(lon - ${near.lon}) / 2), 2)))))`;

async function runSearch(filters: OfferFilters): Promise<OfferPage> {
  const terms = queryTerms(filters.q);
  const all = tsQueryText(terms, '&');
  const page = await searchWith(filters, all, false);
  // Aucune offre n'a tous les mots : celles qui en ont le plus, dans l'ordre de pertinence.
  if (page.total === 0 && terms.length > 1) {
    const some = tsQueryText(terms, '|');
    if (some) return { ...(await searchWith(filters, some, true)), relaxed: true };
  }
  return page;
}

async function searchWith(filters: OfferFilters, tsQuery: string | null, relaxed: boolean): Promise<OfferPage> {
  const s = db();
  // Les offres d'écoles déguisées ne sont jamais listées.
  const conditions = [s`cardinality(school_flags) = 0`];
  const near = filters.near;
  if (near) {
    const box = boundingBox(near, near.km);
    // Une offre sans position reste dans le département du centre : mieux vaut un peu loin que perdue.
    conditions.push(s`(
      (lat between ${box.minLat} and ${box.maxLat} and lon between ${box.minLon} and ${box.maxLon} and ${DISTANCE(s, near)} <= ${near.km})
      or (lat is null and department = ${near.department})
    )`);
  } else if (filters.departments?.length) conditions.push(s`department = any(${filters.departments})`);
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
  if (filters.companies?.length) {
    // Un premier tri large (le nom contient celui de l'entreprise) ; la correspondance exacte se fait ensuite (lib/sponsors).
    const keys = filters.companies.map((c) => `%${companyKey(c)}%`);
    conditions.push(s`regexp_replace(decode_fold(coalesce(company, '')), '[^a-z0-9]', '', 'g') like any(${keys})`);
  }
  // Chaque mot tapé (ou un synonyme) dans l'intitulé, l'entreprise, la ville ou le texte de l'annonce.
  const query = tsQuery ? s`to_tsquery('french', ${tsQuery})` : null;
  if (query) conditions.push(s`search_doc @@ ${query}`);
  const where = conditions.reduce((acc, c) => s`${acc} and ${c}`);
  const page = Math.max(1, filters.page ?? 1);
  const sorted =
    filters.sort === 'recent'
      ? s`published_at desc`
      : filters.sort === 'salary'
        ? s`salary_monthly_cents desc nulls last, published_at desc`
        : query && relaxed
          ? s`ts_rank(search_doc, ${query}) desc, ${TOP_ORDER(s)}`
          : query
            ? // Le métier dans l'intitulé passe avant un mot croisé au détour du texte.
              s`(to_tsvector('french', decode_fold(title)) @@ ${query}) desc, ${TOP_ORDER(s)}`
            : TOP_ORDER(s);
  const distance = near ? s`, case when lat is null then null else ${DISTANCE(s, near)} end as distance_km` : s``;
  const titleHit = query && !relaxed ? s`(to_tsvector('french', decode_fold(title)) @@ ${query})` : s`true`;
  const within = query && relaxed ? s`ts_rank(search_doc, ${query}) desc, ${TOP_ORDER(s)}` : TOP_ORDER(s);

  const [rows, count] = await Promise.all([
    (filters.sort ?? 'top') === 'top'
      ? // « Les plus attirantes » avec le plafond par employeur. Chaque offre reçoit son rang chez son employeur ;
        // on trie par tranche de rang (les deux meilleures de chaque employeur, puis les deux suivantes…), puis
        // par score. Une page tirée d'une seule tranche a au plus EMPLOYER_CAP.perPage offres d'un employeur ;
        // seule la page où l'on passe d'une tranche à la suivante peut en avoir davantage. Avec une recherche,
        // le métier dans l'intitulé passe toujours avant, et le plafond joue à l'intérieur de chaque groupe.
        s<OfferRow[]>`select * from (
          select *${distance}, ${titleHit} as title_hit,
            row_number() over (partition by ${titleHit}, ${EMPLOYER_KEY(s)} order by ${within}) as employer_rank
          from offers_unique where ${where}
        ) ranked
        order by title_hit desc, (employer_rank - 1) / ${EMPLOYER_CAP.perPage}, ${within}
        limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`
      : s<OfferRow[]>`select *${distance} from offers_unique where ${where} order by ${sorted} limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`,
    s<{ n: number }[]>`select count(*)::int as n from offers_unique where ${where}`,
  ]);
  return { offers: rows.map(toOffer), total: count[0]?.n ?? 0, page, pageSize: PAGE_SIZE, mode: 'base' };
}

/** L'employeur d'une offre en SQL, comme employerKey (lib/offers/rank.ts). */
const EMPLOYER_KEY = (s: ReturnType<typeof db>) => s`coalesce(
    substring(trim(regexp_replace(decode_fold(coalesce(company, '')), '[^a-z0-9]+', ' ', 'g')) from ${EMPLOYER_KEY_SQL.cac40}),
    nullif(regexp_replace(regexp_replace(trim(regexp_replace(decode_fold(coalesce(company, '')), '[^a-z0-9]+', ' ', 'g')), ${EMPLOYER_KEY_SQL.generic}, '', 'g'), ' ', '', 'g'), ''),
    id
  )`;

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

/** La clé d'une recherche : « workday » a sa propre clé, pour chercher aussi les employeurs déjà essayés ailleurs. */
const probeKey = (company: string, scope: string) => (scope ? `${scope}:${normalizeText(company)}` : normalizeText(company));

/**
 * Les employeurs à chercher cette nuit : ceux de la liste de départ puis ceux qui publient le plus d'offres en base,
 * sauf ceux déjà cherchés depuis moins de 30 jours.
 */
export async function companiesToProbe(seeds: string[], limit: number, scope = ''): Promise<{ company: string; size: CompanySizeTag | null }[]> {
  const s = db();
  const probed = new Set((await s<{ company_key: string }[]>`select company_key from ats_probes where probed_at > now() - interval '30 days'`).map((r) => r.company_key));
  const frequent = await s<{ company: string; size: CompanySizeTag | null }[]>`
    select company, (array_agg(company_size) filter (where company_size is not null))[1] as size from offers
    where company is not null and source <> 'site-carriere' and cardinality(school_flags) = 0
    group by company order by count(*) desc limit 2000`;
  const out: { company: string; size: CompanySizeTag | null }[] = [];
  const seen = new Set<string>();
  for (const c of [...seeds.map((company) => ({ company, size: 'grande' as CompanySizeTag })), ...frequent]) {
    const key = probeKey(c.company, scope);
    if (!normalizeText(c.company) || probed.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length >= limit) break;
  }
  return out;
}

export async function markProbed(company: string, found: boolean, scope = ''): Promise<void> {
  const s = db();
  await s`
    insert into ats_probes (company_key, company, found) values (${probeKey(company, scope)}, ${company}, ${found})
    on conflict (company_key) do update set probed_at = now(), found = excluded.found`;
}

/**
 * Place sur la carte les offres dont la source ne donne que la ville : chaque lieu est cherché une fois (geo_places),
 * puis toutes ses offres reçoivent le centre de la commune. Au plus `limit` lieux nouveaux par appel.
 */
export async function geocodeStoredOffers(
  geocode: (p: { postalCode: string | null; city: string | null; department: string | null }) => Promise<{ lat: number; lon: number } | null>,
  keyOf: (p: { postalCode: string | null; city: string | null; department: string | null }) => string,
  limit: number,
): Promise<{ places: number; found: number; offers: number }> {
  const s = db();
  const places = await s<{ postal_code: string | null; city: string | null; department: string | null }[]>`
    select distinct postal_code, city, department from offers
    where lat is null and (postal_code is not null or city is not null)
    limit ${limit * 3}`;
  const known = new Map(
    (await s<{ key: string; lat: number | null; lon: number | null }[]>`select key, lat, lon from geo_places where key = any(${places.map((p) => keyOf({ postalCode: p.postal_code, city: p.city, department: p.department }))})`).map((r) => [r.key, r]),
  );
  let looked = 0;
  let found = 0;
  let offers = 0;
  for (const p of places) {
    const place = { postalCode: p.postal_code, city: p.city, department: p.department };
    const key = keyOf(place);
    let hit = known.get(key);
    if (!hit) {
      // Un lieu déjà cherché sans succès n'est pas recherché à nouveau.
      if (looked >= limit) continue;
      looked += 1;
      const point = await geocode(place).catch(() => undefined);
      if (point === undefined) continue;
      hit = { key, lat: point?.lat ?? null, lon: point?.lon ?? null };
      await s`insert into geo_places (key, lat, lon) values (${key}, ${hit.lat}, ${hit.lon}) on conflict (key) do update set lat = excluded.lat, lon = excluded.lon, checked_at = now()`;
    }
    if (hit.lat == null || hit.lon == null) continue;
    found += 1;
    const result = await s`
      update offers set lat = ${hit.lat}, lon = ${hit.lon}, geo_precision = 'ville'
      where lat is null and postal_code is not distinct from ${p.postal_code} and city is not distinct from ${p.city}
        and department is not distinct from ${p.department}`;
    offers += result.count;
  }
  return { places: looked, found, offers };
}

/**
 * Le salaire que chaque entreprise écrit dans ses annonces : la médiane de ses offres chiffrées, pour les
 * entreprises qui en ont au moins `minOffers`. Sert aux offres de la même entreprise qui ne chiffrent rien.
 */
export async function announcedPayByCompany(minOffers: number): Promise<Map<string, { count: number; medianCents: number }>> {
  const s = db();
  const rows = await s<{ company: string; cents: number }[]>`
    select company, salary_monthly_cents as cents from offers_unique
    where company is not null and salary_monthly_cents is not null and cardinality(school_flags) = 0`;
  const byCompany = new Map<string, number[]>();
  for (const r of rows) {
    const key = companyKey(r.company);
    if (key.length < 2) continue;
    byCompany.set(key, [...(byCompany.get(key) ?? []), r.cents]);
  }
  const out = new Map<string, { count: number; medianCents: number }>();
  for (const [key, list] of byCompany) {
    if (list.length < minOffers) continue;
    const v = [...list].sort((a, b) => a - b);
    const mid = Math.floor(v.length / 2);
    out.set(key, { count: v.length, medianCents: v.length % 2 ? v[mid]! : Math.round((v[mid - 1]! + v[mid]!) / 2) });
  }
  return out;
}
