import { describe, expect, it } from 'vitest';
import { readConsent } from './consent';

describe('consentement', () => {
  it('ne lit que « oui » ou « non », sinon rien : pas de choix, pas de mesure', () => {
    expect(readConsent('')).toBeNull();
    expect(readConsent('decode_profil=x; decode_mesure=oui')).toBe('oui');
    expect(readConsent('decode_mesure=non')).toBe('non');
    expect(readConsent('decode_mesure=peut-etre')).toBeNull();
    expect(readConsent('autre_decode_mesure=oui')).toBeNull();
  });
});
