import { describe, expect, it } from 'vitest';
import { maskPhone, normalizeFrenchMobile } from './phone';

describe('normalizeFrenchMobile', () => {
  it('accepte les écritures courantes', () => {
    expect(normalizeFrenchMobile('06 12 34 56 78')).toBe('+33612345678');
    expect(normalizeFrenchMobile('+33 7 12 34 56 78')).toBe('+33712345678');
    expect(normalizeFrenchMobile('0033612345678')).toBe('+33612345678');
  });

  it('refuse un fixe ou un numéro incomplet', () => {
    expect(normalizeFrenchMobile('01 23 45 67 89')).toBeNull();
    expect(normalizeFrenchMobile('06 12 34')).toBeNull();
  });

  it('masque le numéro', () => {
    expect(maskPhone('+33612345678')).toBe('06 •• •• •• 78');
  });
});
