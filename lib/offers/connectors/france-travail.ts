// Connecteur de l'API Offres d'emploi v2 de France Travail (francetravail.io).
// La licence de réutilisation autorise la rediffusion des offres, sauf leurs coordonnées de contact,
// qu'on ne lit donc pas. Il faut un compte développeur et une application abonnée à l'API :
// FRANCE_TRAVAIL_CLIENT_ID et FRANCE_TRAVAIL_CLIENT_SECRET.

import { fetchText, sleep } from './http';
import {
  departmentFromPostalCode,
  detectContract,
  detectDiplomaLevel,
  fingerprint,
  parseSalary,
  schoolBaitFlags,
  sizeFromHeadcount,
} from '../normalize';
import type { Offer, OfferContract } from '../types';

const TOKEN_URL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire';
export const API = 'https://api.francetravail.io/partenaire/offresdemploi/v2';
const SCOPE = 'api_offresdemploiv2 o2dsoffre';
/** L'API rend 150 offres au plus par appel et refuse de paginer au-delà de la 3 150e. */
const PAGE = 150;
const MAX_START = 3000;

export const DEPARTMENTS = [
  ...Array.from({ length: 95 }, (_, i) => String(i + 1).padStart(2, '0')).filter((d) => d !== '20'),
  '2A', '2B', '971', '972', '973', '974', '976',
];

export interface FtOffer {
  id: string;
  intitule: string;
  description?: string;
  dateCreation: string;
  lieuTravail?: { libelle?: string; codePostal?: string; commune?: string };
  entreprise?: { nom?: string; url?: string; logo?: string };
  natureContrat?: string;
  salaire?: { libelle?: string; commentaire?: string };
  trancheEffectifEtab?: string;
  formations?: { niveauLibelle?: string; domaineLibelle?: string }[];
  origineOffre?: { urlOrigine?: string };
  alternance?: boolean;
}

export async function getToken(clientId: string, clientSecret: string): Promise<string> {
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret, scope: SCOPE });
  const res = await fetchText(TOKEN_URL, {
    method: 'POST',
    body: body.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (res.status !== 200) throw new Error(`France Travail : jeton refusé (HTTP ${res.status})`);
  const token = (JSON.parse(res.text) as { access_token?: string }).access_token;
  if (!token) throw new Error('France Travail : réponse sans jeton');
  return token;
}

let cachedToken: { value: string; until: number } | null = null;

/** Le jeton est valable environ 25 minutes : on le garde 20 minutes. */
export async function cachedFtToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && cachedToken.until > Date.now()) return cachedToken.value;
  cachedToken = { value: await getToken(clientId, clientSecret), until: Date.now() + 20 * 60_000 };
  return cachedToken.value;
}

/** Codes de nature de contrat dont le libellé parle d'apprentissage ou de professionnalisation, lus dans le référentiel. */
export async function alternanceNatureCodes(token: string): Promise<string[]> {
  const res = await fetchText(`${API}/referentiel/naturesContrats`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (res.status !== 200) throw new Error(`France Travail : référentiel indisponible (HTTP ${res.status})`);
  const items = JSON.parse(res.text) as { code: string; libelle: string }[];
  return items.filter((n) => /apprentissage|professionnalisation/i.test(n.libelle)).map((n) => n.code);
}

export function toOffer(o: FtOffer): Offer {
  const description = o.description ?? '';
  const company = o.entreprise?.nom?.trim() || null;
  const city = o.lieuTravail?.libelle?.replace(/^\d+\s*-\s*/, '').trim() || null;
  const salaryText = [o.salaire?.libelle, o.salaire?.commentaire].filter(Boolean).join(' · ') || null;
  const levelText = (o.formations ?? []).map((f) => `${f.niveauLibelle ?? ''} ${f.domaineLibelle ?? ''}`).join(' ');
  const contract: OfferContract = /professionnalisation/i.test(o.natureContrat ?? '')
    ? 'professionnalisation'
    : /apprentissage/i.test(o.natureContrat ?? '')
      ? 'apprentissage'
      : detectContract(`${o.intitule} ${description}`);
  return {
    id: `france-travail:${o.id}`,
    source: 'france-travail',
    sourceId: o.id,
    sourceUrl: o.origineOffre?.urlOrigine || `https://candidat.francetravail.fr/offres/recherche/detail/${encodeURIComponent(o.id)}`,
    title: o.intitule,
    company,
    companySize: sizeFromHeadcount(o.trancheEffectifEtab),
    city,
    postalCode: o.lieuTravail?.codePostal ?? null,
    department: departmentFromPostalCode(o.lieuTravail?.codePostal) ?? o.lieuTravail?.libelle?.match(/^(\d{2,3}|2[AB])\s*-/)?.[1] ?? null,
    contract,
    diplomaLevel: detectDiplomaLevel(`${levelText} ${o.intitule} ${description.slice(0, 1500)}`),
    salaryText,
    salaryMonthlyCents: parseSalary(salaryText),
    startDate: null,
    publishedAt: o.dateCreation,
    description,
    direct: false,
    fingerprint: fingerprint(company, o.intitule, city),
    schoolFlags: schoolBaitFlags({ company, title: o.intitule, description }),
    alsoOn: [],
    companySite: o.entreprise?.url ?? null,
    logoUrl: o.entreprise?.logo ?? null,
  };
}

/**
 * Toutes les offres d'alternance, département par département pour rester sous la limite de pagination.
 * `onBatch` reçoit chaque page dès qu'elle arrive, pour écrire en base au fil de l'eau.
 */
export async function fetchFranceTravail(opts: {
  clientId: string;
  clientSecret: string;
  departments?: string[];
  onBatch: (offers: Offer[]) => Promise<void>;
  log?: (line: string) => void;
}): Promise<{ fetched: number; truncated: string[] }> {
  const log = opts.log ?? (() => {});
  const token = await getToken(opts.clientId, opts.clientSecret);
  const natures = await alternanceNatureCodes(token);
  if (natures.length === 0) throw new Error('France Travail : aucune nature de contrat d’alternance dans le référentiel');
  log(`natures de contrat retenues : ${natures.join(', ')}`);

  let fetched = 0;
  const truncated: string[] = [];
  for (const department of opts.departments ?? DEPARTMENTS) {
    for (const nature of natures) {
      for (let start = 0; start <= MAX_START; start += PAGE) {
        const params = new URLSearchParams({ departement: department, natureContrat: nature, range: `${start}-${start + PAGE - 1}` });
        const res = await fetchText(`${API}/offres/search?${params}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        if (res.status === 204) break;
        if (res.status !== 200 && res.status !== 206) throw new Error(`France Travail : recherche refusée (HTTP ${res.status}, ${department}/${nature})`);
        const results = (JSON.parse(res.text) as { resultats?: FtOffer[] }).resultats ?? [];
        await opts.onBatch(results.map(toOffer));
        fetched += results.length;
        const total = Number(res.headers.get('content-range')?.split('/')[1] ?? results.length);
        if (start + PAGE >= total) break;
        if (start + PAGE > MAX_START) truncated.push(`${department}/${nature}`);
        await sleep(250);
      }
    }
    log(`${department} : ${fetched} offres lues au total`);
  }
  return { fetched, truncated };
}
