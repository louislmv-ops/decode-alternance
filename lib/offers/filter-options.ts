// Les choix proposés dans les filtres, en simples données : le panneau des filtres s'affiche
// dans le navigateur et n'a pas besoin du reste de la logique des offres.

/** Les seuils proposés pour le salaire annoncé, en euros bruts par mois. */
export const MIN_SALARIES = [1000, 1200, 1400, 1600, 1800];

export interface SkillOption {
  /** Dans l'adresse : « ?competence=power-bi ». */
  slug: string;
  label: string;
  /** Lu sur le texte normalisé (minuscules, sans accents), entre limites de mots. */
  pattern: string;
}

/** Les compétences qui reviennent le plus dans les offres d'alternance, outils compris. */
export const SKILL_OPTIONS: SkillOption[] = [
  { slug: 'excel', label: 'Excel', pattern: 'excel' },
  { slug: 'sql', label: 'SQL', pattern: 'sql|mysql|postgresql' },
  { slug: 'python', label: 'Python', pattern: 'python' },
  { slug: 'power-bi', label: 'Power BI', pattern: 'power bi|powerbi' },
  { slug: 'javascript', label: 'JavaScript / TypeScript', pattern: 'javascript|js|typescript' },
  { slug: 'react', label: 'React', pattern: 'react|reactjs|react js' },
  { slug: 'java', label: 'Java', pattern: 'java' },
  { slug: 'php', label: 'PHP', pattern: 'php|symfony|laravel' },
  { slug: 'cloud', label: 'Cloud (AWS, Azure, GCP)', pattern: 'aws|azure|gcp|google cloud' },
  { slug: 'devops', label: 'DevOps', pattern: 'devops|docker|kubernetes' },
  { slug: 'cybersecurite', label: 'Cybersécurité', pattern: 'cybersecurite|securite informatique|soc' },
  { slug: 'sap', label: 'SAP', pattern: 'sap' },
  { slug: 'salesforce', label: 'Salesforce', pattern: 'salesforce' },
  { slug: 'crm', label: 'CRM', pattern: 'crm|hubspot' },
  { slug: 'figma', label: 'Figma', pattern: 'figma' },
  { slug: 'adobe', label: 'Suite Adobe', pattern: 'adobe|photoshop|illustrator|indesign|premiere pro' },
  { slug: 'canva', label: 'Canva', pattern: 'canva' },
  { slug: 'seo', label: 'SEO / SEA', pattern: 'seo|sea|referencement' },
  { slug: 'reseaux-sociaux', label: 'Réseaux sociaux', pattern: 'reseaux sociaux|community management|social media' },
  { slug: 'google-analytics', label: 'Google Analytics', pattern: 'google analytics|ga4' },
  { slug: 'autocad', label: 'AutoCAD', pattern: 'autocad' },
  { slug: 'solidworks', label: 'SolidWorks', pattern: 'solidworks' },
  { slug: 'anglais', label: 'Anglais', pattern: 'anglais courant|anglais professionnel|bon niveau d anglais|niveau d anglais|anglais (b2|c1)|english|bilingue anglais' },
  { slug: 'permis-b', label: 'Permis B', pattern: 'permis b' },
];
