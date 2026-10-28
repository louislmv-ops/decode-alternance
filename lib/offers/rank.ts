// L'ordre des offres. Par défaut, les plus attirantes d'abord pour un étudiant d'école de commerce ou
// d'ingénieurs : grands groupes, postes qualifiés (bac+3 à bac+5), salaire annoncé, encore fraîches.
// Un poste peu qualifié bien payé (agent de sécurité, auxiliaire de vie…) ne passe pas devant un poste
// de chef de projet dans un grand groupe : le salaire compte moins que la porte qu'ouvre l'alternance.
// Une offre d'il y a un mois passe derrière une offre correcte du jour.

import { SMIC } from '@/lib/rules/reference';
import { CAC40, CAC40_FOLDED, cac40Group, isCac40 } from './companies';
import { companyKey, normalizeText } from './normalize';
import type { Offer } from './types';

export type OfferSort = 'top' | 'recent' | 'salary' | 'reviews';

export const SORT_OPTIONS: { value: OfferSort; label: string }[] = [
  { value: 'top', label: 'Les plus attirantes' },
  { value: 'recent', label: 'Les plus récentes' },
  { value: 'salary', label: 'Salaire annoncé le plus haut' },
  { value: 'reviews', label: 'Entreprises les mieux notées' },
];

/** La note moyenne des avis d'alternants sur l'employeur d'une offre, quand il y en a assez. */
export type RatingOf = (o: Pick<Offer, 'company' | 'companySiren'>) => number | null;

/** Intitulés de postes qualifiés, recherchés et souvent mieux payés. */
export const STRONG_ROLE =
  /\b(ingenieur|chef de projet|charge d affaires|business develop\w*|data|developpeur|consultant|audit\w*|analyste|controleur de gestion|product|juriste|finance|cybersecurite|architecte|achats?|ressources humaines)\b/;

/**
 * Postes peu qualifiés ou d'exécution : honorables, mais pas ceux qui font rêver un étudiant de bac+3 à bac+5.
 * Ils restent listés et cherchables, simplement jamais en tête ni en pépite.
 */
export const LOW_ROLE =
  /\b(auxiliaire de vie|aide a domicile|assistante? de vie|aide soignante?|agente? de (securite|surete|entretien|proprete|service|production|quai|accueil)|desosseu\w*|pareu\w*|boucher|bouchere|boulanger\w*|patissier\w*|preparat\w* de commandes?|cariste|manutention\w*|serveur|serveuse|commis|equipier\w*|employee? (polyvalente?|commerciale?|libre service|de rayon|logistique)|hote(sse)? de caisse|caissier\w*|vendeu\w*|conseill\w* de vente|chauffeur\w*|livreu\w*|magasinier\w*|plombier|electricien\w*|macon|peintre|coiffeu\w*|estheticien\w*|mecanicien\w*|carrossier|cuisinier\w*|operat\w* de production|ouvrier\w*|menuisier|soudeu\w*|technicien\w* de maintenance)\b/;

/** Un poste qui vise un bac+3 à bac+5 : niveau demandé ou intitulé qualifié, et pas un poste d'exécution. */
export function isQualifiedRole(o: Pick<Offer, 'title' | 'diplomaLevel'>): boolean {
  const t = normalizeText(o.title);
  if (LOW_ROLE.test(t)) return false;
  return (o.diplomaLevel !== null && o.diplomaLevel >= 6) || STRONG_ROLE.test(t);
}

const SIZE_POINTS = { grande: 3, eti: 1.5, pme: 0.3, tpe: 0 } as const;

