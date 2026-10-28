// Les conventions collectives qui paient les alternants plus que le minimum légal, recopiées article par article
// depuis Légifrance (base KALI, via le paquet @socialgouv/kali-data, relevé d'octobre 2026). Chaque grille garde
// l'identifiant de l'article : la fiche affiche le lien, l'alternant peut vérifier lui-même.
// Seuls les articles en vigueur et plus favorables que la loi sont ici ; une grille égale ou inférieure au minimum
// légal (boulangerie, coiffure, particuliers employeurs) n'apporte rien et n'y est pas.
// Les pourcentages s'appliquent au SMIC ; quand le texte dit « ou du salaire minimum conventionnel s'il est
// supérieur », on ne connaît pas ce minimum du poste : le chiffre affiché est un plancher, et la fiche le dit.

import type { DiplomaLevel } from './employer';

export interface ApprenticeBracket {
  minAge: number;
  maxAge: number;
  /** Pourcentage du SMIC en 1re, 2e et 3e année. */
  byYear: readonly [number, number, number];
  /** Niveaux de diplôme préparés concernés (5 = bac+2, 6 = bac+3/4, 7 = bac+5) ; absent : tous. */
  levels?: readonly DiplomaLevel[];
}

export interface ProBracket {
  minAge: number;
  maxAge: number;
  /** Pourcentage du SMIC sans bac pro, puis avec au moins un bac pro (ou titre de même niveau). */
  base: number;
  withBac: number;
}

export interface ConventionGrid {
  idcc: string;
  name: string;
  apprentissage?: { brackets: readonly ApprenticeBracket[]; source: GridSource };
  professionnalisation?: { brackets: readonly ProBracket[]; source: GridSource };
  /** 13 : le minimum est annuel, versé sur 13 mois (banque) ; le chiffre mensuel en tient compte. */
  months?: 12 | 13;
  /** Le texte prévoit aussi un pourcentage du minimum conventionnel du poste, s'il est plus élevé. */
  orConventionMinimum?: boolean;
}

export interface GridSource {
  /** Identifiant Légifrance de l'article (KALIARTI…). */
  article: string;
  /** Le texte qui contient l'article. */
  text: string;
  /** Étendu par arrêté : s'applique à toutes les entreprises de la branche ; sinon aux adhérents des organisations signataires. */
  extended: boolean;
}

