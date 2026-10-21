// Une collecte : France Travail (tous les départements ou une partie), puis les sites carrière renseignés
// dans companies.ts. Les offres sont écrites au fil de l'eau. Une offre qu'aucune collecte n'a revue depuis
// STALE_HOURS est retirée : elle a été pourvue ou dépubliée.

import { careerSites } from './companies';
import { DEPARTMENTS, fetchFranceTravail } from './connectors/france-travail';
import { crawlCareerSite } from './connectors/job-posting';
import { removeStale, upsertOffers } from './store';

export const STALE_HOURS = 36;

/** Le cron tourne toutes les deux heures : chaque créneau traite un douzième des départements. */
export const SLOTS = 12;

export function departmentsForSlot(slot: number): string[] {
  return DEPARTMENTS.filter((_, i) => i % SLOTS === ((slot % SLOTS) + SLOTS) % SLOTS);
}

export interface IngestReport {
  franceTravail: { fetched: number; truncated: string[] } | { skipped: string };
  careerSites: { company: string; offers: number; pagesRead: number; error?: string }[];
  removed: number;
}

export async function runIngest(
  opts: { log?: (line: string) => void; departments?: string[]; careerSites?: boolean } = {},
): Promise<IngestReport> {
  const log = opts.log ?? console.log;
  const report: IngestReport = { franceTravail: { skipped: '' }, careerSites: [], removed: 0 };

  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;
  if (clientId && clientSecret) {
    const result = await fetchFranceTravail({ clientId, clientSecret, departments: opts.departments, onBatch: upsertOffers, log });
    report.franceTravail = { fetched: result.fetched, truncated: result.truncated };
    log(`France Travail : ${result.fetched} offres lues`);
  } else {
    report.franceTravail = { skipped: 'FRANCE_TRAVAIL_CLIENT_ID ou FRANCE_TRAVAIL_CLIENT_SECRET manquant' };
    log('France Travail : ignoré (identifiants manquants)');
  }

  if (opts.careerSites !== false) {
    const sites = careerSites();
    if (sites.length === 0) log('Sites carrière : aucun site renseigné dans lib/offers/companies.ts');
    for (const site of sites) {
      try {
        const result = await crawlCareerSite(site, { log });
        await upsertOffers(result.offers);
        report.careerSites.push({ company: site.company, offers: result.offers.length, pagesRead: result.pagesRead });
      } catch (error) {
        report.careerSites.push({ company: site.company, offers: 0, pagesRead: 0, error: (error as Error).message });
        log(`${site.company} : échec (${(error as Error).message})`);
      }
    }
  }

  const cutoff = new Date(Date.now() - STALE_HOURS * 3_600_000);
  report.removed = (await removeStale('france-travail', cutoff)) + (await removeStale('site-carriere', cutoff));
  log(`${report.removed} offres retirées (non revues depuis ${STALE_HOURS} h)`);
  return report;
}
