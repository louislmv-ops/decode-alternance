// Collecte en ligne de commande.
//   pnpm ingest                    collecte complète (France Travail + sites carrière renseignés)
//   pnpm ingest --dep 35,56        seulement ces départements pour France Travail
//   pnpm ingest --site <url>       teste un site carrière sans rien écrire en base
//   pnpm ingest --ats lever:qonto  lit un tableau d'un logiciel de recrutement, sans rien écrire en base
//                                  (Workday : --ats workday:thales.wd3/Careers)
//   pnpm ingest --discover Qonto   cherche les tableaux d'un employeur, sans rien écrire en base
//   pnpm ingest --no-ats           collecte sans les logiciels de recrutement

import { crawlCareerSite } from '@/lib/offers/connectors/job-posting';
import { discover } from '@/lib/offers/ats-discovery';
import { type AtsProvider, fetchAtsBoard } from '@/lib/offers/connectors/ats';
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

  const ats = flag('--ats');
  if (ats) {
    const [provider, slug] = ats.split(':') as [AtsProvider, string];
    const offers = await fetchAtsBoard({ provider, slug, company: slug });
    console.log(`${offers.length} offres d'alternance en France`);
    for (const offer of offers.slice(0, 10)) console.log(`- ${offer.title} · ${offer.city ?? 'lieu inconnu'} · ${offer.sourceUrl}`);
    return;
  }
  const company = flag('--discover');
  if (company) {
    const boards = await discover(company);
    console.log(boards.length ? boards.map((b) => `${b.provider}/${b.slug} (${b.company})`).join('\n') : 'Aucun tableau trouvé');
    return;
  }

  const departments = flag('--dep')?.split(',').map((d) => d.trim().toUpperCase());
  const report = await runIngest({ departments, ats: !args.includes('--no-ats') });
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
