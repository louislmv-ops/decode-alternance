// Le profil du candidat : ce qu'il faut pour calculer son salaire minimum, vérifier son rythme et son chrono.
// Il reste sur l'appareil (localStorage) ; une copie réduite part dans un cookie pour que les pages
// serveur puissent surligner les offres bien payées pour lui. Aucun compte, aucune base.

import type { DiplomaLevel } from '@/lib/rules/employer';
import type { ContractKind } from '@/lib/rules/salary';

export type Rhythm = '3-2' | '2-3' | '4-1' | '1-3-sem' | '2-2-sem' | '2-1-sem' | '1-1-mois' | 'autre';

export const RHYTHMS: { value: Rhythm; label: string; companyShare: number }[] = [
  { value: '3-2', label: '3 jours entreprise, 2 jours école', companyShare: 0.6 },
  { value: '2-3', label: '2 jours entreprise, 3 jours école', companyShare: 0.4 },
  { value: '4-1', label: '4 jours entreprise, 1 jour école', companyShare: 0.8 },
  { value: '1-3-sem', label: '1 semaine école, 3 semaines entreprise', companyShare: 0.75 },
  { value: '2-2-sem', label: '2 semaines école, 2 semaines entreprise', companyShare: 0.5 },
  { value: '2-1-sem', label: '2 semaines entreprise, 1 semaine école', companyShare: 0.67 },
  { value: '1-1-mois', label: '1 mois école, 1 mois entreprise', companyShare: 0.5 },
  { value: 'autre', label: 'Autre rythme', companyShare: 0.5 },
];

export interface Profile {
  firstName: string;
  age: number;
  contract: ContractKind;
  year: 1 | 2 | 3;
  hasBacPro: boolean;
  level: DiplomaLevel;
  school: string;
  schoolCity: string;
  rhythm: Rhythm | null;
  /** Date de début de la formation au CFA, pour le chrono des 3 mois. */
  cfaStart: string | null;
  /** Le métier ou le domaine cherché, tel que tapé ou lu dans le CV. */
  job: string;
  /** Le département où chercher, ou null pour toute la France. */
  department: string | null;
  /** Le profil a-t-il été rempli par la personne, ou est-ce la valeur par défaut ? */
  filled: boolean;
}

export const DEFAULT_PROFILE: Profile = {
  firstName: '',
  age: 21,
  contract: 'apprentissage',
  year: 1,
  hasBacPro: false,
  level: 6,
  school: '',
  schoolCity: '',
  rhythm: null,
  cfaStart: null,
  job: '',
  department: null,
  filled: false,
};

export const PROFILE_KEY = 'decode.profil';
export const PROFILE_COOKIE = 'decode_profil';

/** La partie du profil qui sert au serveur : âge, contrat, année, bac pro. */
export interface PayProfile {
  age: number;
  contract: ContractKind;
  year: 1 | 2 | 3;
  hasBacPro: boolean;
  filled: boolean;
}

export function encodePayCookie(p: Profile): string {
  return [p.age, p.contract === 'apprentissage' ? 'a' : 'p', p.year, p.hasBacPro ? 1 : 0, p.filled ? 1 : 0].join('.');
}

export function decodePayCookie(value: string | undefined): PayProfile {
  const fallback: PayProfile = { age: DEFAULT_PROFILE.age, contract: 'apprentissage', year: 1, hasBacPro: false, filled: false };
  if (!value) return fallback;
  const [age, contract, year, bac, filled] = value.split('.');
  const a = Number(age);
  const y = Number(year);
  if (!Number.isInteger(a) || a < 15 || a > 99 || ![1, 2, 3].includes(y)) return fallback;
  return {
    age: a,
    contract: contract === 'p' ? 'professionnalisation' : 'apprentissage',
    year: y as 1 | 2 | 3,
    hasBacPro: bac === '1',
    filled: filled === '1',
  };
}

export function sanitizeProfile(raw: unknown): Profile {
  if (!raw || typeof raw !== 'object') return DEFAULT_PROFILE;
  const r = raw as Partial<Profile>;
  const level = Number(r.level);
  const year = Number(r.year);
  return {
    firstName: typeof r.firstName === 'string' ? r.firstName.slice(0, 40) : '',
    age: Number.isInteger(r.age) && (r.age as number) >= 15 && (r.age as number) <= 99 ? (r.age as number) : DEFAULT_PROFILE.age,
    contract: r.contract === 'professionnalisation' ? 'professionnalisation' : 'apprentissage',
    year: year === 2 || year === 3 ? year : 1,
    hasBacPro: Boolean(r.hasBacPro),
    level: level >= 3 && level <= 7 ? (level as DiplomaLevel) : DEFAULT_PROFILE.level,
    school: typeof r.school === 'string' ? r.school.slice(0, 80) : '',
    schoolCity: typeof r.schoolCity === 'string' ? r.schoolCity.slice(0, 60) : '',
    rhythm: RHYTHMS.some((x) => x.value === r.rhythm) ? (r.rhythm as Rhythm) : null,
    cfaStart: typeof r.cfaStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.cfaStart) ? r.cfaStart : null,
    job: typeof r.job === 'string' ? r.job.slice(0, 80) : '',
    department: typeof r.department === 'string' && /^(\d{2,3}|2[AB])$/.test(r.department) ? r.department : null,
    filled: Boolean(r.filled),
  };
}

/** Jours restants avant la fin des 3 mois pour trouver un employeur (article L6222-12-1). */
export function daysLeftWithoutEmployer(cfaStart: string, now: Date = new Date()): number {
  const start = new Date(`${cfaStart}T00:00:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 3);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}
