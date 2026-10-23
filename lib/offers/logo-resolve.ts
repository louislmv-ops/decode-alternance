// Retrouver le logo d'une entreprise à partir de son seul nom, gratuitement :
// 1. Wikidata : pour les entreprises connues, le logo officiel (Wikimedia Commons, rendu en 256 px)
//    ou le site officiel. On n'accepte un résultat que si son nom correspond vraiment.
// 2. Sinon, on essaie le domaine évident (nom.fr, nom.com) et on ne le garde que si la page
//    d'accueil porte bien ce nom.
// Le résultat (même négatif) est gardé en mémoire 7 jours. Mieux vaut l'initiale qu'un mauvais logo.

import { USER_AGENT } from './connectors/http';
import { domainOf } from './logo';
import { normalizeText } from './normalize';

export type LogoTarget = { kind: 'image'; url: string } | { kind: 'domain'; domain: string } | null;

const WEEK = 7 * 24 * 3_600_000;
const cache = new Map<string, { until: number; value: LogoTarget }>();

const wikidata = () => process.env.WIKIDATA_API_URL || 'https://www.wikidata.org/w/api.php';
const commons = () => process.env.COMMONS_FILE_URL || 'https://commons.wikimedia.org/wiki/Special:FilePath';

const LEGAL = /\b(sas|sasu|sa|sarl|eurl|snc|sci|scop|se|groupe|group|holding|france|societe|ste|ets|etablissements|et cie|cie)\b/g;

/** « GROUPE ORVANE SAS » devient « orvane ». */
export function coreName(name: string): string {
  return normalizeText(name).replace(LEGAL, ' ').replace(/\s+/g, ' ').trim();
}

/** Le même nom, à l'accent et à la forme juridique près. */
export function sameName(a: string, b: string): boolean {
  const x = coreName(a);
  const y = coreName(b);
  return x.length >= 2 && (x === y || x.replace(/ /g, '') === y.replace(/ /g, ''));
}

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
  return res.ok ? ((await res.json()) as T) : null;
}

interface WdClaim {
  mainsnak?: { datavalue?: { value?: unknown } };
}
interface WdEntity {
  labels?: Record<string, { value: string }>;
  aliases?: Record<string, { value: string }[]>;
  claims?: Record<string, WdClaim[]>;
}

const claimValue = (e: WdEntity, prop: string) => e.claims?.[prop]?.[0]?.mainsnak?.datavalue?.value;

async function fromWikidata(name: string): Promise<LogoTarget> {
  const search = await getJson<{ search?: { id: string }[] }>(
    `${wikidata()}?action=wbsearchentities&format=json&language=fr&uselang=fr&type=item&limit=5&search=${encodeURIComponent(name)}`,
  );
  const ids = (search?.search ?? []).map((s) => s.id).slice(0, 5);
  if (ids.length === 0) return null;
  const data = await getJson<{ entities?: Record<string, WdEntity> }>(
    `${wikidata()}?action=wbgetentities&format=json&props=labels|aliases|claims&languages=fr|en&ids=${ids.join('|')}`,
  );
  for (const id of ids) {
    const e = data?.entities?.[id];
    if (!e) continue;
    const names = [...Object.values(e.labels ?? {}).map((l) => l.value), ...Object.values(e.aliases ?? {}).flat().map((a) => a.value)];
    if (!names.some((n) => sameName(n, name))) continue;
    // Une personne porte un nom, pas un logo : on écarte les humains (P31 = Q5).
    if (e.claims?.P31?.some((c) => (c.mainsnak?.datavalue?.value as { id?: string } | undefined)?.id === 'Q5')) continue;
    const logo = claimValue(e, 'P154');
    if (typeof logo === 'string' && logo) return { kind: 'image', url: `${commons()}/${encodeURIComponent(logo.replace(/ /g, '_'))}?width=256` };
    const site = domainOf(typeof claimValue(e, 'P856') === 'string' ? (claimValue(e, 'P856') as string) : null);
    if (site) return { kind: 'domain', domain: site };
  }
  return null;
}

/** Le titre ou le nom de site d'une page d'accueil, pour vérifier qu'elle est bien celle de l'entreprise. */
export function pageNames(html: string): string[] {
  const out: string[] = [];
  const title = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1];
  if (title) out.push(title);
  const site = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']{1,120})["']/i)?.[1];
  if (site) out.push(site);
  return out;
}

async function fromGuessedDomain(name: string): Promise<LogoTarget> {
  const core = coreName(name).replace(/ /g, '');
  if (!/^[a-z0-9]{3,40}$/.test(core)) return null;
  const word = coreName(name).split(' ').find((w) => w.length >= 3) ?? core;
  for (const domain of [`${core}.fr`, `${core}.com`]) {
    try {
      const res = await fetch(`${process.env.LOGO_GUESS_SCHEME || 'https'}://${domain}`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
        signal: AbortSignal.timeout(4000),
        redirect: 'follow',
      });
      if (!res.ok) continue;
      const html = (await res.text()).slice(0, 200_000);
      if (pageNames(html).some((n) => normalizeText(n).includes(word))) return { kind: 'domain', domain };
    } catch {
      // Domaine inexistant ou trop lent : on passe au suivant.
    }
  }
  return null;
}

export async function resolveLogo(name: string): Promise<LogoTarget> {
  const key = coreName(name);
  if (key.length < 2) return null;
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.value;
  let value: LogoTarget = null;
  try {
    value = (await fromWikidata(name)) ?? (await fromGuessedDomain(name));
  } catch {
    value = null;
  }
  if (cache.size > 5000) cache.clear();
  cache.set(key, { until: Date.now() + WEEK, value });
  return value;
}
