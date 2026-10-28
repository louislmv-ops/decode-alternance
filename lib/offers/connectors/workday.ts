// Workday : le logiciel de recrutement de la plupart des grands groupes (Thales, Sanofi, Safran…). Leur page
// carrière publique (https://<groupe>.wd3.myworkdayjobs.com/<site>) lit ses offres dans un flux JSON que la page
// elle-même appelle : c'est ce flux qu'on lit, offre par offre, avec le lien pour postuler chez l'employeur.
// robots.txt est respecté : si un groupe interdit ce chemin, son tableau n'est pas lu.
//
// Un tableau Workday s'écrit « <groupe>.<serveur>/<site> » (« thales.wd3/Careers ») : le serveur (wd1, wd3, wd103…)
// et le nom du site changent d'un groupe à l'autre, la recherche les trouve dans le robots.txt du groupe.

import { fetchText, isAllowed, parseRobots, type RobotsRules, sleep } from './http';
import { htmlToText, isAlternance } from '../normalize';
import type { AtsJob } from './ats';

/** Les serveurs Workday, les plus fréquents en Europe d'abord. */
export const WORKDAY_HOSTS = ['wd3', 'wd103', 'wd1', 'wd5', 'wd12', 'wd105', 'wd102'];

/** Des mots qui ramènent les offres d'alternance ; le tri fin se fait ensuite sur l'annonce entière. */
const SEARCHES = ['alternance', 'alternant', 'apprenti', 'apprentissage', 'apprenticeship'];
const PAGE = 20;
const MAX_PAGES = 10;
/** Au plus tant d'annonces lues en détail par tableau et par nuit, dont tant sans « alternance » dans le titre. */
const MAX_DETAILS = 300;
const OTHER_DETAILS = 30;

export interface WorkdayBoard {
  tenant: string;
  host: string;
  site: string;
}

export function parseWorkdaySlug(slug: string): WorkdayBoard | null {
  const m = slug.match(/^([a-z0-9-]+)\.(wd\d+)\/([A-Za-z0-9_-]+)$/);
  return m ? { tenant: m[1]!, host: m[2]!, site: m[3]! } : null;
}

export const workdaySlug = (b: WorkdayBoard) => `${b.tenant}.${b.host}/${b.site}`;
const origin = (b: Pick<WorkdayBoard, 'tenant' | 'host'>) => `https://${b.tenant}.${b.host}.myworkdayjobs.com`;
export const workdayApi = (b: WorkdayBoard) => `${origin(b)}/wday/cxs/${b.tenant}/${b.site}`;

/** Les sites carrière qu'un groupe déclare dans son robots.txt (une ligne Sitemap par site), sans les sites internes. */
export function sitesFromRobots(robots: RobotsRules, tenant: string, host: string): string[] {
  const prefix = `${origin({ tenant, host })}/`.toLowerCase();
  const sites = robots.sitemaps
    .filter((url) => url.toLowerCase().startsWith(prefix))
    .map((url) => url.slice(prefix.length).split('/').filter((part) => !/^[a-z]{2}-[A-Z]{2}$/.test(part))[0] ?? '')
    .filter((site) => /^[A-Za-z0-9_-]+$/.test(site) && !/internal|interne\b|employee|salarie/i.test(site));
  return [...new Set(sites)];
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === 'object' ? (v as Json) : {});
const str = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');

export interface WorkdayListing {
  title: string;
  path: string;
  place: string;
}

/** Une page de résultats : les annonces et, sur la première page seulement chez certains groupes, le total. */
export function parseWorkdayList(body: string): { total: number | null; jobs: WorkdayListing[] } {
  let data: Json;
  try {
    data = obj(JSON.parse(body));
  } catch {
    return { total: null, jobs: [] };
  }
  const jobs = (Array.isArray(data.jobPostings) ? data.jobPostings : [])
    .map((j) => ({ title: str(obj(j).title), path: str(obj(j).externalPath), place: str(obj(j).locationsText) }))
    .filter((j) => j.title && j.path.startsWith('/'));
  return { total: typeof data.total === 'number' ? data.total : null, jobs };
}

