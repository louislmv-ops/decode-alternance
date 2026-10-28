// Les logiciels de recrutement (ATS) qu'utilisent les entreprises publient leurs offres par une API
// publique, faite pour être affichée ailleurs que sur leur propre site : c'est elle qui alimente les
// pages carrière. Lire ces flux, c'est lire l'offre telle que l'employeur la publie, avec le lien pour
// postuler chez lui. Rien n'est aspiré d'un site d'emploi (LinkedIn, Welcome to the Jungle, Indeed…) :
// leurs bases d'annonces sont protégées.
//
// Chaque tableau d'offres est identifié par un fournisseur et un identifiant (« greenhouse » + « doctolib »).
// Les identifiants ne sont pas écrits à la main : ats-discovery.ts les trouve et les vérifie.

import { departmentFromPlace } from './aggregator';
import { fetchText, sleep } from './http';
import {
  decodeEntities,
  departmentFromPostalCode,
  detectContract,
  detectDiplomaLevel,
  fingerprint,
  htmlToText,
  isAlternance,
  normalizeText,
  salaryRangeFromDescription,
  schoolBaitFlags,
} from '../normalize';
import type { CompanySizeTag, Offer } from '../types';

export type AtsProvider = 'greenhouse' | 'lever' | 'smartrecruiters' | 'ashby' | 'recruitee' | 'personio';

export const ATS_PROVIDERS: AtsProvider[] = ['greenhouse', 'lever', 'smartrecruiters', 'ashby', 'recruitee', 'personio'];

export interface AtsBoard {
  provider: AtsProvider;
  slug: string;
  /** Le nom de l'employeur tel qu'on l'affiche. */
  company: string;
  size?: CompanySizeTag | null;
}

/** Une offre telle que tous les fournisseurs la décrivent, avant de garder seulement l'alternance en France. */
export interface AtsJob {
  id: string;
  title: string;
  url: string;
  /** Texte brut (le HTML est converti). */
  description: string;
  city: string | null;
  postalCode: string | null;
  /** Code pays ISO quand le fournisseur le donne. */
  country: string | null;
  /** Tout ce qui décrit le lieu, pour reconnaître la France et le département. */
  place: string;
  employmentType: string;
  publishedAt: string | null;
}

/** L'adresse du tableau d'offres, telle que chaque fournisseur la documente. */
export function boardUrl(provider: AtsProvider, slug: string): string {
  const s = encodeURIComponent(slug);
  switch (provider) {
    case 'greenhouse':
      return `https://boards-api.greenhouse.io/v1/boards/${s}/jobs?content=true`;
    case 'lever':
      return `https://api.lever.co/v0/postings/${s}?mode=json`;
    case 'smartrecruiters':
      return `https://api.smartrecruiters.com/v1/companies/${s}/postings?limit=100`;
    case 'ashby':
      return `https://api.ashbyhq.com/posting-api/job-board/${s}`;
    case 'recruitee':
      return `https://${s}.recruitee.com/api/offers/`;
    case 'personio':
      return `https://${s}.jobs.personio.de/xml?language=fr`;
  }
}

type Json = Record<string, unknown>;
const str = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
const obj = (v: unknown): Json => (v && typeof v === 'object' ? (v as Json) : {});
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const date = (v: unknown): string | null => {
  const n = typeof v === 'number' ? v : Date.parse(str(v));
  return Number.isFinite(n) && n > 0 ? new Date(n).toISOString() : null;
};

/** Le texte d'un champ HTML, que le fournisseur l'ait échappé (Greenhouse) ou non. */
function text(html: unknown): string {
  const raw = str(html);
  return htmlToText(raw.includes('&lt;') ? decodeEntities(raw) : raw);
}

