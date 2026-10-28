// Trouver le tableau d'offres d'un employeur : on essaie, pour chaque logiciel de recrutement, les
// identifiants qu'on peut tirer de son nom (« L'Oréal » : « loreal », « l-oreal »). Un tableau n'est
// retenu que s'il répond, et soit porte un nom qui correspond, soit a des offres en France dont une
// au moins cite l'employeur.
// Les noms à essayer viennent des employeurs déjà en base et d'une courte liste de départ.

import { CAC40 } from './companies';
import { type AtsBoard, type AtsProvider, ATS_PROVIDERS, boardUrl, isInFrance, mentionsCompany, parseBoard } from './connectors/ats';
import { fetchText, sleep } from './connectors/http';
import { parseWorkdaySlug, sampleWorkdayJobs, sitesFromRobots, WORKDAY_HOSTS, workdayRobots, workdaySlug } from './connectors/workday';
import { companyKey, normalizeText } from './normalize';

/** Grands employeurs d'alternants, en plus du CAC 40. Seulement des noms : leur tableau est cherché, jamais supposé. */
export const SEED_COMPANIES = [
  ...CAC40.map((c) => c.company),
  'Doctolib', 'Qonto', 'Alan', 'BlaBlaCar', 'Back Market', 'Contentsquare', 'Mirakl', 'Swile', 'PayFit', 'Pennylane', 'Ledger',
  'Dataiku', 'ManoMano', 'Deezer', 'Criteo', 'Ubisoft', 'OVHcloud', 'Decathlon', 'Leroy Merlin', 'Lacoste', 'Sézane', 'Ankorstore',
  'Spendesk', 'Malt', 'Lydia', 'Shine', 'Agicap', 'Libeo', 'Aircall', 'Algolia', 'Mistral AI', 'Hugging Face', 'Ornikar', 'Luko',
  'Welcome to the Jungle', 'JobTeaser', 'Indy', 'Yousign', 'Didomi', 'Sorare', 'Veepee', 'Cdiscount', 'Fnac Darty', 'Boulanger',
  'Sodexo', 'Accor', 'Elior', 'Bouygues Telecom', 'SFR', 'Free', 'La Poste', 'SNCF', 'RATP', 'EDF', 'Dassault Systèmes',
  'Capgemini', 'Sopra Steria', 'Atos', 'Thales', 'Safran', 'Airbus', 'Renault', 'Stellantis', 'Michelin', 'Valeo', 'Forvia',
  'BNP Paribas', 'Société Générale', 'Crédit Agricole', 'AXA', 'Allianz France', 'Generali France', 'Natixis', 'Amundi',
  "L'Oréal", 'LVMH', 'Kering', 'Hermès', 'Chanel', 'Danone', 'Pernod Ricard', 'Carrefour', 'Auchan', 'Leclerc', 'Lidl France',
  // SBF 120 et grands employeurs d'alternants hors CAC 40.
  'Alstom', 'Arkema', 'Bic', 'bioMérieux', 'Bolloré', 'Eiffage', 'Spie', 'Nexans', 'Rexel', 'Ipsen', 'Teleperformance', 'Worldline',
  'Eramet', 'Imerys', 'Ayvens', 'Klépierre', 'Vallourec', 'Technip Energies', 'Soitec', 'Groupe SEB', 'OPmobility', 'Elis', 'Coface',
  'SCOR', 'Getlink', 'Groupe ADP', 'Air France', 'Dassault Aviation', 'Naval Group', 'MBDA', 'KNDS', 'ArianeGroup', 'CMA CGM',
  'Enedis', 'GRDF', 'RTE', 'Orano', 'Framatome', 'Suez', 'Saur', 'Colas', 'Equans', 'Bouygues Construction', 'Vinci Energies',
  'Intermarché', 'Système U', 'Monoprix', 'Picard', 'Kiabi', 'Sephora', 'Yves Rocher', 'Galeries Lafayette', 'Ikea', 'Castorama',
  'Norauto', 'Club Med', 'Disneyland Paris', 'Crédit Mutuel', 'BPCE', 'LCL', 'La Banque Postale', 'MAIF', 'Macif', 'Groupama',
  'Malakoff Humanis', 'AG2R La Mondiale', 'CNP Assurances', 'Covéa', 'Ipsos', 'Havas', 'TF1', 'M6', 'Canal+', 'Alten', 'Akkodis',
  'Expleo', 'Assystem', 'Segula', 'Inetum', 'Accenture', 'Deloitte', 'PwC', 'EY', 'KPMG', 'Forvis Mazars', 'Adecco', 'Randstad',
  'Onet', 'Clariane', 'Lactalis', 'Bonduelle', 'Savencia', 'Nestlé', 'Pierre Fabre', 'Servier', 'Clarins', 'Tereos', 'Transdev',
  'Keolis', 'Geodis', 'Chronopost', 'Ericsson', 'Siemens', 'Bosch', 'Schlumberger', 'Nokia', 'IBM', 'Microsoft', 'Amazon',
];

