// Connecteur générique des sites carrière. La plupart des grands groupes décrivent chaque offre avec le
// balisage schema.org « JobPosting » (le format que lit Google pour son moteur d'emploi). On ne lit que ça :
// pas de contournement, pas de pages interdites par robots.txt, une requête à la fois avec une pause, et
// chaque offre renvoie vers la page d'origine pour postuler.

import { fetchText, isAllowed, parseRobots, sleep, type RobotsRules } from './http';
import {
  departmentFromPostalCode,
  detectContract,
  detectDiplomaLevel,
  fingerprint,
  htmlToText,
  isAlternance,
  parseSalaryRange,
  schoolBaitFlags,
} from '../normalize';
import type { CompanySizeTag, Offer } from '../types';

export interface CareerSite {
  company: string;
  /** Page d'accueil du site carrière ; robots.txt et les sitemaps sont cherchés à sa racine. */
  careersUrl: string;
  size: CompanySizeTag;
  /** Sitemaps à lire en plus de ceux déclarés dans robots.txt. */
  sitemaps?: string[];
}

interface JobPostingLd {
  '@type'?: string | string[];
  title?: string;
  name?: string;
  description?: string;
  datePosted?: string;
  validThrough?: string;
  employmentType?: string | string[];
  url?: string;
  identifier?: { value?: string | number } | string;
  hiringOrganization?: { name?: string; logo?: string | { url?: string }; sameAs?: string; url?: string } | string;
  jobLocation?: JobLocationLd | JobLocationLd[];
  baseSalary?: { value?: { value?: number; minValue?: number; maxValue?: number; unitText?: string } | number; currency?: string };
  educationRequirements?: string | { credentialCategory?: string } | { credentialCategory?: string }[];
}

interface JobLocationLd {
  address?: { addressLocality?: string; postalCode?: string; addressCountry?: string | { name?: string } } | string;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function isJobPosting(node: unknown): node is JobPostingLd {
  if (!node || typeof node !== 'object') return false;
  const type = (node as JobPostingLd)['@type'];
  return asArray(type).some((t) => String(t).toLowerCase() === 'jobposting');
}

/** Tous les objets JobPosting des blocs JSON-LD d'une page, y compris dans un `@graph`. */
export function extractJobPostings(html: string): JobPostingLd[] {
  const found: JobPostingLd[] = [];
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const visit = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    if (isJobPosting(node)) found.push(node);
    const graph = (node as { '@graph'?: unknown })['@graph'];
    if (graph) visit(graph);
  };
  for (const block of blocks) {
    try {
      visit(JSON.parse((block[1] ?? '').trim()));
    } catch {
      // Un bloc JSON-LD mal formé ne doit pas faire échouer toute la page.
    }
  }
  return found;
}

function salaryFromLd(ld: JobPostingLd): { text: string | null; cents: number | null; maxCents: number | null } {
  const raw = ld.baseSalary?.value;
  if (raw === undefined) return { text: null, cents: null, maxCents: null };
  const amount = typeof raw === 'number' ? raw : (raw.minValue ?? raw.value);
  if (typeof amount !== 'number') return { text: null, cents: null, maxCents: null };
  const unit = typeof raw === 'number' ? 'MONTH' : (raw.unitText ?? 'MONTH').toUpperCase();
  const per = unit === 'YEAR' ? 'an' : unit === 'HOUR' ? 'heure' : 'mois';
  const max = typeof raw === 'number' ? undefined : raw.maxValue;
  const text = typeof max === 'number' && max > amount ? `${amount} à ${max} € par ${per}` : `${amount} € par ${per}`;
  const range = parseSalaryRange(text);
  return { text, cents: range?.minCents ?? null, maxCents: range?.maxCents ?? null };
}

