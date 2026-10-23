// Les secteurs, d'après le code ROME du métier (France Travail, La bonne alternance) : sa lettre
// donne le grand domaine. L'informatique (M18) est mise à part, tant elle recrute d'alternants.

export const SECTORS = [
  { code: 'M18', label: 'Informatique, numérique' },
  { code: 'M', label: 'Gestion, RH, finance, juridique' },
  { code: 'D', label: 'Commerce, vente' },
  { code: 'E', label: 'Communication, médias' },
  { code: 'C', label: 'Banque, assurance, immobilier' },
  { code: 'H', label: 'Industrie' },
  { code: 'I', label: 'Maintenance, installation' },
  { code: 'F', label: 'BTP, construction' },
  { code: 'N', label: 'Transport, logistique' },
  { code: 'G', label: 'Hôtellerie, restauration, tourisme' },
  { code: 'J', label: 'Santé' },
  { code: 'K', label: 'Social, services, enseignement' },
  { code: 'A', label: 'Agriculture, environnement' },
  { code: 'B', label: 'Artisanat d’art' },
  { code: 'L', label: 'Spectacle' },
] as const;

export const SECTOR_CODES: string[] = SECTORS.map((s) => s.code);

/** Le secteur d'un code ROME (« M1805 » donne « M18 », « D1402 » donne « D »). */
export function sectorOf(rome: string | null | undefined): string | null {
  if (!rome || !/^[A-N]\d{4}$/.test(rome)) return null;
  return rome.startsWith('M18') ? 'M18' : rome[0]!;
}
