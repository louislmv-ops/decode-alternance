// Une collecte : La bonne alternance et France Travail (tous les départements ou une partie), puis les sites
// carrière renseignés dans companies.ts. Les offres sont écrites au fil de l'eau. Une offre qu'aucune collecte n'a revue depuis
// STALE_HOURS est retirée : elle a été pourvue ou dépubliée.

import { careerSites } from './companies';
import { DEPARTMENTS, fetchFranceTravail } from './connectors/france-travail';
import { crawlCareerSite } from './connectors/job-posting';
import { isLbaConfigured } from './connectors/la-bonne-alternance';
import { harvestLba, type LbaHarvestReport } from './connectors/lba-harvest';
import { ensureOfferSchema, removeStale, upsertOffers } from './store';

export const STALE_HOURS = 36;

/** Le cron tourne toutes les deux heures : chaque créneau traite un douzième des départements. */
export const SLOTS = 12;

export function departmentsForSlot(slot: number): string[] {
  return DEPARTMENTS.filter((_, i) => i % SLOTS === ((slot % SLOTS) + SLOTS) % SLOTS);
}

export interface IngestReport {
  laBonneAlternance: LbaHarvestReport | { skipped: string };
  franceTravail: { fetched: number; truncated: string[] } | { skipped: string };
  careerSites: { company: string; offers: number; pagesRead: number; error?: string }[];
  removed: number;
}

export async function runIngest(
  opts: { log?: (line: string) => void; departments?: string[]; careerSites?: boolean } = {},
): Promise<IngestReport> {
  const log = opts.log ?? console.log;
  const report: IngestReport = { laBonneAlternance: { skipped: '' }, franceTravail: { skipped: '' }, careerSites: [], removed: 0 };
  await ensureOfferSchema();

  if (isLbaConfigured()) {
    report.laBonneAlternance = await harvestLba({ departments: opts.departments ?? DEPARTMENTS, onBatch: upsertOffers, log });
    log(`La bonne alternance : ${report.laBonneAlternance.fetched} offres lues en ${report.laBonneAlternance.calls} appels`);
  } else {
    report.laBonneAlternance = { skipped: 'LBA_API_TOKEN manquant' };
    log('La bonne alternance : ignorée (LBA_API_TOKEN manquant)');
  }

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
  // Une source qui n'a pas tourné ne retire rien : une panne ne doit pas vider la base. Une collecte partielle
  // (quelques départements) non plus : elle n'a pas revu les autres.
  const full = !opts.departments;
  if (full && !('skipped' in report.laBonneAlternance) && report.laBonneAlternance.fetched > 0) report.removed += await removeStale('la-bonne-alternance', cutoff);
  if (full && !('skipped' in report.franceTravail) && report.franceTravail.fetched > 0) report.removed += await removeStale('france-travail', cutoff);
  report.removed += await removeStale('site-carriere', cutoff);
  log(`${report.removed} offres retirées (non revues depuis ${STALE_HOURS} h)`);
  return report;
}
