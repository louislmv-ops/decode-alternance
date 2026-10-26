import { describe, expect, it } from 'vitest';
import { DEMO_OFFERS } from '@/lib/offers/demo';
import { buildAlert, pickForProfile, profileSearch, searchUrl } from './alerts';

describe('alertes', () => {
  it('construit le lien de la recherche suivie', () => {
    expect(searchUrl('https://decode.fr', { q: 'marketing', dep: '75', niveau: 6 })).toBe('https://decode.fr/offres?q=marketing&dep=75&niveau=6');
  });

  it('résume les nouvelles offres pour l’e-mail et le SMS', () => {
    const alert = buildAlert(DEMO_OFFERS.slice(0, 2), { q: 'marketing', dep: '75' }, 'https://decode.fr');
    expect(alert.subject).toBe('2 nouvelles offres : marketing, Paris');
    expect(alert.text).toContain('https://decode.fr/compte');
    expect(alert.sms.length).toBeLessThanOrEqual(160);
  });

  it('tire la recherche du profil', () => {
    expect(profileSearch({ job: 'marketing', department: '69', level: 6, filled: true })).toEqual({ q: 'marketing', dep: '69', niveau: 6 });
    expect(profileSearch(null)).toEqual({});
  });

  it('ne garde que les offres qui ressemblent au compte', () => {
    const offers = DEMO_OFFERS.map((o, i) => ({ ...o, id: `o${i}` }));
    const target = offers[0]!;
    const picked = pickForProfile(offers, { likes: [], passes: [], decoded: [] }, { job: target.title, filled: true });
    expect(picked.map((o) => o.id)).toContain(target.id);
    expect(pickForProfile(offers, null, null)).toEqual([]);
  });
});
