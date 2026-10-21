// Les entreprises du CAC 40 dont on lit le site carrière directement.
//
// La composition de l'indice change chaque trimestre : vérifier la liste sur euronext.com avant de lancer
// une collecte. `careersUrl` est vide tant que l'adresse n'a pas été vérifiée à la main : ouvrir le site,
// confirmer qu'il publie ses offres avec le balisage JobPosting (`pnpm ingest --site <url>` le dit),
// puis renseigner l'adresse. Un site non renseigné est simplement ignoré.

import type { CareerSite } from './connectors/job-posting';

interface Cac40Entry {
  company: string;
  careersUrl: string | null;
}

export const CAC40: Cac40Entry[] = [
  { company: 'Accor', careersUrl: null },
  { company: 'Air Liquide', careersUrl: null },
  { company: 'Airbus', careersUrl: null },
  { company: 'ArcelorMittal', careersUrl: null },
  { company: 'AXA', careersUrl: null },
  { company: 'BNP Paribas', careersUrl: null },
  { company: 'Bouygues', careersUrl: null },
  { company: 'Bureau Veritas', careersUrl: null },
  { company: 'Capgemini', careersUrl: null },
  { company: 'Carrefour', careersUrl: null },
  { company: 'Crédit Agricole', careersUrl: null },
  { company: 'Danone', careersUrl: null },
  { company: 'Dassault Systèmes', careersUrl: null },
  { company: 'Edenred', careersUrl: null },
  { company: 'Engie', careersUrl: null },
  { company: 'EssilorLuxottica', careersUrl: null },
  { company: 'Eurofins Scientific', careersUrl: null },
  { company: 'Hermès', careersUrl: null },
  { company: 'Kering', careersUrl: null },
  { company: 'Legrand', careersUrl: null },
  { company: 'L’Oréal', careersUrl: null },
  { company: 'LVMH', careersUrl: null },
  { company: 'Michelin', careersUrl: null },
  { company: 'Orange', careersUrl: null },
  { company: 'Pernod Ricard', careersUrl: null },
  { company: 'Publicis', careersUrl: null },
  { company: 'Renault', careersUrl: null },
  { company: 'Safran', careersUrl: null },
  { company: 'Saint-Gobain', careersUrl: null },
  { company: 'Sanofi', careersUrl: null },
  { company: 'Schneider Electric', careersUrl: null },
  { company: 'Société Générale', careersUrl: null },
  { company: 'Stellantis', careersUrl: null },
  { company: 'STMicroelectronics', careersUrl: null },
  { company: 'Thales', careersUrl: null },
  { company: 'TotalEnergies', careersUrl: null },
  { company: 'Unibail-Rodamco-Westfield', careersUrl: null },
  { company: 'Veolia', careersUrl: null },
  { company: 'Vinci', careersUrl: null },
];

/** Les sites prêts à être lus : ceux dont l'adresse a été vérifiée. */
export function careerSites(): CareerSite[] {
  return CAC40.filter((c): c is Cac40Entry & { careersUrl: string } => Boolean(c.careersUrl)).map((c) => ({
    company: c.company,
    careersUrl: c.careersUrl,
    size: 'grande',
  }));
}
