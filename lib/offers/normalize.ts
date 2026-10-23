import { SMIC } from '@/lib/rules/reference';
import { CFA_COMPANY_NAMES } from './cfa-list';
import type { DiplomaLevel } from '@/lib/rules/employer';
import type { CompanySizeTag, OfferContract } from './types';

export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Minuscules, sans accents, sans ponctuation, espaces simples. */
export function normalizeText(text: string): string {
  return stripAccents(text.toLowerCase())
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è', ecirc: 'ê',
  agrave: 'à', acirc: 'â', ccedil: 'ç', ocirc: 'ô', ucirc: 'û', icirc: 'î', iuml: 'ï', rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', hellip: '…', euro: '€', laquo: '«', raquo: '»', ndash: '–', mdash: '—', bull: '•',
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const n = code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** HTML d'annonce vers texte lisible, en gardant les retours à la ligne des paragraphes et des listes. */
export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, ' ')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n• ')
    .replace(/<\s*\/\s*(p|div|ul|ol|h[1-6]|tr)\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(withBreaks)
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n+(?=• )/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const ALTERNANCE_PATTERN =
  /\b(alternance|alternant|alternante|apprenti|apprentie|apprentissage|contrat de professionnalisation|contrat pro|work[- ]?study|apprenticeship|apprentice)\b/;

/** L'annonce parle-t-elle bien d'alternance (et pas seulement d'un stage ou d'un CDI) ? */
export function isAlternance(title: string, description = '', employmentType = ''): boolean {
  const head = normalizeText(`${title} ${employmentType}`);
  if (ALTERNANCE_PATTERN.test(head)) return true;
  return ALTERNANCE_PATTERN.test(normalizeText(description.slice(0, 1500)));
}

export function detectContract(text: string): OfferContract {
  const t = normalizeText(text);
  if (/contrat de professionnalisation|contrat pro\b/.test(t)) return 'professionnalisation';
  if (/apprentissage|apprenti\b|apprentie\b|apprenticeship/.test(t)) return 'apprentissage';
  return 'alternance';
}

const LEVEL_PATTERNS: [DiplomaLevel, RegExp][] = [
  [3, /\b(cap|bep|titre professionnel de niveau 3)\b/],
  [4, /\b(bac pro|baccalaureat|brevet professionnel|bac)\b(?! ?\d)/],
  [5, /\b(bts|dut|but 2|bac ?2|bac 2|niveau 5|deust)\b/],
  [6, /\b(licence|bachelor|but 3|bac ?3|bac 3|niveau 6)\b/],
  [7, /\b(master|mastere|msc|mba|ingenieur|bac ?5|bac 5|niveau 7|m1|m2)\b/],
];

/** Niveau de diplôme le plus bas mentionné, c'est-à-dire celui à partir duquel on peut postuler. */
export function detectDiplomaLevel(text: string): DiplomaLevel | null {
  const t = normalizeText(text).replace(/bac\s*\+\s*/g, 'bac ');
  for (const [level, pattern] of LEVEL_PATTERNS) {
    if (pattern.test(t)) return level;
  }
  return null;
}

const HOURS_PER_MONTH = 151.67;

/**
 * Montant mensuel brut en centimes à partir d'un libellé de salaire d'annonce.
 * Une fourchette donne sa borne basse : c'est ce qui est réellement promis.
 */
export function parseSalary(text: string | null | undefined): number | null {
  if (!text) return null;
  const t = stripAccents(text.toLowerCase()).replace(/ | /g, ' ');

  const smic = t.match(/(\d{2,3})\s*%\s*(du\s+)?smic/);
  if (smic?.[1]) return Math.round((SMIC.monthlyCents * Number(smic[1])) / 100);

  const amount = t.match(/(\d{1,3}(?:[ .]\d{3})+|\d+)(?:[.,](\d{1,2}))?\s*(k)?\s*(?:€|eur|euros)/);
  if (!amount?.[1]) return null;
  let value = Number(amount[1].replace(/[ .]/g, '')) + (amount[2] ? Number(`0.${amount[2]}`) : 0);
  if (amount[3]) value *= 1000;

  const after = t.slice(amount.index ?? 0);
  if (/(heure|horaire|\/\s*h\b)/.test(after.slice(0, 40)) || value < 40) value *= HOURS_PER_MONTH;
  else if (/(an\b|annuel|par an|\/\s*an|brut annuel|k)/.test(after.slice(0, 40)) || value > 8000) value /= 12;

  const cents = Math.round(value * 100);
  // Un montant mensuel hors de cette plage est presque toujours une erreur de lecture.
  return cents >= 30_000 && cents <= 800_000 ? cents : null;
}

/** Département à partir d'un code postal (Corse et outre-mer compris). */
export function departmentFromPostalCode(postalCode: string | null | undefined): string | null {
  if (!postalCode) return null;
  const cp = postalCode.replace(/\s/g, '');
  if (!/^\d{5}$/.test(cp)) return null;
  if (cp.startsWith('97') || cp.startsWith('98')) return cp.slice(0, 3);
  if (cp.startsWith('20')) return Number(cp) < 20200 ? '2A' : '2B';
  return cp.slice(0, 2);
}

/** Tranche d'effectif France Travail (« 50 à 99 salariés ») vers une taille d'entreprise. */
export function sizeFromHeadcount(label: string | null | undefined): CompanySizeTag | null {
  if (!label) return null;
  const numbers = (label.replace(/\s/g, '').match(/\d+/g) ?? []).map(Number);
  const low = numbers[0];
  if (low === undefined) return null;
  if (low < 10) return 'tpe';
  if (low < 250) return 'pme';
  if (low < 5000) return 'eti';
  return 'grande';
}

const TITLE_NOISE =
  /\b(h ?f|f ?h|m ?f|f ?m|h ?f ?x|alternance|alternant|alternante|apprenti|apprentie|apprentissage|contrat de professionnalisation|contrat pro|en|un|une|d|de|du|des|l|le|la|les|stage|cdd|cdi)\b/g;

const COMPANY_NOISE = /\b(sas|sa|sasu|sarl|eurl|scop|groupe|group|france|sa|se)\b/g;

/** Clé qui rapproche la même offre publiée sur plusieurs sites. */
export function fingerprint(company: string | null, title: string, city: string | null): string {
  const c = normalizeText(company ?? '').replace(COMPANY_NOISE, ' ').replace(/\s+/g, ' ').trim();
  // Les lettres isolées viennent de l'écriture inclusive : « chargé(e) » devient « charge e ».
  const t = normalizeText(title).replace(TITLE_NOISE, ' ').replace(/\b[a-z]\b/g, ' ').replace(/\s+/g, ' ').trim();
  const v = normalizeText(city ?? '').replace(/\b(\d+e|cedex|arrondissement)\b/g, ' ').replace(/\s+/g, ' ').trim();
  return `${c}|${t}|${v}`;
}

const SCHOOL_NAME = /\b(ecole|school|business school|institut|cfa|campus|academy|academie|formation|formations|iscod|studi|openclassrooms)\b/;

const SCHOOL_PHRASES: [RegExp, string][] = [
  [/frais de (scolarite|formation|dossier|inscription)/, 'L’annonce parle de frais de scolarité ou d’inscription.'],
  [/(inscri(ption|re|s toi|vez vous) (a|dans|en) (notre|la) (formation|ecole|cursus|programme))/, 'Elle te demande de t’inscrire à une formation.'],
  [/(notre|nos) (ecole|formations?|cursus|programmes?) (en alternance|diplomante)/, 'Elle met en avant sa propre formation.'],
  [/pour (le compte de )?(nos|ses) entreprises partenaires/, 'Le poste est « chez une entreprise partenaire » non nommée.'],
  [/(admission|test d admission|entretien d admission|dossier de candidature a l ecole)/, 'Elle parle d’admission, pas d’embauche.'],
  [/(rentree|session) (de|en) (septembre|octobre|janvier|fevrier|mars)/, 'Elle annonce une date de rentrée plutôt qu’une date d’embauche.'],
];

/**
 * Indices qu'une « offre » est en réalité une publicité d'école qui cherche des élèves.
 * Chaque indice est une phrase lisible, affichée telle quelle.
 */
let cfaNames: { set: Set<string>; list: string[] } | null = null;

/** L'annonceur figure-t-il dans la liste des écoles et CFA de La bonne alternance (nom exact ou contenu mot pour mot) ? */
export function isKnownSchool(company: string | null | undefined): boolean {
  if (!company) return false;
  cfaNames ??= (() => {
    const list = CFA_COMPANY_NAMES.map(normalizeText).filter((n) => n.length >= 3);
    return { set: new Set(list), list };
  })();
  const name = normalizeText(company);
  if (cfaNames.set.has(name)) return true;
  const padded = ` ${name} `;
  return cfaNames.list.some((n) => padded.includes(` ${n} `));
}

export function schoolBaitFlags(input: { company: string | null; title: string; description: string; naf?: string | null; legalName?: string | null }): string[] {
  const flags: string[] = [];
  const company = normalizeText(input.company ?? '');
  const text = normalizeText(`${input.title} ${input.description}`);
  // Code NAF 85 : enseignement. Une école qui « recrute » un alternant cherche presque toujours un élève.
  if ((company && SCHOOL_NAME.test(company)) || /^85/.test(input.naf ?? '') || isKnownSchool(input.company) || isKnownSchool(input.legalName))
    flags.push('L’annonceur est une école ou un organisme de formation.');
  for (const [pattern, message] of SCHOOL_PHRASES) {
    if (pattern.test(text)) flags.push(message);
  }
  return flags;
}
