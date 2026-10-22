// Le contenu d'une alerte : les nouvelles offres d'une recherche suivie, en e-mail et en SMS courts.

import { DEPARTMENT_NAMES } from '@/lib/departments';
import type { Offer } from '@/lib/offers/types';
import type { SavedSearch } from './store';

export function searchUrl(siteUrl: string, search: SavedSearch): string {
  const params = new URLSearchParams();
  if (search.q) params.set('q', search.q);
  if (search.dep) params.set('dep', search.dep);
  if (search.niveau) params.set('niveau', String(search.niveau));
  return `${siteUrl}/offres${params.size ? `?${params}` : ''}`;
}

export function searchLabel(search: SavedSearch): string {
  return [search.q, search.dep ? DEPARTMENT_NAMES[search.dep] : null].filter(Boolean).join(', ') || 'tes critères';
}

export function buildAlert(offers: Offer[], search: SavedSearch, siteUrl: string): { subject: string; text: string; sms: string } {
  const n = offers.length;
  const label = searchLabel(search);
  const list = offers
    .slice(0, 5)
    .map((o) => `- ${o.title}${o.company ? ` · ${o.company}` : ''}${o.city ? ` · ${o.city}` : ''}\n  ${siteUrl}/offres/${encodeURIComponent(o.id)}`)
    .join('\n');
  const all = searchUrl(siteUrl, search);
  return {
    subject: `${n} nouvelle${n > 1 ? 's' : ''} offre${n > 1 ? 's' : ''} : ${label}`,
    text: `${list}\n\nToutes les offres : ${all}\n\nGérer tes alertes : ${siteUrl}/compte`,
    sms: `Decode : ${n} nouvelle${n > 1 ? 's' : ''} offre${n > 1 ? 's' : ''} (${label}). ${all}`,
  };
}
