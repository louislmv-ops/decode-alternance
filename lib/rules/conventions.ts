// Les conventions collectives les plus courantes chez les employeurs d'alternants, par IDCC.
// Une convention peut prévoir un salaire d'apprenti plus élevé que le minimum légal : on la nomme
// pour que l'alternant sache quoi vérifier. Une convention absente de cette liste s'affiche par son numéro.

export const CONVENTION_NAMES: Record<string, string> = {
  '0016': 'Transports routiers',
  '0044': 'Industries chimiques',
  '0086': 'Publicité',
  '0573': 'Commerces de gros',
  '0787': 'Cabinets d’experts-comptables',
  '0843': 'Boulangerie-pâtisserie artisanale',
  '1090': 'Services de l’automobile',
  '1486': 'Bureaux d’études techniques (Syntec)',
  '1501': 'Restauration rapide',
  '1517': 'Commerces de détail non alimentaires',
  '1527': 'Immobilier',
  '1597': 'Bâtiment, ouvriers (plus de 10 salariés)',
  '1606': 'Bricolage',
  '1672': 'Sociétés d’assurances',
  '1979': 'Hôtels, cafés, restaurants',
  '1996': 'Pharmacie d’officine',
  '2098': 'Prestataires de services du secteur tertiaire',
  '2120': 'Banque',
  '2216': 'Commerce de détail et de gros à prédominance alimentaire',
  '2264': 'Hospitalisation privée',
  '2511': 'Sport',
  '2609': 'Bâtiment, ETAM',
  '3043': 'Entreprises de propreté',
  '3248': 'Métallurgie',
};

export function conventionLink(idcc: string): string {
  return `https://code.travail.gouv.fr/recherche?q=${encodeURIComponent(`IDCC ${idcc}`)}`;
}
