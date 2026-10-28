// Lecture d'un CV sans IA, comme le pré-remplissage des grands sites d'emploi : le poste visé (précis, pas
// seulement le domaine), la formation en cours, les compétences, le lieu et l'âge. Ce qui est écrit dans
// l'accroche et l'objectif compte plus que les anciens petits boulots. Ce qui n'est pas sûr reste vide :
// la personne confirme ou corrige dans le questionnaire.

import { DOMAINS } from '@/lib/domains';
import { CITIES } from '@/lib/landing';
import { departmentFromPostalCode, normalizeText } from '@/lib/offers/normalize';
import type { DiplomaLevel } from '@/lib/rules/employer';

export interface CvGuess {
  /** Le poste à chercher, le plus précis possible. */
  job: string | null;
  /** D'autres postes plausibles, à proposer en un clic. */
  jobs?: string[];
  department: string | null;
  city: string | null;
  level: DiplomaLevel | null;
  /** La formation préparée, telle qu'écrite (« BTS MCO », « Bachelor marketing digital »). */
  formation?: string | null;
  skills?: string[];
  age: number | null;
}

/** Les postes courants en alternance : la recherche lancée, et les mots qui les désignent dans un CV (sans accents). */
export const JOB_TITLES: { query: string; words: string[] }[] = [
  { query: 'développeur full stack', words: ['full stack', 'fullstack'] },
  { query: 'développeur front-end', words: ['front end', 'frontend', 'developpeur front'] },
  { query: 'développeur back-end', words: ['back end', 'backend', 'developpeur back'] },
  { query: 'développeur mobile', words: ['developpeur mobile', 'flutter', 'react native', 'swift', 'kotlin'] },
  { query: 'développeur web', words: ['developpeur web', 'developpement web', 'integrateur web'] },
  { query: 'développeur', words: ['developpeur', 'developpement logiciel', 'software engineer', 'ingenieur logiciel'] },
  { query: 'devops', words: ['devops', 'ingenieur cloud', 'sre'] },
  { query: 'cybersécurité', words: ['cybersecurite', 'securite informatique', 'pentest', 'soc analyst'] },
  { query: 'administrateur systèmes et réseaux', words: ['administrateur systeme', 'administrateur reseau', 'systemes et reseaux', 'technicien reseau'] },
  { query: 'technicien informatique', words: ['technicien informatique', 'support informatique', 'helpdesk', 'technicien support'] },
  { query: 'data analyst', words: ['data analyst', 'analyste de donnees', 'business intelligence'] },
  { query: 'data scientist', words: ['data scientist', 'machine learning', 'intelligence artificielle'] },
  { query: 'data engineer', words: ['data engineer', 'ingenieur data'] },
  { query: 'chef de projet digital', words: ['chef de projet digital', 'chef de projet web', 'chef de projet numerique'] },
  { query: 'product owner', words: ['product owner', 'product manager', 'chef de produit digital'] },
  { query: 'UX UI designer', words: ['ux designer', 'ui designer', 'ux ui', 'ui ux', 'product designer'] },
  { query: 'graphiste', words: ['graphiste', 'designer graphique', 'direction artistique', 'infographiste'] },
  { query: 'motion designer', words: ['motion design', 'montage video', 'monteur video'] },
  { query: 'community manager', words: ['community manager', 'social media', 'reseaux sociaux'] },
  { query: 'chargé de communication', words: ['charge de communication', 'chargee de communication', 'assistant communication', 'assistante communication'] },
  { query: 'chargé de marketing digital', words: ['marketing digital', 'webmarketing', 'web marketing', 'marketing numerique'] },
  { query: 'SEO', words: ['seo', 'referencement naturel', 'sea', 'acquisition'] },
  { query: 'chef de produit', words: ['chef de produit', 'assistant chef de produit', 'product marketing'] },
  { query: 'chargé de marketing', words: ['charge de marketing', 'chargee de marketing', 'assistant marketing', 'assistante marketing', 'marketing operationnel'] },
  { query: 'chargé d’événementiel', words: ['evenementiel', 'chef de projet evenementiel'] },
  { query: 'attaché de presse', words: ['relations presse', 'attache de presse', 'attachee de presse'] },
  { query: 'business developer', words: ['business developer', 'business development', 'bizdev', 'developpement commercial'] },
  { query: 'chargé d’affaires', words: ['charge d affaires', 'chargee d affaires', 'ingenieur d affaires'] },
  { query: 'commercial', words: ['commercial', 'commerciale', 'technico commercial', 'negociateur'] },
  { query: 'conseiller de vente', words: ['conseiller de vente', 'conseillere de vente', 'vendeur', 'vendeuse', 'conseiller commercial'] },
  { query: 'manager de rayon', words: ['manager de rayon', 'chef de rayon', 'mco', 'management commercial operationnel'] },
  { query: 'chargé de clientèle', words: ['charge de clientele', 'chargee de clientele', 'conseiller clientele', 'relation client', 'service client'] },
  { query: 'conseiller bancaire', words: ['conseiller bancaire', 'conseillere bancaire', 'banque', 'charge de clientele bancaire'] },
  { query: 'assurance', words: ['assurance', 'conseiller en assurance', 'souscripteur', 'gestionnaire sinistre'] },
  { query: 'agent immobilier', words: ['immobilier', 'negociateur immobilier', 'gestionnaire locatif', 'agent immobilier'] },
  { query: 'chargé de recrutement', words: ['charge de recrutement', 'chargee de recrutement', 'talent acquisition', 'recruteur', 'recrutement'] },
  { query: 'gestionnaire de paie', words: ['gestionnaire de paie', 'paie', 'administration du personnel'] },
  { query: 'ressources humaines', words: ['ressources humaines', 'assistant rh', 'assistante rh', 'charge rh', 'chargee rh'] },
  { query: 'contrôleur de gestion', words: ['controle de gestion', 'controleur de gestion'] },
  { query: 'auditeur', words: ['audit', 'auditeur', 'auditrice'] },
  { query: 'comptable', words: ['comptable', 'comptabilite', 'dcg', 'dscg', 'expertise comptable'] },
  { query: 'analyste financier', words: ['analyste financier', 'finance d entreprise', 'analyse financiere', 'tresorerie'] },
  { query: 'juriste', words: ['juriste', 'droit des affaires', 'juridique', 'paralegal'] },
  { query: 'acheteur', words: ['acheteur', 'acheteuse', 'achats', 'approvisionneur', 'approvisionnement'] },
  { query: 'supply chain', words: ['supply chain', 'logisticien', 'logistique', 'gestion des flux'] },
  { query: 'transport', words: ['transport', 'exploitation transport', 'affreteur'] },
  { query: 'assistant de direction', words: ['assistant de direction', 'assistante de direction', 'office manager', 'assistant administratif', 'assistante administrative'] },
  { query: 'qualité', words: ['qualite', 'hse', 'qhse', 'controle qualite'] },
  { query: 'technicien de maintenance', words: ['maintenance', 'technicien de maintenance', 'maintenance industrielle', 'mspc'] },
  { query: 'électrotechnicien', words: ['electrotechni', 'electricien', 'electricite'] },
  { query: 'automaticien', words: ['automatisme', 'automaticien', 'robotique'] },
  { query: 'ingénieur mécanique', words: ['conception mecanique', 'ingenieur mecanique', 'bureau d etudes', 'solidworks', 'catia'] },
  { query: 'technicien de production', words: ['technicien de production', 'conducteur de ligne', 'operateur de production', 'production industrielle'] },
  { query: 'chimie', words: ['chimie', 'laboratoire', 'technicien de laboratoire', 'biologie'] },
  { query: 'conducteur de travaux', words: ['conducteur de travaux', 'chef de chantier', 'travaux publics', 'genie civil'] },
  { query: 'dessinateur projeteur', words: ['dessinateur', 'projeteur', 'autocad', 'revit', 'bim'] },
  { query: 'architecte', words: ['architecte', 'architecture d interieur'] },
  { query: 'plombier', words: ['plombier', 'plomberie', 'chauffagiste', 'cvc'] },
  { query: 'mécanicien automobile', words: ['mecanicien', 'mecanique automobile', 'carrossier'] },
  { query: 'cuisinier', words: ['cuisinier', 'cuisine', 'commis de cuisine'] },
  { query: 'boulanger', words: ['boulanger', 'boulangerie'] },
  { query: 'pâtissier', words: ['patissier', 'patisserie'] },
  { query: 'serveur', words: ['serveur', 'serveuse', 'service en salle', 'barman'] },
  { query: 'réceptionniste', words: ['receptionniste', 'hotellerie', 'front office'] },
  { query: 'coiffeur', words: ['coiffeur', 'coiffeuse', 'coiffure'] },
  { query: 'esthéticienne', words: ['estheticien', 'estheticienne', 'esthetique'] },
  { query: 'auxiliaire de puériculture', words: ['petite enfance', 'puericulture', 'educateur jeunes enfants'] },
  { query: 'aide-soignant', words: ['aide soignant', 'aide soignante', 'soins'] },
  { query: 'préparateur en pharmacie', words: ['preparateur en pharmacie', 'pharmacie'] },
];

