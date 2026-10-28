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

// Les aides à l'employeur et la participation à la formation sont dans employer-aids.ts.

/** Délai maximal pour trouver un employeur après le début de la formation en CFA (article L6222-12-1). */
export const NO_EMPLOYER_GRACE_MONTHS = 3;
