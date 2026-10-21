// Collecte en ligne de commande.
//   pnpm ingest                    collecte complète (France Travail + sites carrière renseignés)
//   pnpm ingest --dep 35,56        seulement ces départements pour France Travail
//   pnpm ingest --site <url>       teste un site carrière sans rien écrire en base

import { crawlCareerSite } from '@/lib/offers/connectors/job-posting';
import { runIngest } from '@/lib/offers/ingest';
import { closeDb } from '@/lib/offers/store';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

async function main() {
  const site = flag('--site');
  if (site) {
    const result = await crawlCareerSite({ company: new URL(site).hostname, careersUrl: site, size: 'grande' }, { maxPages: 40, log: console.log });
    console.log(`${result.pagesRead} pages lues, ${result.skippedByRobots} interdites par robots.txt, ${result.offers.length} offres d'alternance trouvées`);
    for (const offer of result.offers.slice(0, 10)) console.log(`- ${offer.title} · ${offer.city ?? 'lieu inconnu'} · ${offer.sourceUrl}`);
    return;
  }

  const departments = flag('--dep')?.split(',').map((d) => d.trim().toUpperCase());
  const report = await runIngest({ departments });
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
