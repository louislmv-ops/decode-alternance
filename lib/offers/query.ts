// Ce que les gens tapent n'est pas ce que les annonces écrivent : « dev » pour « développeur »,
// « RH » pour « ressources humaines », « compta » pour « comptable ». La recherche cherche aussi
// les mots des annonces. Les accents ne comptent pas (voir decode_fold dans db/schema.sql).

import { normalizeText } from './normalize';

/** Un mot ou une expression tapée (sans accents) → les formes que l'on trouve dans les annonces. La première sert aux API. */
const SYNONYMS: Record<string, string[]> = {
  dev: ['développeur', 'développement'],
  developpeur: ['développeur', 'développement', 'developer'],
  developer: ['développeur', 'developer'],
  rh: ['ressources humaines', 'RH'],
  drh: ['ressources humaines', 'RH'],
  compta: ['comptable', 'comptabilité'],
  comptable: ['comptable', 'comptabilité'],
  comptabilite: ['comptable', 'comptabilité'],
  commercial: ['commercial', 'business developer', 'chargé d’affaires'],
  vente: ['vente', 'commercial', 'vendeur'],
  bizdev: ['business developer', 'développement commercial'],
  marketing: ['marketing'],
  com: ['communication'],
  cm: ['community manager', 'réseaux sociaux'],
  'community manager': ['community manager', 'réseaux sociaux'],
  data: ['data', 'données'],
  'data analyst': ['data analyst', 'analyste de données'],
  ia: ['intelligence artificielle', 'IA'],
  ai: ['intelligence artificielle', 'IA'],
  cyber: ['cybersécurité', 'sécurité informatique'],
  cybersecurite: ['cybersécurité', 'sécurité informatique'],
  ux: ['UX', 'UI', 'designer'],
  ui: ['UI', 'UX', 'designer'],
  graphiste: ['graphiste', 'graphisme', 'designer graphique'],
  btp: ['bâtiment', 'BTP', 'travaux'],
  logistique: ['logistique', 'supply chain'],
  'supply chain': ['supply chain', 'logistique'],
  achat: ['acheteur', 'achats'],
  achats: ['acheteur', 'achats'],
  juriste: ['juriste', 'juridique'],
  juridique: ['juriste', 'juridique'],
  finance: ['finance', 'financier', 'contrôle de gestion'],
  'chef de projet': ['chef de projet', 'chargé de projet', 'project manager'],
  pm: ['chef de projet', 'project manager', 'product manager'],
  po: ['product owner'],
  immo: ['immobilier'],
  resto: ['restauration'],
};

/** Les variantes à chercher pour une saisie : la saisie elle-même, puis les mots des annonces. */
export function expandQuery(q: string | undefined): string[] {
  const raw = (q ?? '').trim();
  if (!raw) return [];
  const key = normalizeText(raw);
  const forms = SYNONYMS[key];
  if (!forms) return [raw];
  // La saisie d'abord, sans doublon (« marketing » ne se répète pas).
  return [raw, ...forms].filter((v, i, all) => all.findIndex((x) => normalizeText(x) === normalizeText(v)) === i);
}

/** Pour les sources qui ne prennent qu'une recherche (France Travail, agrégateurs) : la forme la plus courante dans les annonces. */
export function canonicalQuery(q: string | undefined): string | undefined {
  if (!q?.trim()) return q;
  return SYNONYMS[normalizeText(q)]?.[0] ?? q;
}

/**
 * Le texte correspond-il à la saisie ? Une des variantes doit avoir tous ses mots au début d'un mot du texte :
 * « dev » trouve « développeur », mais « rh » ne trouve plus « Rhône ».
 */
export function matchesQuery(text: string, q: string | undefined): boolean {
  const variants = expandQuery(q);
  if (variants.length === 0) return true;
  const hay = ` ${normalizeText(text)}`;
  return variants.some((v) => {
    const words = normalizeText(v).split(' ').filter(Boolean);
    return words.every((w) => (w.length <= 3 ? new RegExp(` ${w}( |$)`).test(hay) : hay.includes(` ${w}`)));
  });
}
