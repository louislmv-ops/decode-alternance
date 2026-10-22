// La compatibilité entre une offre et le profil : ce qui colle, ce qui te manque. Sans IA, sur trois
// critères vérifiables (domaine, département, niveau), pour ne jamais promettre plus que ce qu'on sait.

import { DOMAINS } from '@/lib/domains';
import type { DiplomaLevel } from '@/lib/rules/employer';
import { normalizeText } from './normalize';

const LEVEL_SHORT: Record<DiplomaLevel, string> = { 3: 'CAP', 4: 'Bac', 5: 'Bac+2', 6: 'Bac+3', 7: 'Bac+5' };

export interface MatchProfile {
  job: string;
  department: string | null;
  level: DiplomaLevel;
  filled: boolean;
}

export interface MatchOffer {
  title: string;
  department: string | null;
  diplomaLevel: DiplomaLevel | null;
}

export interface Match {
  fits: string[];
  misses: string[];
}

/** Les mots qui disent « ton domaine » : ceux que tu as tapés, et ceux du domaine reconnu. */
function jobWords(job: string): string[] {
  const typed = normalizeText(job).split(' ').filter((w) => w.length >= 3);
  const domain = DOMAINS.find((d) => normalizeText(d.query) === normalizeText(job) || normalizeText(d.label) === normalizeText(job));
  return [...new Set([...typed, ...(domain?.words ?? [])])];
}

export function matchOffer(offer: MatchOffer, profile: MatchProfile): Match | null {
  if (!profile.filled) return null;
  const fits: string[] = [];
  const misses: string[] = [];

  if (profile.job.trim()) {
    // Un mot compte s'il commence un mot du titre : « sea » ne doit pas trouver « réseaux ».
    const title = ` ${normalizeText(offer.title)}`;
    if (jobWords(profile.job).some((w) => title.includes(` ${w}`))) fits.push('Ton domaine');
    else misses.push('Pas ton domaine');
  }
  if (profile.department && offer.department) {
    if (offer.department === profile.department) fits.push('Dans ton département');
    else misses.push('Hors de ton département');
  }
  if (offer.diplomaLevel !== null) {
    if (offer.diplomaLevel <= profile.level) fits.push('Ton niveau');
    else misses.push(`Demande ${LEVEL_SHORT[offer.diplomaLevel]}, tu vises ${LEVEL_SHORT[profile.level]}`);
  }
  return fits.length + misses.length > 0 ? { fits, misses } : null;
}
