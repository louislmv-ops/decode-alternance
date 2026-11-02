// Teste des adresses de sites carrière avant de les renseigner dans lib/offers/companies.ts, sans rien écrire
// en base : pour chacune, combien de pages d'offres le sitemap donne et combien d'offres d'alternance
// le balisage JobPosting en sort. Lancé par le workflow « Sites carrière » (le réseau y est ouvert).
//   pnpm tsx scripts/probe-careers.ts [fichier.json] [pages par site]

import { readFileSync } from 'node:fs';
import { discover } from '@/lib/offers/ats-discovery';
import { type AtsProvider, fetchAtsBoard } from '@/lib/offers/connectors/ats';
import { fetchText, parseRobots } from '@/lib/offers/connectors/http';
import { crawlCareerSite, extractJobPostings } from '@/lib/offers/connectors/job-posting';

interface Candidate {
  company: string;
  urls?: string[];
  /** Tableaux de logiciels de recrutement à essayer, « fournisseur:identifiant » (« workday:ag.wd3/Airbus »). */
  boards?: string[];
  /** Chercher aussi ses tableaux chez les logiciels de recrutement, comme la collecte de nuit (Workday compris). */
  discover?: boolean;
}

/** Pourquoi un site ne donne rien : réponses du site et de robots.txt, sitemaps, balisage, liens d'offres. */
async function diagnose(url: string): Promise<string> {
  const parts: string[] = [];
  const origin = new URL(url).origin;
  const robots = await fetchText(`${origin}/robots.txt`).catch((e: Error) => ({ status: 0, text: e.message, headers: new Headers() }));
  const rules = parseRobots(robots.status === 200 ? robots.text : '');
  parts.push(`robots ${robots.status}`, `sitemaps déclarés ${rules.sitemaps.length}`);
  for (const sm of [...rules.sitemaps, `${origin}/sitemap.xml`].slice(0, 3)) {
    const r = await fetchText(sm).catch(() => null);
    parts.push(`${sm.replace(origin, '')} ${r?.status ?? 'échec'} (${r ? (r.text.match(/<loc>/g) ?? []).length : 0} adresses)`);
  }
  const page = await fetchText(url).catch((e: Error) => ({ status: 0, text: e.message, headers: new Headers() }));
  const links = [...page.text.matchAll(/href=["']([^"'#]+)["']/g)].map((m) => m[1] ?? '');
  const jobLinks = links.filter((l) => /(offre|offer|job|emploi|poste|vacanc|career|carriere)/i.test(l) && /\d{3,}|altern|apprenti/i.test(l));
  parts.push(`page ${page.status} (${page.text.length} car.)`, `JobPosting ${extractJobPostings(page.text).length}`, `liens d'offres ${jobLinks.length}`);
  if (jobLinks[0]) parts.push(`ex. ${jobLinks[0].slice(0, 120)}`);
  if (/cloudflare|captcha|access denied|datadome/i.test(page.text.slice(0, 5000))) parts.push('protection anti-robots');
  return parts.join(' · ');
}

const file = process.argv[2] ?? 'scripts/career-candidates.json';
const maxPages = Number(process.argv[3] ?? 40);
/** Des sites différents en parallèle ; chacun reste lu une page à la fois, avec la pause de son robots.txt. */
const PARALLEL = 4;

async function probe(company: string, url: string) {
  const lines: string[] = [];
  try {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const result = await Promise.race([
      crawlCareerSite({ company, careersUrl: url, size: 'grande' }, { maxPages, log: (l) => lines.push(l) }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('plus de 4 minutes')), 240_000);
      }),
    ]).finally(() => clearTimeout(timer));
    return { company, url, ok: result.offers.length > 0, offers: result.offers.length, pages: result.pagesRead, robots: result.skippedByRobots, note: lines.join(' | '), sample: result.offers.slice(0, 2).map((o) => `${o.title} · ${o.city ?? '?'}`) };
  } catch (error) {
    return { company, url, ok: false, offers: 0, pages: 0, robots: 0, note: (error as Error).message, sample: [] as string[] };
  }
}

/** Un tableau de logiciel de recrutement : combien d'offres d'alternance en France il donne. */
async function probeBoard(company: string, board: string) {
  const [provider, slug] = board.split(/:(.*)/s) as [AtsProvider, string];
  try {
    const offers = await fetchAtsBoard({ provider, slug, company });
    return { company, url: board, ok: offers.length > 0, offers: offers.length, pages: 0, robots: 0, note: 'tableau lu', sample: offers.slice(0, 2).map((o) => `${o.title} · ${o.city ?? '?'}`) };
  } catch (error) {
    return { company, url: board, ok: false, offers: 0, pages: 0, robots: 0, note: (error as Error).message, sample: [] as string[] };
  }
}

/** Les tableaux que la recherche de nuit trouverait pour cet employeur, et ce qu'ils donnent. */
async function probeDiscover(company: string) {
  try {
    const boards = await discover(company);
    let offers = 0;
    const names: string[] = [];
    for (const b of boards) {
      const found = await fetchAtsBoard(b).catch(() => []);
      offers += found.length;
      names.push(`${b.provider}:${b.slug} (${found.length})`);
    }
    return { company, url: 'recherche des tableaux', ok: offers > 0, offers, pages: 0, robots: 0, note: names.join(', ') || 'aucun tableau trouvé', sample: [] as string[] };
  } catch (error) {
    return { company, url: 'recherche des tableaux', ok: false, offers: 0, pages: 0, robots: 0, note: (error as Error).message, sample: [] as string[] };
  }
}

async function main() {
  const candidates = JSON.parse(readFileSync(file, 'utf8')) as Candidate[];
  const jobs = candidates.flatMap((c) => [
    ...(c.urls ?? []).map((url) => ({ company: c.company, url, run: () => probe(c.company, url) })),
    ...(c.boards ?? []).map((board) => ({ company: c.company, url: board, run: () => probeBoard(c.company, board) })),
    ...(c.discover ? [{ company: c.company, url: 'recherche des tableaux', run: () => probeDiscover(c.company) }] : []),
  ]);
  const results: { company: string; url: string; ok: boolean; offers: number; pages: number }[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: PARALLEL }, async () => {
      while (next < jobs.length) {
        const job = jobs[next++]!;
        const r = await job.run();
        results.push(r);
        console.log(`${r.ok ? 'OK  ' : 'RIEN'} ${r.company} · ${r.url} · ${r.offers} offres d'alternance, ${r.pages} pages lues, ${r.robots} interdites · ${r.note}`);
        for (const s of r.sample) console.log(`       - ${s}`);
        if (!r.ok && /^https?:/.test(job.url)) console.log(`       diagnostic : ${await diagnose(job.url).catch((e: Error) => e.message)}`);
      }
    }),
  );
  const ok = results.filter((r) => r.ok);
  console.log(`\n${ok.length} sites sur ${results.length} remontent des offres d'alternance.`);
  console.log(`RESULTATS ${JSON.stringify(results.map(({ company, url, offers, pages }) => ({ company, url, offers, pages })))}`);
}

void main();
