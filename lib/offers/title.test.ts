import { describe, expect, it } from 'vitest';
import { cleanTitle } from './title';

describe('cleanTitle', () => {
  it('retire le genre et la mention alternance, déjà connue', () => {
    expect(cleanTitle('Alternance - Chargé(e) d’études marketing H/F')).toBe('Chargé(e) d’études marketing');
    expect(cleanTitle('Développeur(se) web full-stack en alternance (F/H)')).toBe('Développeur(se) web full-stack');
    expect(cleanTitle('Chargé(e) de communication digitale - Alternance')).toBe('Chargé(e) de communication digitale');
    expect(cleanTitle('Apprenti(e) boulanger H/F')).toBe('Apprenti(e) boulanger');
  });

  it('garde un titre qui ne serait plus rien sans ces mots', () => {
    expect(cleanTitle('Alternance H/F')).toBe('Alternance H/F');
  });
});
