import { describe, expect, it } from 'vitest';
import { paySignals } from './pay-signals';

describe('paySignals', () => {
  it('Paris, grand groupe, siège et métier qualifié : plutôt bien payé', () => {
    const l = paySignals({ department: '92', companySize: 'grande', title: 'Alternance data analyst', description: 'Poste basé au siège à La Défense' });
    expect(l?.tier).toBe(3);
    expect(l?.reasons).toEqual(['Île-de-France', 'grand groupe', 'poste au siège', 'métier recherché']);
  });

  it('un seul indice favorable : plutôt correct', () => {
    expect(paySignals({ department: '75', title: 'Assistant RH' })?.tier).toBe(2);
  });

  it('petite entreprise de restauration : plutôt au minimum', () => {
    const l = paySignals({ department: '35', companySize: 'tpe', romeCode: 'G1602', title: 'Apprenti cuisinier' });
    expect(l?.tier).toBe(1);
  });

  it('aucun indice : pas de tendance', () => {
    expect(paySignals({ department: '35', title: 'Assistant commercial' })).toBeNull();
  });
});
