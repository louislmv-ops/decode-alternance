// Une collecte : La bonne alternance et France Travail (tous les départements ou une partie), puis les sites
// carrière renseignés dans companies.ts et les tableaux des logiciels de recrutement (connectors/ats.ts). Les offres sont écrites au fil de l'eau. Une offre qu'aucune collecte n'a revue depuis
// STALE_HOURS est retirée : elle a été pourvue ou dépubliée.

import { careerSites } from './companies';
import { DEPARTMENTS, fetchFranceTravail } from './connectors/france-travail';
import { crawlCareerSite } from './connectors/job-posting';
import { isLbaConfigured } from './connectors/la-bonne-alternance';
import { harvestLba, type LbaHarvestReport } from './connectors/lba-harvest';
import { discover, SEED_COMPANIES } from './ats-discovery';
import { fetchAtsBoard } from './connectors/ats';
import { sleep } from './connectors/http';
import { companiesToProbe, ensureOfferSchema, listAtsBoards, markAtsBoard, markProbed, removeStale, saveAtsBoard, upsertOffers } from './store';

export const STALE_HOURS = 36;

/** Employeurs cherchés chez les logiciels de recrutement à chaque collecte : quelques minutes de requêtes. */
export const ATS_PROBES_PER_NIGHT = 120;

/**
 * Les logiciels de recrutement : d'abord chercher les tableaux de quelques employeurs de plus, puis lire tous les
 * tableaux connus. Une offre lue ici est publiée par l'employeur lui-même (« Direct entreprise »).
 */
async function ingestAts(log: (line: string) => void, probeLimit: number): Promise<IngestReport['ats']> {
  let discovered = 0;
  const companies = await companiesToProbe(SEED_COMPANIES, probeLimit);
  for (const { company, size } of companies) {
    const boards = await discover(company);
    for (const board of boards) await saveAtsBoard({ ...board, size });
    await markProbed(company, boards.length > 0);
    discovered += boards.length;
    if (boards.length) log(`Logiciels de recrutement : ${company} trouvé chez ${boards.map((b) => `${b.provider}/${b.slug}`).join(', ')}`);
  }
  const boards = await listAtsBoards();
  let offers = 0;
  let failed = 0;
  for (const board of boards) {
    try {
      const found = await fetchAtsBoard(board);
      await upsertOffers(found);
      await markAtsBoard(board, { offers: found.length });
      offers += found.length;
    } catch (error) {
      failed += 1;
      await markAtsBoard(board, { error: true });
      log(`${board.provider}/${board.slug} : échec (${(error as Error).message})`);
    }
    await sleep(400);
  }
  log(`Logiciels de recrutement : ${companies.length} employeurs cherchés, ${discovered} tableaux trouvés, ${boards.length} lus, ${offers} offres d'alternance`);
  return { boards: boards.length, offers, discovered, probed: companies.length, failed };
}

/** Le cron tourne toutes les deux heures : chaque créneau traite un douzième des départements. */
export const SLOTS = 12;

export function departmentsForSlot(slot: number): string[] {
  return DEPARTMENTS.filter((_, i) => i % SLOTS === ((slot % SLOTS) + SLOTS) % SLOTS);
}

export interface IngestReport {
  laBonneAlternance: LbaHarvestReport | { skipped: string };
  franceTravail: { fetched: number; truncated: string[] } | { skipped: string };
  careerSites: { company: string; offers: number; pagesRead: number; error?: string }[];
  ats: { boards: number; offers: number; discovered: number; probed: number; failed: number } | { skipped: string };
  removed: number;
}

export async function runIngest(
  opts: { log?: (line: string) => void; departments?: string[]; careerSites?: boolean; ats?: boolean; probeLimit?: number } = {},
): Promise<IngestReport> {
  const log = opts.log ?? console.log;
  const report: IngestReport = { laBonneAlternance: { skipped: '' }, franceTravail: { skipped: '' }, careerSites: [], ats: { skipped: '' }, removed: 0 };
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

  if (opts.careerSites !== false && opts.ats !== false) report.ats = await ingestAts(log, opts.probeLimit ?? ATS_PROBES_PER_NIGHT);

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