export const CONVENTION_GRIDS: readonly ConventionGrid[] = [
  {
    idcc: '3248',
    name: 'Métallurgie',
    apprentissage: {
      brackets: [
        { minAge: 0, maxAge: 17, byYear: [35, 45, 55] },
        { minAge: 18, maxAge: 25, byYear: [55, 65, 80] },
      ],
      source: { article: 'KALIARTI000046314857', text: 'Convention collective nationale de la métallurgie du 7 février 2022, titre X, chapitre 6', extended: true },
    },
    professionnalisation: {
      brackets: [
        { minAge: 0, maxAge: 20, base: 60, withBac: 70 },
        { minAge: 21, maxAge: 25, base: 75, withBac: 85 },
      ],
      source: { article: 'KALIARTI000046314860', text: 'Convention collective nationale de la métallurgie du 7 février 2022, titre X, chapitre 6', extended: true },
    },
  },
  {
    idcc: '0044',
    name: 'Industries chimiques',
    orConventionMinimum: true,
    apprentissage: {
      brackets: [
        { minAge: 0, maxAge: 17, byYear: [35, 45, 55] },
        { minAge: 18, maxAge: 25, byYear: [55, 65, 80] },
      ],
      source: { article: 'KALIARTI000044339860', text: 'Accord du 29 juin 2021 relatif au développement de l’alternance', extended: true },
    },
    professionnalisation: {
      brackets: [
        { minAge: 0, maxAge: 20, base: 57, withBac: 67 },
        { minAge: 21, maxAge: 25, base: 72, withBac: 82 },
      ],
      source: { article: 'KALIARTI000044339877', text: 'Accord du 29 juin 2021 relatif au développement de l’alternance', extended: true },
    },
  },
  {
    idcc: '0292',
    name: 'Plasturgie',
    orConventionMinimum: true,
    apprentissage: {
      brackets: [
        { minAge: 0, maxAge: 17, byYear: [35, 42, 60] },
        { minAge: 18, maxAge: 20, byYear: [45, 54, 75] },
        { minAge: 21, maxAge: 25, byYear: [55, 66, 80] },
      ],
      source: { article: 'KALIARTI000030978015', text: 'Accord du 25 mars 2015 relatif à la formation professionnelle tout au long de la vie', extended: true },
    },
    professionnalisation: {
      // Le texte prévoit encore plus (80 % et 90 %) à partir d'un BTS : on garde le palier du bac pro, plus prudent.
      brackets: [
        { minAge: 0, maxAge: 20, base: 60, withBac: 75 },
        { minAge: 21, maxAge: 25, base: 75, withBac: 85 },
      ],
      source: { article: 'KALIARTI000030978025', text: 'Accord du 25 mars 2015 relatif à la formation professionnelle tout au long de la vie', extended: true },
    },
  },
  {
    idcc: '0176',
    name: 'Industrie pharmaceutique',
    orConventionMinimum: true,
    apprentissage: {
      brackets: [
        { minAge: 0, maxAge: 17, byYear: [35, 45, 55] },
        { minAge: 18, maxAge: 20, byYear: [50, 60, 75] },
        { minAge: 21, maxAge: 25, byYear: [54, 63, 80] },
      ],
      source: { article: 'KALIARTI000044339957', text: 'Accord du 1er juillet 2021 relatif à l’insertion et à l’emploi des jeunes', extended: true },
    },
  },
  {
    idcc: '0016',
    name: 'Transports routiers',
    orConventionMinimum: true,
    apprentissage: {
      brackets: [
        { minAge: 0, maxAge: 17, byYear: [35, 47, 63] },
        { minAge: 18, maxAge: 20, byYear: [51, 59, 75] },
        { minAge: 21, maxAge: 25, byYear: [55, 65, 85] },
      ],
      source: { article: 'KALIARTI000035590612', text: 'Accord du 12 avril 2017 relatif à la formation professionnelle', extended: true },
    },
  },
  {
    idcc: '0573',
    name: 'Commerces de gros',
    orConventionMinimum: true,
    apprentissage: {
      brackets: [
        { minAge: 0, maxAge: 17, byYear: [28, 40, 56] },
        { minAge: 18, maxAge: 20, byYear: [44, 52, 68] },
        { minAge: 21, maxAge: 25, byYear: [54, 62, 79] },
      ],
      source: { article: 'KALIARTI000047537251', text: 'Accord du 24 janvier 2023 relatif à la formation professionnelle tout au long de la vie', extended: true },
    },
  },
  {
    idcc: '1486',
    name: 'Bureaux d’études techniques (Syntec)',
    orConventionMinimum: true,
    apprentissage: {
      // « Niveaux II et III » et « niveau I » de l'ancienne nomenclature : bac+2 à bac+4, puis bac+5.
      brackets: [
        { minAge: 0, maxAge: 17, byYear: [33, 43, 58] },
        { minAge: 18, maxAge: 20, byYear: [43, 53, 68], levels: [5, 6] },
        { minAge: 18, maxAge: 20, byYear: [48, 58, 70], levels: [7] },
        { minAge: 21, maxAge: 25, byYear: [55, 65, 80], levels: [5, 6] },
        { minAge: 21, maxAge: 25, byYear: [65, 75, 80], levels: [7] },
      ],
      source: { article: 'KALIARTI000024683673', text: 'Accord du 28 juin 2011 relatif aux rémunérations minimales des apprentis', extended: true },
    },
  },
  {
    idcc: '2120',
    name: 'Banque',
    months: 13,
    apprentissage: {
      // Les taux légaux, mais sur 13 mois au lieu de 12 ; rien de prévu avant 18 ans.
      brackets: [
        { minAge: 18, maxAge: 20, byYear: [43, 51, 67] },
        { minAge: 21, maxAge: 25, byYear: [53, 61, 78] },
        { minAge: 26, maxAge: 120, byYear: [100, 100, 100] },
      ],
      source: { article: 'KALIARTI000042085664', text: 'Accord du 5 février 2020 relatif à la formation professionnelle', extended: false },
    },
    professionnalisation: {
      brackets: [{ minAge: 0, maxAge: 25, base: 70, withBac: 80 }],
      source: { article: 'KALIARTI000042085671', text: 'Accord du 5 février 2020 relatif à la formation professionnelle', extended: false },
    },
  },
];

/** « 44 », « 0044 » : les IDCC s'écrivent sur quatre chiffres. */
export const normalizeIdcc = (idcc: string): string => idcc.replace(/\D/g, '').padStart(4, '0');

export function gridFor(idcc: string): ConventionGrid | null {
  const code = normalizeIdcc(idcc);
  return CONVENTION_GRIDS.find((g) => g.idcc === code) ?? null;
}

export function legifranceArticle(article: string): string {
  return `https://www.legifrance.gouv.fr/conv_coll/article/${article}`;
}
