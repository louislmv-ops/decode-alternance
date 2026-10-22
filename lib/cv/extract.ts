// Lecture d'un CV sans IA : quelques indices fiables (code postal, âge, diplôme visé, domaine).
// Ce qui n'est pas sûr reste vide : la personne confirme ou corrige dans le questionnaire.

import { DOMAINS } from '@/lib/domains';
import { departmentFromPostalCode, normalizeText } from '@/lib/offers/normalize';
import type { DiplomaLevel } from '@/lib/rules/employer';

export interface CvGuess {
  job: string | null;
  department: string | null;
  city: string | null;
  level: DiplomaLevel | null;
  age: number | null;
}

const LEVEL_PATTERNS: [DiplomaLevel, RegExp][] = [
  [7, /\b(master|mba|msc|bac ?\+ ?5|ingenieur|grande ecole|m1|m2)\b/],
  [6, /\b(licence|bachelor|but|bac ?\+ ?3|l3)\b/],
  [5, /\b(bts|dut|bac ?\+ ?2|deust)\b/],
  [4, /\b(bac pro|baccalaureat|bac|brevet professionnel)\b/],
  [3, /\b(cap|bep)\b/],
];

/** Le diplôme le plus haut cité est en général celui que la personne prépare en alternance. */
function guessLevel(text: string): DiplomaLevel | null {
  for (const [level, pattern] of LEVEL_PATTERNS) if (pattern.test(text)) return level;
  return null;
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

/** Le premier code postal du CV, presque toujours celui de l'adresse en en-tête. */
function guessPlace(raw: string): { department: string | null; city: string | null } {
  const match = raw.slice(0, 2500).match(/\b(\d{5})\s+([A-ZÀ-Ÿa-zà-ÿ' -]{2,40})/);
  if (!match) return { department: null, city: null };
  const city = match[2]!.trim().split(/\s{2,}|\n/)[0]!.replace(/\s+(France|FR)$/i, '').trim();
  return { department: departmentFromPostalCode(match[1]), city: city || null };
}

/** Le domaine : d'abord la phrase « alternance en … », sinon le domaine dont les mots reviennent le plus. */
function guessJob(text: string): string | null {
  const sought = text.match(/(?:alternance|apprentissage|contrat pro\w*)\s+(?:en|de|dans le|dans la|comme|d)\s+([a-z ]{3,40})/);
  if (sought) {
    const phrase = sought[1]!;
    const domain = DOMAINS.find((d) => d.words.some((w) => phrase.includes(w)));
    if (domain) return domain.query;
  }
  let best: { query: string; score: number } | null = null;
  for (const d of DOMAINS) {
    const score = d.words.reduce((n, w) => n + (text.match(new RegExp(`\\b${w}`, 'g'))?.length ?? 0), 0);
    if (score > 0 && (!best || score > best.score)) best = { query: d.query, score };
  }
  return best && best.score >= 2 ? best.query : null;
}

export function guessFromCv(raw: string, now: Date = new Date()): CvGuess {
  const text = normalizeText(raw);
  return { job: guessJob(text), level: guessLevel(text), age: guessAge(raw, now), ...guessPlace(raw) };
}
