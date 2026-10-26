// Le contenu d'une alerte : les nouvelles offres d'une recherche suivie, ou celles qui ressemblent au profil,
// aux likes et aux offres décodées du compte, en e-mail et en SMS courts.

import { DEPARTMENT_NAMES } from '@/lib/departments';
import { extractPerks } from '@/lib/offers/perks';
import type { Offer } from '@/lib/offers/types';
import { buildTaste, scoreOffer, tasteOf, titleWords, type TasteItem } from '@/lib/taste';
import type { SavedSearch } from './store';

/** Sans recherche suivie, on cherche avec le métier, le département et le niveau du profil. */
export function profileSearch(profile: unknown): SavedSearch {
  const p = profile && typeof profile === 'object' ? (profile as Record<string, unknown>) : {};
  const search: SavedSearch = {};
  if (typeof p.job === 'string' && p.job.trim()) search.q = p.job.trim().slice(0, 80);
  if (typeof p.department === 'string' && /^(\d{2,3}|2[AB])$/.test(p.department)) search.dep = p.department;
  if (p.filled === true && typeof p.level === 'number' && p.level >= 3 && p.level <= 7) search.niveau = p.level;
  return search;
}

const items = (v: unknown): TasteItem[] => (Array.isArray(v) ? v.filter((x): x is TasteItem => Boolean(x) && typeof x.id === 'string' && typeof x.title === 'string').map((x) => ({ ...x, perks: Array.isArray(x.perks) ? x.perks : [] })) : []);

/**
 * Les nouvelles offres qui ressemblent à la personne : les mots de son métier dans le titre,
 * puis ses likes et ses offres décodées. Sans aucun signal, on garde l'ordre de la recherche.
 */
export function pickForProfile(offers: Offer[], likesBlob: unknown, profile: unknown, limit = 8): Offer[] {
  const blob = likesBlob && typeof likesBlob === 'object' ? (likesBlob as Record<string, unknown>) : {};
  const taste = buildTaste(items(blob.likes), items(blob.passes), items(blob.decoded));
  const job = titleWords(profileSearch(profile).q ?? '');
  const seen = new Set([...taste.likes, ...taste.decoded].map((t) => t.id));
  const signals = taste.likes.length + taste.decoded.length > 0 || job.length > 0;
  // Sans métier ni like, seul un département donne une recherche assez précise pour écrire.
  if (!signals) return profileSearch(profile).dep ? offers.slice(0, limit) : [];
  return offers
    .filter((o) => !seen.has(o.id))
    .map((o) => {
      const words = titleWords(o.title);
      const jobHit = job.some((w) => words.includes(w)) ? 2 : 0;
      return { o, score: scoreOffer(tasteOf(o, '', extractPerks(o.description)), taste).score + jobHit };
    })
    .filter((x) => x.score >= 1.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.o);
}

export function searchUrl(siteUrl: string, search: SavedSearch): string {
  const params = new URLSearchParams();
  if (search.q) params.set('q', search.q);
  if (search.dep) params.set('dep', search.dep);
  if (search.niveau) params.set('niveau', String(search.niveau));
  return `${siteUrl}/offres${params.size ? `?${params}` : ''}`;
}

export function searchLabel(search: SavedSearch): string {
  return [search.q, search.dep ? DEPARTMENT_NAMES[search.dep] : null].filter(Boolean).join(', ') || 'pour toi';
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