export function attractiveness(
  o: Pick<Offer, 'salaryMonthlyCents' | 'companySize' | 'company' | 'diplomaLevel' | 'title' | 'direct' | 'publishedAt' | 'schoolFlags'>,
  now = Date.now(),
): number {
  let score = 0;
  const title = normalizeText(o.title);
  const low = LOW_ROLE.test(title);
  // Payé au SMIC, c'est déjà beaucoup pour une alternance : 4 points ; au minimum d'un 18 ans, aucun.
  // Pour un poste d'exécution, le salaire ne vaut qu'un point : il ne doit pas faire passer l'offre devant.
  if (o.salaryMonthlyCents !== null) score += Math.min(low ? 1 : 4, Math.max(0, (o.salaryMonthlyCents / SMIC.monthlyCents - 0.4) * 6.7));
  if (o.companySize) score += SIZE_POINTS[o.companySize];
  if (isCac40(o.company)) score += o.companySize === 'grande' ? 1.5 : 4.5;
  if (o.diplomaLevel === 7) score += 2.5;
  else if (o.diplomaLevel === 6) score += 1.5;
  else if (o.diplomaLevel === 5) score += 0.3;
  if (STRONG_ROLE.test(title)) score += 1.5;
  if (low) score -= 3;
  if (o.direct) score += 0.5;
  const days = Math.max(0, (now - Date.parse(o.publishedAt)) / 86_400_000);
  score -= Math.min(3, days / 10);
  if (o.schoolFlags.length > 0) score -= 10;
  return score;
}

/**
 * Trie les offres. Salaire et avis : les offres sans montant ou sans note passent après les autres,
 * elles-mêmes rangées des plus attirantes aux moins attirantes. « Les plus attirantes » applique en plus
 * le plafond par employeur sur chaque page de `pageSize` offres (capPerEmployer).
 */
export function sortOffers<T extends Offer>(offers: T[], sort: OfferSort = 'top', ratingOf?: RatingOf, pageSize = 20): T[] {
  if (sort === 'top') return capPerEmployer(rankOffers(offers, sort, ratingOf), EMPLOYER_CAP.perPage, pageSize);
  return rankOffers(offers, sort, ratingOf);
}

function rankOffers<T extends Offer>(offers: T[], sort: OfferSort, ratingOf?: RatingOf): T[] {
  if (sort === 'recent') return [...offers].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const now = Date.now();
  const key = (o: T): number | null =>
    sort === 'salary' ? o.salaryMonthlyCents : sort === 'reviews' ? (ratingOf?.(o) ?? null) : attractiveness(o, now);
  const scored = offers.map((o) => ({ o, k: key(o), s: attractiveness(o, now) }));
  return scored
    .sort((a, b) => {
      if (a.k !== b.k) {
        if (a.k === null) return 1;
        if (b.k === null) return -1;
        return b.k - a.k;
      }
      return b.s - a.s || b.o.publishedAt.localeCompare(a.o.publishedAt);
    })
    .map((x) => x.o);
}

/**
 * Les `head` premières offres viennent d'entreprises différentes : une offre d'une entreprise déjà présente
 * cède sa place à la suivante d'une autre entreprise, puis revient juste après. L'ordre reste sinon le même.
 */
export function diversify<T extends Pick<Offer, 'company'>>(offers: T[], head = 5): T[] {
  const top: T[] = [];
  const later: T[] = [];
  const seen = new Set<string>();
  for (const o of offers) {
    const key = o.company ? normalizeText(o.company) : null;
    if (top.length < head && (!key || !seen.has(key))) {
      top.push(o);
      if (key) seen.add(key);
    } else later.push(o);
  }
  return [...top, ...later];
}

/**
 * Plafond par employeur dans le tri « Les plus attirantes » : au plus `perPage` offres d'un même employeur sur
 * chaque page, les suivantes repoussées à la page d'après. Sur l'accueil, une seule offre par employeur.
 * Les offres sponsorisées ont leurs propres règles (lib/sponsors/match.ts) et ne comptent pas ici.
 */
export const EMPLOYER_CAP = { perPage: 2, home: 1 } as const;

/**
 * Range les offres page par page : sur chaque page de `pageSize`, au plus `cap` offres d'un même employeur ;
 * celles qui dépassent passent en tête de la page suivante, dans leur ordre. S'il ne reste pas assez
 * d'employeurs différents pour remplir une page, elle est complétée dans l'ordre, sans laisser de trou.
 * Une offre sans employeur nommé n'est jamais plafonnée.
 */
/** Qui est l'employeur : le groupe pour une filiale du CAC 40 (Capgemini Invent compte comme Capgemini), sinon son nom réduit. */
export function employerKey(company: string | null | undefined): string {
  return cac40Group(company) ?? companyKey(company);
}

