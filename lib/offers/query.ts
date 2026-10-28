// Ce que les gens tapent n'est pas ce que les annonces écrivent : « dev » pour « développeur »,
// « RH » pour « ressources humaines », « digital » pour « numérique ». La recherche découpe la saisie en
// mots, retire les mots vides (« de », « en alternance »), et cherche chaque mot ou l'un de ses synonymes,
// dans l'intitulé et dans le texte de l'annonce. Les accents ne comptent pas (voir decode_fold dans db/schema.sql).

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
  // Les mots qui s'écrivent de plusieurs façons dans les annonces.
  digital: ['digital', 'numérique'],
  digitale: ['digital', 'numérique'],
  numerique: ['numérique', 'digital'],
  consultant: ['consultant', 'conseil', 'consulting'],
  consultante: ['consultant', 'conseil', 'consulting'],
  conseil: ['conseil', 'consultant', 'consulting'],
  consulting: ['consulting', 'conseil', 'consultant'],
  'transformation digitale': ['transformation digitale', 'transformation numérique', 'digital transformation'],
  'transformation numerique': ['transformation numérique', 'transformation digitale', 'digital transformation'],
  'ressources humaines': ['ressources humaines', 'RH'],
  'business developer': ['business developer', 'développement commercial', 'commercial'],
  'service client': ['service client', 'relation client', 'conseiller client'],
  'relation client': ['relation client', 'service client', 'conseiller client'],
  informatique: ['informatique', 'IT'],
  it: ['informatique', 'IT'],
  web: ['web', 'site internet'],
  vendeur: ['vendeur', 'vendeuse', 'conseiller de vente'],
  vendeuse: ['vendeuse', 'vendeur', 'conseiller de vente'],
  cuisinier: ['cuisinier', 'cuisine', 'commis'],
  mecanicien: ['mécanicien', 'mécanique', 'maintenance'],
  electricien: ['électricien', 'électricité'],
  infirmier: ['infirmier', 'infirmière'],
  banque: ['banque', 'bancaire', 'conseiller clientèle'],
  assurance: ['assurance', 'assurances'],
  audit: ['audit', 'auditeur'],
  evenementiel: ['événementiel', 'événement', 'event'],
};

/** Les mots qui ne disent rien de l'offre cherchée : toutes les offres du site sont en alternance. */
const STOPWORDS = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'un', 'une', 'et', 'en', 'a', 'au', 'aux', 'pour', 'chez', 'dans', 'sur', 'avec',
  'ou', 'par', 'h', 'f', 'hf', 'x', 'alternance', 'alternant', 'alternante', 'apprenti', 'apprentie', 'apprentissage', 'contrat',
  'professionnalisation', 'offre', 'offres', 'poste', 'job', 'emploi', 'cherche', 'recherche',
]);

/** Les expressions de plusieurs mots à garder ensemble (« chef de projet », « transformation digitale »). */
const PHRASES = Object.keys(SYNONYMS)
  .filter((k) => k.includes(' '))
  .sort((a, b) => b.split(' ').length - a.split(' ').length);

const dedupe = (forms: string[]) => forms.filter((v, i, all) => all.findIndex((x) => normalizeText(x) === normalizeText(v)) === i);

/** Les variantes à chercher pour une saisie entière : la saisie elle-même, puis les mots des annonces. */
export function expandQuery(q: string | undefined): string[] {
  const raw = (q ?? '').trim();
  if (!raw) return [];
  const forms = SYNONYMS[normalizeText(raw)];
  // La saisie d'abord, sans doublon (« marketing » ne se répète pas).
  return forms ? dedupe([raw, ...forms]) : [raw];
}

/**
 * La saisie découpée en termes : chaque terme est une liste de variantes, dont une au moins doit se trouver dans
 * l'annonce. « consultant transformation digitale » donne deux termes : [consultant, conseil, consulting] et
 * [transformation digitale, transformation numérique, digital transformation].
 */
export function queryTerms(q: string | undefined): string[][] {
  const text = normalizeText(q ?? '');
  if (!text) return [];
  if (SYNONYMS[text]) return [expandQuery(text)];
  const words = text.split(' ');
  const terms: string[][] = [];
  for (let i = 0; i < words.length; ) {
    const phrase = PHRASES.find((p) => {
      const parts = p.split(' ');
      return parts.every((part, j) => words[i + j] === part);
    });
    if (phrase) {
      terms.push(expandQuery(phrase));
      i += phrase.split(' ').length;
      continue;
    }
    const word = words[i]!;
    i += 1;
    if (STOPWORDS.has(word) || word.length < 2) continue;
    terms.push(SYNONYMS[word] ? dedupe([word, ...SYNONYMS[word]]) : [word]);
  }
  return terms;
}

/** Pour les sources qui ne prennent qu'une recherche (France Travail, agrégateurs) : la forme la plus courante dans les annonces. */
export function canonicalQuery(q: string | undefined): string | undefined {
  if (!q?.trim()) return q;
  const whole = SYNONYMS[normalizeText(q)]?.[0];
  if (whole) return whole;
  // Sans les mots vides : « alternance consultant digital » se cherche « consultant digital ».
  const terms = queryTerms(q);
  return terms.length ? terms.map((t) => t[0]).join(' ') : q;
}

/** Les mots d'une variante, sans mots vides. Les mots courts doivent être entiers, les autres peuvent commencer un mot. */
function variantWords(variant: string): string[] {
  return normalizeText(variant)
    .split(' ')
    .filter((w) => w && !STOPWORDS.has(w));
}

/**
 * La requête Postgres (to_tsquery) d'une liste de termes : chaque terme est un « ou » de ses variantes, les termes
 * sont liés par `op`. Uniquement des lettres et des chiffres : la saisie ne peut pas casser la syntaxe.
 */
export function tsQueryText(terms: string[][], op: '&' | '|'): string | null {
  const parts = terms
    .map((variants) => {
      const options = variants
        .map((v) => variantWords(v).map((w) => w.replace(/[^a-z0-9]/g, '')).filter(Boolean))
        .filter((ws) => ws.length > 0)
        .map((ws) => ws.map((w) => (w.length <= 3 ? w : `${w}:*`)).join(' & '));
      return options.length ? `(${options.map((o) => `(${o})`).join(' | ')})` : null;
    })
    .filter((p): p is string => p !== null);
  return parts.length ? parts.join(` ${op} `) : null;
}

/**
 * Le texte correspond-il à la saisie ? Chaque terme doit avoir une variante dont tous les mots commencent un mot du
 * texte : « dev » trouve « développeur », mais « rh » ne trouve plus « Rhône ».
 */
export function matchesQuery(text: string, q: string | undefined): boolean {
  const terms = queryTerms(q);
  if (terms.length === 0) return true;
  const hay = ` ${normalizeText(text)}`;
  return terms.every((variants) =>
    variants.some((v) => {
      const words = variantWords(v);
      return words.length > 0 && words.every((w) => (w.length <= 3 ? new RegExp(` ${w}( |$)`).test(hay) : hay.includes(` ${w}`)));
    }),
  );
}