/** Lit la réponse d'un fournisseur. Une réponse d'une autre forme donne une liste vide, jamais une erreur. */
export function parseBoard(provider: AtsProvider, body: string): AtsJob[] {
  if (provider === 'personio') return parsePersonio(body);
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return [];
  }
  switch (provider) {
    case 'greenhouse':
      return list(obj(data).jobs).map((j) => {
        const job = obj(j);
        const place = str(obj(job.location).name);
        return { id: str(job.id), title: str(job.title), url: str(job.absolute_url), description: text(job.content), city: place.split(',')[0]?.trim() || null, postalCode: null, country: null, place, employmentType: '', publishedAt: date(job.updated_at) };
      });
    case 'lever':
      return list(data).map((j) => {
        const job = obj(j);
        const cat = obj(job.categories);
        const lists = list(job.lists).map((l) => `${str(obj(l).text)}\n${text(obj(l).content)}`).join('\n');
        const place = [str(cat.location), ...list(cat.allLocations).map(str)].join(', ');
        return {
          id: str(job.id),
          title: str(job.text),
          url: str(job.hostedUrl),
          description: [str(job.descriptionPlain) || text(job.description), lists, str(job.additionalPlain)].filter(Boolean).join('\n\n'),
          city: str(cat.location).split(',')[0]?.trim() || null,
          postalCode: null,
          country: str(job.country) || null,
          place,
          employmentType: str(cat.commitment),
          publishedAt: date(job.createdAt),
        };
      });
    case 'smartrecruiters':
      return list(obj(data).content).map((j) => {
        const job = obj(j);
        const loc = obj(job.location);
        const company = obj(job.company);
        const sections = obj(obj(job.jobAd).sections);
        const description = ['companyDescription', 'jobDescription', 'qualifications', 'additionalInformation'].map((k) => text(obj(sections[k]).text)).filter(Boolean).join('\n\n');
        return {
          id: str(job.id),
          title: str(job.name),
          url: str(job.postingUrl) || `https://jobs.smartrecruiters.com/${encodeURIComponent(str(company.identifier))}/${encodeURIComponent(str(job.id))}`,
          description,
          city: str(loc.city) || null,
          postalCode: str(loc.postalCode) || null,
          country: str(loc.country).toUpperCase() || null,
          place: [str(loc.city), str(loc.region), str(loc.country)].join(', '),
          employmentType: str(obj(job.typeOfEmployment).label),
          publishedAt: date(job.releasedDate),
        };
      });
    case 'ashby':
      return list(obj(data).jobs).map((j) => {
        const job = obj(j);
        const addr = obj(obj(job.address).postalAddress);
        return {
          id: str(job.id),
          title: str(job.title),
          url: str(job.jobUrl),
          description: str(job.descriptionPlain) || text(job.descriptionHtml),
          city: str(addr.addressLocality) || str(job.location).split(',')[0]?.trim() || null,
          postalCode: str(addr.postalCode) || null,
          country: str(addr.addressCountry) || null,
          place: [str(job.location), str(addr.addressLocality), str(addr.addressCountry), ...list(job.secondaryLocations).map((l) => str(obj(l).location))].join(', '),
          employmentType: str(job.employmentType),
          publishedAt: date(job.publishedAt),
        };
      });
    case 'recruitee':
      return list(obj(data).offers).map((j) => {
        const job = obj(j);
        return {
          id: str(job.id),
          title: str(job.title),
          url: str(job.careers_url),
          description: [text(job.description), text(job.requirements)].filter(Boolean).join('\n\n'),
          city: str(job.city) || null,
          postalCode: str(job.postal_code) || null,
          country: str(job.country_code).toUpperCase() || null,
          place: [str(job.location), str(job.city), str(job.country)].join(', '),
          employmentType: str(job.employment_type_code),
          publishedAt: date(job.published_at),
        };
      });
  }
}

/** Personio publie un XML simple : une balise <position> par offre. */
function parsePersonio(xml: string): AtsJob[] {
  const tag = (block: string, name: string) => decodeEntities(block.match(new RegExp(`<${name}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`))?.[1]?.trim() ?? '');
  return [...xml.matchAll(/<position>([\s\S]*?)<\/position>/g)].map(([, block]) => {
    const b = block!;
    const descriptions = [...b.matchAll(/<jobDescription>([\s\S]*?)<\/jobDescription>/g)].map(([, d]) => `${tag(d!, 'name')}\n${text(tag(d!, 'value'))}`).join('\n\n');
    const office = tag(b, 'office');
    return {
      id: tag(b, 'id'),
      title: tag(b, 'name'),
      url: '',
      description: descriptions,
      city: office || null,
      postalCode: null,
      country: null,
      place: office,
      employmentType: `${tag(b, 'employmentType')} ${tag(b, 'schedule')}`,
      publishedAt: date(tag(b, 'createdAt')),
    };
  });
}

/** En France : le pays le dit, ou le lieu est reconnu comme un département français. */
export function isInFrance(job: AtsJob): boolean {
  if (job.country) return /^(FR|FRA|FRANCE)$/i.test(job.country.trim());
  return /\bfrance\b/i.test(job.place) || departmentFromPlace([job.postalCode, job.city, job.place]) !== null;
}

