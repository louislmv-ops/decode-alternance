// Les grands domaines de l'alternance : leur nom affiché, la recherche lancée, et les mots
// qui trahissent ce domaine dans un CV.

export interface Domain {
  label: string;
  query: string;
  words: string[];
}

export const DOMAINS: Domain[] = [
  { label: 'Marketing', query: 'marketing', words: ['marketing', 'brand', 'growth', 'seo', 'sea', 'acquisition', 'chef de produit'] },
  { label: 'Commerce', query: 'commercial', words: ['commercial', 'vente', 'vendeur', 'business developer', 'negociation', 'relation client', 'conseiller de vente'] },
  { label: 'Développeur', query: 'développeur', words: ['developpeur', 'developpement web', 'javascript', 'typescript', 'python', 'java', 'react', 'full stack', 'fullstack', 'devops'] },
  { label: 'Data', query: 'data', words: ['data', 'donnees', 'sql', 'power bi', 'machine learning', 'statistique'] },
  { label: 'Ressources humaines', query: 'ressources humaines', words: ['ressources humaines', 'rh', 'recrutement', 'paie', 'talent'] },
  { label: 'Comptabilité', query: 'comptable', words: ['comptab', 'controle de gestion', 'audit', 'finance', 'fiscal', 'tresorerie'] },
  { label: 'Communication', query: 'communication', words: ['communication', 'community manager', 'reseaux sociaux', 'evenementiel', 'relations presse', 'graphis'] },
  { label: 'Logistique', query: 'logistique', words: ['logistique', 'supply chain', 'achats', 'approvisionnement', 'transport', 'entrepot'] },
  { label: 'Banque', query: 'banque', words: ['banque', 'bancaire', 'assurance', 'conseiller clientele', 'credit'] },
  { label: 'Industrie', query: 'maintenance', words: ['maintenance', 'electrotechni', 'mecanique', 'production', 'industriel', 'automatisme', 'qualite'] },
  { label: 'BTP', query: 'bâtiment', words: ['btp', 'batiment', 'chantier', 'genie civil', 'travaux', 'electricien', 'plombier'] },
  { label: 'Hôtellerie', query: 'cuisine', words: ['cuisine', 'cuisinier', 'restauration', 'hotellerie', 'serveur', 'boulang', 'patiss'] },
];
