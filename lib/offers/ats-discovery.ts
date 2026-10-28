// Trouver le tableau d'offres d'un employeur : on essaie, pour chaque logiciel de recrutement, les
// identifiants qu'on peut tirer de son nom (« L'Oréal » : « loreal », « l-oreal »). Un tableau n'est
// retenu que s'il répond, et soit porte un nom qui correspond, soit a des offres en France dont une
// au moins cite l'employeur.
// Les noms à essayer viennent des employeurs déjà en base et d'une courte liste de départ.

import { CAC40 } from './companies';
import { type AtsBoard, type AtsProvider, ATS_PROVIDERS, boardUrl, isInFrance, mentionsCompany, parseBoard } from './connectors/ats';
import { fetchText, sleep } from './connectors/http';
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

/** Tous les tableaux d'un employeur (il peut en avoir plusieurs, un par filiale). */
export async function discover(company: string): Promise<AtsBoard[]> {
  const found: AtsBoard[] = [];
  for (const provider of ATS_PROVIDERS) {
    const board = await probe(provider, company);
    if (board) found.push(board);
  }
  return found;
}