const LEGAL = /\b(sas|sasu|sa|sarl|se|group|groupe|france|holding|international|services)\b/g;

/** Les identifiants à essayer pour un nom : collé, avec tirets, sans la forme juridique. */
export function slugCandidates(name: string): string[] {
  const base = normalizeText(name);
  const short = base.replace(LEGAL, ' ').replace(/\s+/g, ' ').trim() || base;
  const forms = [short.replace(/ /g, ''), short.replace(/ /g, '-'), base.replace(/ /g, '')];
  return [...new Set(forms.filter((f) => f.length >= 2))];
}

/** Deux noms d'entreprise désignent-ils la même ? On compare sans forme juridique ni ponctuation. */
export function sameCompany(a: string, b: string): boolean {
  const x = companyKey(a);
  const y = companyKey(b);
  return x.length >= 2 && y.length >= 2 && (x === y || x.startsWith(y) || y.startsWith(x));
}

/** Le nom que le fournisseur donne au tableau, quand il en donne un. */
async function boardName(provider: AtsProvider, slug: string, body: string): Promise<string | null> {
  if (provider === 'greenhouse') {
    const res = await fetchText(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}`);
    try {
      return res.status === 200 ? ((JSON.parse(res.text) as { name?: string }).name ?? null) : null;
    } catch {
      return null;
    }
  }
  if (provider === 'smartrecruiters') {
    try {
      const first = (JSON.parse(body) as { content?: { company?: { name?: string } }[] }).content?.[0];
      return first?.company?.name ?? null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Le tableau de cet employeur chez ce fournisseur, s'il existe et qu'on peut s'y fier. */
export async function probe(provider: AtsProvider, company: string): Promise<AtsBoard | null> {
  for (const slug of slugCandidates(company)) {
    let res;
    try {
      res = await fetchText(boardUrl(provider, slug), { timeoutMs: 10_000 });
    } catch {
      continue;
    }
    await sleep(150);
    if (res.status !== 200) continue;
    const jobs = parseBoard(provider, res.text);
    const name = await boardName(provider, slug, res.text);
    // Un nom qui ne correspond pas : c'est une autre entreprise qui porte le même identifiant.
    if (name && !sameCompany(name, company)) continue;
    // Sans nom : des offres en France, et au moins une annonce qui cite l'employeur.
    if (!name && (!jobs.some(isInFrance) || !mentionsCompany(jobs, company))) continue;
    return { provider, slug, company: name ?? company };
  }
  return null;
}

/** Les tableaux d'un employeur chez les logiciels où l'identifiant se tire du nom. */
export async function discoverAts(company: string): Promise<AtsBoard[]> {
  const found: AtsBoard[] = [];
  for (const provider of ATS_PROVIDERS) {
    const board = await probe(provider, company);
    if (board) found.push(board);
  }
  return found;
}

/**
 * Le tableau Workday d'un employeur : pour chaque identifiant possible et chaque serveur, le robots.txt du groupe
 * déclare ses sites carrière. Un site n'est retenu que si ses annonces sont publiées par cet employeur (ou, quand
 * Workday ne le dit pas, si elles sont en France et le citent).
 */
export async function discoverWorkday(company: string): Promise<AtsBoard[]> {
  const tenants = slugCandidates(company).filter((t) => /^[a-z0-9]+$/.test(t));
  for (const tenant of tenants) {
    for (const host of WORKDAY_HOSTS) {
      const robots = await workdayRobots(tenant, host);
      await sleep(150);
      const sites = robots ? sitesFromRobots(robots, tenant, host) : [];
      if (!sites.length) continue;
      const found: AtsBoard[] = [];
      for (const site of sites.slice(0, 3)) {
        const board = parseWorkdaySlug(workdaySlug({ tenant, host, site }));
        if (!board) continue;
        let sample;
        try {
          sample = await sampleWorkdayJobs(board);
        } catch {
          continue;
        }
        const employers = sample.map((j) => j.employer).filter((e): e is string => Boolean(e));
        const owned = employers.length > 0 ? employers.some((e) => sameCompany(e, company)) : sample.some(isInFrance) && mentionsCompany(sample, company);
        if (owned) found.push({ provider: 'workday', slug: workdaySlug(board), company });
      }
      // Un groupe n'a ses sites que chez un serveur : inutile d'essayer les autres.
      return found;
    }
  }
  return [];
}

/** Tous les tableaux d'un employeur (il peut en avoir plusieurs, un par filiale). */
export async function discover(company: string): Promise<AtsBoard[]> {
  return [...(await discoverAts(company)), ...(await discoverWorkday(company))];
}
