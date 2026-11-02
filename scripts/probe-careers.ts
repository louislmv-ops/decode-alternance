// Teste des adresses de sites carrière avant de les renseigner dans lib/offers/companies.ts, sans rien écrire
// en base : pour chacune, combien de pages d'offres le sitemap donne et combien d'offres d'alternance
// le balisage JobPosting en sort. Lancé par le workflow « Sites carrière » (le réseau y est ouvert).
//   pnpm tsx scripts/probe-careers.ts [fichier.json] [pages par site]

import { readFileSync } from 'node:fs';
import { type AtsProvider, fetchAtsBoard } from '@/lib/offers/connectors/ats';
import { crawlCareerSite } from '@/lib/offers/connectors/job-posting';

interface Candidate {
  company: string;
  urls?: string[];
  /** Tableaux de logiciels de recrutement à essayer, « fournisseur:identifiant » (« workday:ag.wd3/Airbus »). */
  boards?: string[];
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

async function main() {
  const candidates = JSON.parse(readFileSync(file, 'utf8')) as Candidate[];
  const jobs = candidates.flatMap((c) => [
    ...(c.urls ?? []).map((url) => ({ company: c.company, url, run: () => probe(c.company, url) })),
    ...(c.boards ?? []).map((board) => ({ company: c.company, url: board, run: () => probeBoard(c.company, board) })),
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
      }
    }),
  );
  const ok = results.filter((r) => r.ok);
  console.log(`\n${ok.length} sites sur ${results.length} remontent des offres d'alternance.`);
  console.log(`RESULTATS ${JSON.stringify(results.map(({ company, url, offers, pages }) => ({ company, url, offers, pages })))}`);
}

void main();