const LEVEL_PATTERNS: [DiplomaLevel, RegExp][] = [
  [7, /\b(master|mba|msc|bac ?\+ ?5|ingenieur|cycle ingenieur|grande ecole|m1|m2|dscg)\b/],
  [6, /\b(licence|bachelor|but|bac ?\+ ?3|l3|dcg)\b/],
  [5, /\b(bts|dut|bac ?\+ ?2|deust)\b/],
  [4, /\b(bac pro|baccalaureat|bac|brevet professionnel|bp)\b/],
  [3, /\b(cap|bep)\b/],
];

/** Une ligne qui parle de la formation en cours ou à venir (celle de l'alternance). */
function isCurrent(line: string, year: number): boolean {
  if (/\b(en cours|actuellement|prepar|rentree|integre|integrer|a partir de|des septembre|en alternance|admis|admise)\b/.test(line)) return true;
  // « 2025-2027 », « 2026 - 2028 » : une formation qui se termine cette année ou plus tard.
  const years = [...line.matchAll(/\b(20\d{2})\b/g)].map((m) => Number(m[1]));
  return years.length > 0 && Math.max(...years) >= year;
}

/** Le diplôme préparé : celui d'une ligne « en cours » d'abord, sinon le plus haut cité. Avec son intitulé. */
function guessFormation(raw: string, now: Date): { level: DiplomaLevel | null; formation: string | null } {
  const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);
  let best: { level: DiplomaLevel; formation: string; current: boolean } | null = null;
  for (const line of lines) {
    const folded = normalizeText(line);
    for (const [level, pattern] of LEVEL_PATTERNS) {
      const m = folded.match(pattern);
      if (!m) continue;
      const current = isCurrent(folded, now.getFullYear());
      // L'intitulé : de « BTS » jusqu'à la virgule ou au tiret, sans les dates.
      const at = line.search(new RegExp(`\\b${m[1]!.replace(/ /g, '\\W*')}`, 'i'));
      const formation = line.slice(Math.max(0, at)).split(/[,|–—(]| - /)[0]!.replace(/\b20\d{2}\b/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
      const better = !best || (current && !best.current) || (current === best.current && level > best.level);
      if (better) best = { level, formation, current };
      break;
    }
  }
  return best ? { level: best.level, formation: best.formation || null } : { level: null, formation: null };
}

function guessAge(raw: string, now: Date): number | null {
  const stated = raw.match(/\b(1[5-9]|2\d|3[0-5])\s*ans\b/i);
  if (stated) return Number(stated[1]);
  const born = raw.match(/n[ée]e?\s+le\s+(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/i);
  if (born) {
    const birth = new Date(Number(born[3]), Number(born[2]) - 1, Number(born[1]));
    let age = now.getFullYear() - birth.getFullYear();
    if (now < new Date(now.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1;
    if (age >= 15 && age <= 35) return age;
  }
  return null;
}

/** Le premier code postal du CV, presque toujours celui de l'adresse en en-tête ; sinon une grande ville citée en haut. */
function guessPlace(raw: string): { department: string | null; city: string | null } {
  const match = raw.slice(0, 2500).match(/\b(\d{5})\s+([A-ZÀ-Ÿa-zà-ÿ' -]{2,40})/);
  if (match) {
    const city = match[2]!.trim().split(/\s{2,}|\n/)[0]!.replace(/\s+(France|FR)$/i, '').trim();
    return { department: departmentFromPostalCode(match[1]), city: city || null };
  }
  const head = ` ${normalizeText(raw.slice(0, 800))} `;
  const city = CITIES.find((c) => head.includes(` ${normalizeText(c.name)} `));
  return city ? { department: city.department, city: city.name } : { department: null, city: null };
}

const count = (text: string, word: string) => text.match(new RegExp(`(^| )${word.replace(/ /g, ' +')}(?= |$)`, 'g'))?.length ?? 0;

/**
 * Les postes, du plus probable au moins probable. L'en-tête et les phrases d'objectif (« recherche une
 * alternance de… ») pèsent quatre fois plus que le reste du CV : un job d'été ne fait pas un projet.
 */
function guessJobs(raw: string): string[] {
  const lines = raw.split(/\n/).map((l) => normalizeText(l)).filter(Boolean);
  // L'en-tête (titre du CV), sans les lignes qui racontent une expérience passée.
  const past = /\b(experience|experiences|stage|ete 20\d{2}|job|saisonnier|emploi etudiant)\b/;
  const head = lines
    .slice(0, 5)
    .filter((l) => !past.test(l))
    .join(' ');
  const goals = lines.filter((l) => /\b(alternance|apprentissage|alternant|alternante|contrat pro|recherche|objectif|poste vise|projet professionnel)\b/.test(l)).join(' ');
  const all = lines.join(' ');
  const scored = JOB_TITLES.map((t, index) => {
    const strong = t.words.reduce((n, w) => n + count(head, w) + count(goals, w), 0);
    const weak = t.words.reduce((n, w) => n + count(all, w), 0);
    return { query: t.query, score: strong * 4 + weak, index };
  }).filter((t) => t.score >= 2);
  // Dès qu'un poste est cité dans l'en-tête ou l'objectif, les postes cités seulement ailleurs (jobs d'été) sortent.
  const anyStrong = scored.some((t) => t.score >= 4);
  if (anyStrong) scored.splice(0, scored.length, ...scored.filter((t) => t.score >= 4));
  // À score égal, le poste le plus précis (placé plus haut dans la liste) l'emporte.
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map((t) => t.query).slice(0, 4);
}

/** Le grand domaine, quand aucun poste précis ne ressort. */
function guessDomain(text: string): string | null {
  let best: { query: string; score: number } | null = null;
  for (const d of DOMAINS) {
    const score = d.words.reduce((n, w) => n + (text.match(new RegExp(`\\b${w}`, 'g'))?.length ?? 0), 0);
    if (score > 0 && (!best || score > best.score)) best = { query: d.query, score };
  }
  return best && best.score >= 2 ? best.query : null;
}

/** Les compétences reconnues, dans l'ordre où le CV les cite. */
const SKILLS: [string, RegExp][] = [
  ['Excel', /\bexcel\b/],
  ['Pack Office', /\b(pack office|suite office|microsoft office|word|powerpoint)\b/],
  ['Canva', /\bcanva\b/],
  ['Figma', /\bfigma\b/],
  ['Photoshop', /\bphotoshop\b/],
  ['Illustrator', /\billustrator\b/],
  ['InDesign', /\bindesign\b/],
  ['Premiere Pro', /\bpremiere\b/],
  ['After Effects', /\bafter effects\b/],
  ['WordPress', /\bwordpress\b/],
  ['SEO', /\bseo\b/],
  ['Google Ads', /\bgoogle ads\b/],
  ['Google Analytics', /\b(google analytics|ga4)\b/],
  ['HubSpot', /\bhubspot\b/],
  ['Salesforce', /\bsalesforce\b/],
  ['CRM', /\bcrm\b/],
  ['SAP', /\bsap\b/],
  ['Sage', /\bsage\b/],
  ['Cegid', /\bcegid\b/],
  ['Python', /\bpython\b/],
  ['JavaScript', /\bjavascript\b/],
  ['TypeScript', /\btypescript\b/],
  ['React', /\breact\b/],
  ['Node.js', /\bnode( ?js)?\b/],
  ['Java', /\bjava\b/],
  ['PHP', /\bphp\b/],
  ['SQL', /\b(sql|mysql|postgresql)\b/],
  ['Power BI', /\bpower ?bi\b/],
  ['Tableau', /\btableau software\b/],
  ['Git', /\b(git|github|gitlab)\b/],
  ['Docker', /\bdocker\b/],
  ['Linux', /\blinux\b/],
  ['AutoCAD', /\bautocad\b/],
  ['SolidWorks', /\bsolidworks\b/],
  ['CATIA', /\bcatia\b/],
  ['Revit', /\brevit\b/],
  ['Anglais', /\banglais\b/],
  ['Espagnol', /\bespagnol\b/],
  ['Allemand', /\ballemand\b/],
  ['Permis B', /\bpermis b\b/],
  ['CACES', /\bcaces\b/],
  ['Habilitation électrique', /\bhabilitation electrique\b/],
  ['HACCP', /\bhaccp\b/],
];

function guessSkills(text: string): string[] {
  return SKILLS.map(([label, re]) => ({ label, at: text.search(re) }))
    .filter((s) => s.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((s) => s.label)
    .slice(0, 8);
}

export function guessFromCv(raw: string, now: Date = new Date()): CvGuess {
  const text = normalizeText(raw);
  const jobs = guessJobs(raw);
  const job = jobs[0] ?? guessDomain(text);
  const { level, formation } = guessFormation(raw, now);
  return {
    job,
    jobs: jobs.length ? jobs : job ? [job] : [],
    level,
    formation,
    skills: guessSkills(text),
    age: guessAge(raw, now),
    ...guessPlace(raw),
  };
}
