// La catégorie d'une offre, pour le swipe : le secteur ROME quand la source le donne,
// sinon le grand domaine reconnu dans l'intitulé (lib/domains.ts).

import { DOMAINS } from '@/lib/domains';
import type { Category } from '@/lib/swipe';
import { normalizeText } from './normalize';
import { SECTORS, sectorOf } from './sectors';
import type { Offer } from './types';

export function categoryOf(o: Pick<Offer, 'title'> & Partial<Pick<Offer, 'romeCode'>>): Category | null {
  const sector = sectorOf(o.romeCode);
  if (sector) return { key: `s:${sector}`, label: SECTORS.find((s) => s.code === sector)!.label };
  const title = ` ${normalizeText(o.title)} `;
  const domain = DOMAINS.find((d) => d.words.some((w) => title.includes(` ${w}`)));
  return domain ? { key: `d:${normalizeText(domain.label)}`, label: domain.label } : null;
}
