import { describe, expect, it } from 'vitest';
import { isValidSiret } from './siret';

describe('isValidSiret', () => {
  it('accepte un SIRET valide, avec ou sans espaces', () => {
    expect(isValidSiret('73282932000074')).toBe(true);
    expect(isValidSiret('732 829 320 00074')).toBe(true);
  });

  it('refuse une clé fausse ou un format incomplet', () => {
    expect(isValidSiret('73282932000075')).toBe(false);
    expect(isValidSiret('1234')).toBe(false);
  });
});