/** La fiche d'une annonce, au format commun des logiciels de recrutement, et l'employeur qui la publie. */
export function parseWorkdayJob(body: string, board: WorkdayBoard, path: string): (AtsJob & { employer: string | null }) | null {
  let data: Json;
  try {
    data = obj(JSON.parse(body));
  } catch {
    return null;
  }
  const info = obj(data.jobPostingInfo);
  const title = str(info.title);
  if (!title) return null;
  const location = str(info.location);
  const country = str(obj(info.country).descriptor);
  const additional = Array.isArray(info.additionalLocations) ? info.additionalLocations.map(str) : [];
  return {
    id: str(info.jobReqId) || str(info.id) || path,
    title,
    url: str(info.externalUrl) || `${origin(board)}/${board.site}${path}`,
    description: htmlToText(str(info.jobDescription)),
    city: location.split(/[,(-]/)[0]?.trim() || null,
    postalCode: null,
    country: /^france$/i.test(country) ? 'FR' : country || null,
    place: [location, ...additional, country].filter(Boolean).join(', '),
    employmentType: str(info.timeType),
    publishedAt: str(info.startDate) ? new Date(str(info.startDate)).toISOString() : null,
    employer: str(obj(data.hiringOrganization).name) || null,
  };
}

const robotsCache = new Map<string, RobotsRules | null>();

/** robots.txt du groupe ; null si le serveur ne répond pas ou si le groupe n'existe pas chez ce serveur. */
export async function workdayRobots(tenant: string, host: string): Promise<RobotsRules | null> {
  const key = `${tenant}.${host}`;
  if (robotsCache.has(key)) return robotsCache.get(key)!;
  let rules: RobotsRules | null = null;
  try {
    const res = await fetchText(`${origin({ tenant, host })}/robots.txt`, { timeoutMs: 8_000 });
    if (res.status === 200 && !/<html/i.test(res.text.slice(0, 200))) rules = parseRobots(res.text);
  } catch {
    rules = null;
  }
  robotsCache.set(key, rules);
  return rules;
}

const JSON_HEADERS = { Accept: 'application/json', 'Content-Type': 'application/json' };

async function listPage(board: WorkdayBoard, searchText: string, offset: number) {
  const res = await fetchText(`${workdayApi(board)}/jobs`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ appliedFacets: {}, limit: PAGE, offset, searchText }),
  });
  if (res.status !== 200) throw new Error(`workday/${workdaySlug(board)} : HTTP ${res.status}`);
  return parseWorkdayList(res.text);
}

export async function fetchWorkdayJob(board: WorkdayBoard, path: string) {
  const res = await fetchText(`${workdayApi(board)}${path}`, { headers: JSON_HEADERS });
  return res.status === 200 ? parseWorkdayJob(res.text, board, path) : null;
}

/** Les quelques premières annonces du tableau, pour vérifier à qui il appartient. */
export async function sampleWorkdayJobs(board: WorkdayBoard, count = 3) {
  const { jobs } = await listPage(board, '', 0);
  const out = [];
  for (const job of jobs.slice(0, count)) {
    const detail = await fetchWorkdayJob(board, job.path);
    if (detail) out.push(detail);
    await sleep(300);
  }
  return out;
}

/** Toutes les annonces d'alternance d'un tableau, lues en détail. Lève une erreur si le tableau ne répond pas. */
export async function fetchWorkdayJobs(board: WorkdayBoard): Promise<AtsJob[]> {
  const robots = await workdayRobots(board.tenant, board.host);
  if (robots && !isAllowed(robots, `${workdayApi(board)}/jobs`)) throw new Error(`workday/${workdaySlug(board)} : interdit par robots.txt`);
  const pause = Math.max(400, robots?.crawlDelayMs ?? 0);

  const listings = new Map<string, WorkdayListing>();
  for (const search of SEARCHES) {
    let total: number | null = null;
    for (let page = 0; page < MAX_PAGES; page++) {
      const result = await listPage(board, search, page * PAGE);
      total ??= result.total;
      for (const job of result.jobs) listings.set(job.path, job);
      await sleep(pause);
      if (result.jobs.length < PAGE || (total !== null && (page + 1) * PAGE >= total)) break;
    }
  }

  // La recherche de Workday ramène large : toutes les annonces dont le titre parle d'alternance sont lues, plus
  // quelques autres, où l'alternance n'est écrite que dans le texte. Le tri final se fait sur l'annonce entière.
  const all = [...listings.values()];
  const ordered = [...all.filter((j) => isAlternance(j.title)), ...all.filter((j) => !isAlternance(j.title)).slice(0, OTHER_DETAILS)];
  const jobs: AtsJob[] = [];
  for (const listing of ordered.slice(0, MAX_DETAILS)) {
    try {
      const job = await fetchWorkdayJob(board, listing.path);
      if (job) jobs.push(job);
    } catch {
      // Une annonce qui ne répond pas n'arrête pas le tableau.
    }
    await sleep(pause);
  }
  return jobs;
}