/** Une offre d'alternance en France, au format des autres sources ; null pour tout le reste. */
export function atsJobToOffer(job: AtsJob, board: AtsBoard): Offer | null {
  if (!job.id || !job.title) return null;
  if (!isAlternance(job.title, job.description, job.employmentType)) return null;
  if (!isInFrance(job)) return null;
  const sourceId = `${board.provider}:${board.slug}:${job.id}`;
  // Personio ne donne pas l'adresse de chaque offre : la page carrière de l'entreprise, avec l'identifiant.
  const sourceUrl = job.url || `https://${board.slug}.jobs.personio.de/job/${encodeURIComponent(job.id)}`;
  const salary = salaryRangeFromDescription(job.description);
  const head = `${job.title} ${job.employmentType} ${job.description.slice(0, 2000)}`;
  return {
    id: `site-carriere:${sourceId}`,
    source: 'site-carriere',
    sourceId,
    sourceUrl,
    title: job.title.trim(),
    company: board.company,
    companySize: board.size ?? null,
    city: job.city,
    postalCode: job.postalCode,
    department: departmentFromPostalCode(job.postalCode) ?? departmentFromPlace([job.city, job.place]),
    contract: detectContract(head),
    diplomaLevel: detectDiplomaLevel(head),
    salaryText: null,
    salaryMonthlyCents: salary?.minCents ?? null,
    salaryMaxCents: salary?.maxCents ?? null,
    startDate: null,
    publishedAt: job.publishedAt ?? new Date().toISOString(),
    description: job.description,
    direct: true,
    fingerprint: fingerprint(board.company, job.title, job.city),
    schoolFlags: schoolBaitFlags({ company: board.company, title: job.title, description: job.description }),
    alsoOn: [],
  };
}

/** SmartRecruiters ne donne la description qu'offre par offre : seulement pour celles qui parlent d'alternance. */
async function smartRecruitersDetails(board: AtsBoard, jobs: AtsJob[]): Promise<AtsJob[]> {
  const out: AtsJob[] = [];
  for (const job of jobs) {
    if (!isAlternance(job.title, '', job.employmentType)) {
      out.push(job);
      continue;
    }
    const res = await fetchText(`https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(board.slug)}/postings/${encodeURIComponent(job.id)}`);
    const detail = res.status === 200 ? parseBoard('smartrecruiters', JSON.stringify({ content: [JSON.parse(res.text)] }))[0] : null;
    out.push(detail ? { ...job, description: detail.description, url: detail.url || job.url } : job);
    await sleep(300);
  }
  return out;
}

/** Ces fournisseurs ne donnent pas le nom de l'entreprise : il faut le retrouver dans ses annonces. */
export const NAMELESS: AtsProvider[] = ['lever', 'ashby', 'recruitee', 'personio'];

/**
 * Une annonce au moins cite l'employeur. Sinon, le tableau est celui d'une autre entreprise qui porte le même
 * identifiant (« vinci » chez un fournisseur peut être une start-up, pas le groupe).
 */
export function mentionsCompany(jobs: AtsJob[], company: string): boolean {
  const name = normalizeText(company).replace(/\b(sas|sasu|sa|se|group|groupe|france)\b/g, ' ').replace(/\s+/g, ' ').trim();
  if (name.length < 2) return false;
  return jobs.some((j) => ` ${normalizeText(`${j.title} ${j.description}`)} `.includes(` ${name} `));
}

/** Le tableau n'est pas celui de l'employeur attendu : on arrête de le lire. */
export class BoardMismatchError extends Error {}

/** Toutes les offres d'alternance en France d'un tableau. Lève une erreur si le tableau ne répond pas. */
export async function fetchAtsBoard(board: AtsBoard): Promise<Offer[]> {
  const res = await fetchText(boardUrl(board.provider, board.slug), { headers: { Accept: board.provider === 'personio' ? 'application/xml' : 'application/json' } });
  if (res.status !== 200) throw new Error(`${board.provider}/${board.slug} : HTTP ${res.status}`);
  let jobs = parseBoard(board.provider, res.text);
  if (NAMELESS.includes(board.provider) && jobs.length > 0 && !mentionsCompany(jobs, board.company)) {
    throw new BoardMismatchError(`${board.provider}/${board.slug} : aucune annonce ne cite ${board.company}`);
  }
  if (board.provider === 'smartrecruiters') jobs = await smartRecruitersDetails(board, jobs);
  return jobs.map((j) => atsJobToOffer(j, board)).filter((o): o is Offer => o !== null);
}
