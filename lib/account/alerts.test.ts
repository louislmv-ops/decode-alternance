import { describe, expect, it } from 'vitest';
import { DEMO_OFFERS } from '@/lib/offers/demo';
import { buildAlert, searchUrl } from './alerts';

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
});
