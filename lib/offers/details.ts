// Ce que les annonces disent en passant et que les sources ne rangent dans aucun champ :
// le télétravail et les compétences demandées. Lu dans le texte, sans IA, pour pouvoir filtrer.
// Une annonce qui n'en parle pas reste « inconnue » : elle ne passe pas un filtre qui le demande.

import { SKILL_OPTIONS } from './filter-options';
import { normalizeText } from './normalize';
import type { Offer } from './types';

export type RemotePolicy = 'aucun' | 'partiel' | 'total';

export const REMOTE_LABELS: Record<RemotePolicy, string> = {
  aucun: 'Sur place',
  partiel: 'Télétravail partiel',
  total: 'Télétravail complet',
};

// Lus sur le texte normalisé (minuscules, sans accents, ponctuation remplacée par des espaces : « 100 % » devient « 100 »).
const REMOTE_TOTAL = /\b(full remote|100 (en )?(teletravail|remote)|teletravail (complet|total|integral|a 100)|entierement (en )?(teletravail|a distance)|poste (en )?(teletravail|remote))\b/;
const REMOTE_NONE = /\b(pas de teletravail|sans teletravail|teletravail (non|impossible|n est pas)|aucun teletravail|(poste|travail) (en|sur) presentiel|100 presentiel)\b/;
const REMOTE_PARTIAL = /\b(teletravail|remote|hybride|travail a distance|home office)\b/;

/** Le télétravail tel que l'annonce le décrit, ou null si elle n'en dit rien. */
export function remoteOf(text: string): RemotePolicy | null {
  const t = normalizeText(text);
  if (REMOTE_NONE.test(t)) return 'aucun';
  if (REMOTE_TOTAL.test(t)) return 'total';
  if (REMOTE_PARTIAL.test(t)) return 'partiel';
  return null;
}

/** Les compétences de SKILL_OPTIONS, prêtes à chercher dans un texte normalisé. */
export const SKILLS = SKILL_OPTIONS.map((o) => ({ ...o, regex: new RegExp(`(^|\\s)(${o.pattern})(\\s|$)`) }));

/** Les compétences citées dans l'annonce, dans l'ordre de la liste. */
export function skillsOf(text: string): string[] {
  const t = ` ${normalizeText(text)} `;
  return SKILLS.filter((s) => s.regex.test(t)).map((s) => s.slug);
}

export function skillLabel(slug: string): string | null {
  return SKILLS.find((s) => s.slug === slug)?.label ?? null;
}

const memo = new WeakMap<object, { remote: RemotePolicy | null; skills: string[] }>();

/** Télétravail et compétences d'une offre : ceux de la base quand elle les a, sinon lus dans le texte (une fois). */
export function detailsOf(o: Pick<Offer, 'title' | 'description'> & Partial<Pick<Offer, 'remote' | 'skills'>>): {
  remote: RemotePolicy | null;
  skills: string[];
} {
  if (o.remote !== undefined && o.skills !== undefined) return { remote: o.remote, skills: o.skills };
  const hit = memo.get(o);
  if (hit) return hit;
  const text = `${o.title}\n${o.description}`;
  const value = { remote: remoteOf(text), skills: skillsOf(text) };
  memo.set(o, value);
  return value;
}