export function capPerEmployer<T extends Pick<Offer, 'company'>>(offers: T[], cap: number = EMPLOYER_CAP.perPage, pageSize = 20): T[] {
  const out: T[] = [];
  let queue = offers;
  while (queue.length > 0) {
    const page: T[] = [];
    const rest: T[] = [];
    const counts = new Map<string, number>();
    for (const o of queue) {
      const key = employerKey(o.company);
      const n = key ? (counts.get(key) ?? 0) : 0;
      if (page.length < pageSize && (!key || n < cap)) {
        page.push(o);
        if (key) counts.set(key, n + 1);
      } else rest.push(o);
    }
    while (page.length < pageSize && rest.length > 0) page.push(rest.shift()!);
    out.push(...page);
    queue = rest;
  }
  return out;
}

/** Une seule offre par employeur (l'accueil) : la première de chacun, dans l'ordre. */
export function onePerEmployer<T extends Pick<Offer, 'company'>>(offers: T[], cap: number = EMPLOYER_CAP.home): T[] {
  const counts = new Map<string, number>();
  return offers.filter((o) => {
    const key = employerKey(o.company);
    if (!key) return true;
    const n = counts.get(key) ?? 0;
    counts.set(key, n + 1);
    return n < cap;
  });
}

/**
 * La même clé d'employeur en SQL : le groupe du CAC 40 s'il y en a un, sinon le nom sans forme juridique ni
 * ponctuation ; une offre sans employeur forme son propre groupe (jamais plafonnée).
 */
export const EMPLOYER_KEY_SQL = {
  generic: '\\m(sas|sasu|sa|sarl|se|group|groupe|france|holding|international|services)\\M',
  cac40: `^(${CAC40_FOLDED.join('|')})( |$)`,
};

/** Postgres ne replie pas toujours la casse des lettres accentuées : « SÉCURITÉ » doit aussi correspondre. */
function withUpperAccents(pattern: string): string {
  return pattern.replace(/\[([^\]]*)\]/g, (_, chars: string) => `[${chars}${chars.toUpperCase().replace(/[A-Z-]/g, '')}]`);
}

/** LOW_ROLE pour Postgres (intitulés accentués, recherche insensible à la casse). */
export const LOW_ROLE_SQL = withUpperAccents(
  "auxiliaire de vie|aide [àa] domicile|assistante? de vie|aide.soignante?|agente? de (s[ée]curit[ée]|s[ûu]ret[ée]|entretien|propret[ée]|service|production|quai|accueil)|d[ée]sosseu|pareu|boucher|boulang|p[âa]tissi|pr[ée]parat[a-z]* de commande|cariste|manutention|serveu|commis|[ée]quipi|employ[ée]e? (polyvalent|commercial|libre.service|de rayon|logistique)|h[ôo]te(sse)? de caisse|caissi|vendeu|conseill[a-z]* de vente|chauffeu|livreu|magasini|plombier|[ée]lectricien|ma[çc]on|peintre|coiffeu|esth[ée]ticien|m[ée]canicien|carrossier|cuisini|op[ée]rat[a-z]* de production|ouvri|menuisier|soudeu|technicien[a-z]* de maintenance",
);

/** Les groupes du CAC 40 pour Postgres : le nom de l'employeur commence par celui du groupe. */
export const CAC40_SQL = withUpperAccents(`^(${CAC40.map((c) =>
  c.company
    .toLowerCase()
    .replace(/[’']/g, '.')
    .replace(/[éèêe]/g, '[éèêe]')
    .replace(/[-\s]+/g, '[- ]+'),
).join('|')})( |$)`);

/** STRONG_ROLE pour Postgres, qui compare les intitulés avec leurs accents. */
export const STRONG_ROLE_SQL =
  'ing[ée]nieur|chef de projet|charg[ée] d.affaires|business develop|data|d[ée]veloppeu|consultant|audit|analyste|contr[ôo]leur de gestion|product|juriste|financ|cybers[ée]curit|architecte|achat|ressources humaines';