export function jobPostingToOffer(ld: JobPostingLd, pageUrl: string, site: CareerSite): Offer | null {
  const title = (ld.title ?? ld.name ?? '').trim();
  if (!title) return null;
  const description = htmlToText(ld.description ?? '');
  if (!isAlternance(title, description, asArray(ld.employmentType).join(' '))) return null;
  if (ld.validThrough && new Date(ld.validThrough).getTime() < Date.now()) return null;

  const location = asArray(ld.jobLocation)[0];
  const address = typeof location?.address === 'object' ? location.address : undefined;
  const city = address?.addressLocality?.trim() || (typeof location?.address === 'string' ? location.address : null);
  const postalCode = address?.postalCode?.trim() || null;
  const sourceUrl = ld.url && /^https?:\/\//.test(ld.url) ? ld.url : pageUrl;
  const identifier = typeof ld.identifier === 'object' ? ld.identifier?.value : ld.identifier;
  const sourceId = String(identifier ?? sourceUrl);
  const salary = salaryFromLd(ld);
  const education = asArray(ld.educationRequirements)
    .map((e) => (typeof e === 'string' ? e : (e.credentialCategory ?? '')))
    .join(' ');

  return {
    id: `site-carriere:${site.company}:${sourceId}`,
    source: 'site-carriere',
    sourceId,
    sourceUrl,
    title,
    company: site.company,
    companySize: site.size,
    city,
    postalCode,
    department: departmentFromPostalCode(postalCode),
    contract: detectContract(`${title} ${description.slice(0, 2000)}`),
    diplomaLevel: detectDiplomaLevel(`${education} ${title} ${description.slice(0, 2000)}`),
    salaryText: salary.text,
    salaryMonthlyCents: salary.cents,
    salaryMaxCents: salary.maxCents,
    startDate: null,
    publishedAt: ld.datePosted ? new Date(ld.datePosted).toISOString() : new Date().toISOString(),
    description,
    direct: true,
    fingerprint: fingerprint(site.company, title, city),
    schoolFlags: schoolBaitFlags({ company: site.company, title, description }),
    alsoOn: [],
    companySite: (typeof ld.hiringOrganization === 'object' ? ld.hiringOrganization.sameAs || ld.hiringOrganization.url : null) || site.careersUrl,
    logoUrl: typeof ld.hiringOrganization === 'object' ? (typeof ld.hiringOrganization.logo === 'string' ? ld.hiringOrganization.logo : ld.hiringOrganization.logo?.url) ?? null : null,
  };
}

/** Les adresses d'un sitemap, en suivant les index de sitemaps sur deux niveaux. */
export async function readSitemap(url: string, rules: RobotsRules, depth = 0): Promise<string[]> {
  if (depth > 2 || !isAllowed(rules, url)) return [];
  const res = await fetchText(url);
  if (res.status !== 200) return [];
  const locs = [...res.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => (m[1] ?? '').replace(/&amp;/g, '&'));
  if (/<sitemapindex/i.test(res.text)) {
    const nested: string[] = [];
    for (const loc of locs) {
      nested.push(...(await readSitemap(loc, rules, depth + 1)));
      await sleep(rules.crawlDelayMs);
    }
    return nested;
  }
  return locs;
}

const JOB_URL_HINT = /(altern|apprenti|apprentissage|work-?study|apprentice|contrat-pro)/i;

/**
 * Les offres d'alternance d'un site carrière. Sans indice dans les adresses, on lit au plus
 * `maxPages` pages d'offres pour rester raisonnable envers le site.
 */
export async function crawlCareerSite(
  site: CareerSite,
  opts: { maxPages?: number; log?: (line: string) => void } = {},
): Promise<{ offers: Offer[]; pagesRead: number; skippedByRobots: number }> {
  const log = opts.log ?? (() => {});
  const origin = new URL(site.careersUrl).origin;
  const robotsRes = await fetchText(`${origin}/robots.txt`).catch(() => null);
  const rules = parseRobots(robotsRes?.status === 200 ? robotsRes.text : '');
  const sitemapUrls = [...new Set([...rules.sitemaps, ...(site.sitemaps ?? []), `${origin}/sitemap.xml`])];

  const urls: string[] = [];
  for (const sitemap of sitemapUrls) {
    urls.push(...(await readSitemap(sitemap, rules).catch(() => [])));
  }
  const unique = [...new Set(urls)];
  const hinted = unique.filter((u) => JOB_URL_HINT.test(u));
  const candidates = (hinted.length > 0 ? hinted : unique).slice(0, opts.maxPages ?? 300);
  log(`${site.company} : ${unique.length} adresses dans les sitemaps, ${candidates.length} pages à lire`);

  const offers: Offer[] = [];
  let pagesRead = 0;
  let skippedByRobots = 0;
  for (const url of candidates) {
    if (!isAllowed(rules, url)) {
      skippedByRobots++;
      continue;
    }
    const res = await fetchText(url).catch(() => null);
    pagesRead++;
    if (res?.status === 200) {
      for (const ld of extractJobPostings(res.text)) {
        const offer = jobPostingToOffer(ld, url, site);
        if (offer) offers.push(offer);
      }
    }
    await sleep(rules.crawlDelayMs);
  }
  return { offers, pagesRead, skippedByRobots };
}
