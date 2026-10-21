// Valeurs légales utilisées par les calculs. Chacune porte sa date et sa source :
// quand un texte change, on met à jour ce fichier et rien d'autre.

export const SMIC = {
  /** SMIC horaire brut en centimes. */
  hourlyCents: 1231,
  /** SMIC mensuel brut pour 35 h (151,67 h), en centimes. */
  monthlyCents: 186_702,
  since: '2026-06-01',
  source: 'Arrêté du 22 mai 2026, JO du 24 mai 2026 (revalorisation automatique de 2,41 %)',
} as const;

/**
 * Apprentissage : pourcentage du SMIC selon l'âge au début du contrat et l'année d'exécution
 * (article D6222-26 du Code du travail). Dès 21 ans, le minimum conventionnel s'applique s'il est plus élevé.
 */
export const APPRENTISSAGE_RATES = [
  { minAge: 0, maxAge: 17, label: 'Moins de 18 ans', byYear: [27, 39, 55] },
  { minAge: 18, maxAge: 20, label: '18 à 20 ans', byYear: [43, 51, 67] },
  { minAge: 21, maxAge: 25, label: '21 à 25 ans', byYear: [53, 61, 78] },
  { minAge: 26, maxAge: 120, label: '26 ans et plus', byYear: [100, 100, 100] },
] as const;

/**
 * Contrat de professionnalisation (articles L6325-8 et D6325-15) : le taux dépend de l'âge et du
 * niveau déjà atteint (au moins bac pro ou titre de même niveau).
 */
export const PROFESSIONNALISATION_RATES = [
  { minAge: 0, maxAge: 20, label: 'Moins de 21 ans', base: 55, withBac: 65 },
  { minAge: 21, maxAge: 25, label: '21 à 25 ans', base: 70, withBac: 80 },
  { minAge: 26, maxAge: 120, label: '26 ans et plus', base: 100, withBac: 100 },
] as const;

/** Sous ce seuil (50 % du SMIC), le salaire de l'apprenti est exonéré de cotisations salariales et de CSG-CRDS. */
export const APPRENTI_EXEMPTION_SHARE = 0.5;
export const APPRENTI_EXEMPTION_SOURCE = 'Décret n° 2025-290 (seuil abaissé de 79 % à 50 % du SMIC en 2025)';

/**
 * Aides de l'État à l'employeur pour la première année d'un contrat d'apprentissage conclu
 * à partir du 8 mars 2026 et commencé avant le 1er janvier 2027.
 * Montants maximaux, en centimes, selon la taille de l'entreprise et le niveau du diplôme préparé.
 */
export const EMPLOYER_AID_2026 = {
  source: 'Décret n° 2026-168 du 6 mars 2026 ; aide unique pour les niveaux 3 et 4 dans les entreprises de moins de 250 salariés',
  validFrom: '2026-03-08',
  validUntil: '2026-12-31',
  under250: { level3to4: 500_000, level5: 450_000, level6to7: 200_000 },
  from250: { level3to4: 200_000, level5: 150_000, level6to7: 75_000 },
  disabledWorker: 600_000,
} as const;

/** Participation forfaitaire de l'employeur pour un diplôme de niveau 6 ou 7, contrats conclus depuis le 1er juillet 2025. */
export const EMPLOYER_PARTICIPATION = {
  cents: 75_000,
  since: '2025-07-01',
  source: 'Décrets publiés au JO du 29 juin 2025 sur le financement de l’apprentissage',
} as const;

/** Délai maximal pour trouver un employeur après le début de la formation en CFA (article L6222-12-1). */
export const NO_EMPLOYER_GRACE_MONTHS = 3;
