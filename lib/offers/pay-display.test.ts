import { describe, expect, it } from 'vitest';
import { payDisplay } from './pay-display';
import { payEstimate } from './pay-estimate';

const MIN = 100_000;

describe('payDisplay', () => {
  it('montre un verdict sûr quand le salaire est dans l’annonce', () => {
    const d = payDisplay(payEstimate(140_000, MIN, null), MIN);
    expect(d).toMatchObject({ kind: 'annonce', tier: 3, word: 'Bien payé' });
  });

  it('reste prudent, sans chiffre, quand le salaire est estimé', () => {
    const d = payDisplay(payEstimate(null, MIN, { siren: '1', count: 4, medianPercent: 15, lowPercent: 5, highPercent: 25 }), MIN);
    expect(d).toMatchObject({ kind: 'estime', tier: 2, word: 'Plutôt correct' });
    expect(d.word + d.hint).not.toMatch(/\d\s?€|\d{3,}/);
  });

  it('ne dit rien de la paie quand on ne sait pas', () => {
    const d = payDisplay(payEstimate(null, MIN, null), MIN);
    expect(d).toMatchObject({ kind: 'inconnu', tier: null, word: 'Non précisé' });
  });

  it('ne prend jamais une grille légale pour un salaire', () => {
    const d = payDisplay(payEstimate(null, MIN, { siren: '1', count: 4, medianPercent: 40, lowPercent: 30, highPercent: 50 }, true), MIN);
    expect(d.kind).toBe('inconnu');
  });
});
