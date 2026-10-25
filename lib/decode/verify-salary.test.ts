import { describe, expect, it } from 'vitest';
import { amountInText, keepOnlyWrittenSalary, numbersInText } from './verify-salary';
import type { DecodedOffer } from './schema';

describe('numbersInText', () => {
  it('lit les montants écrits de plusieurs façons', () => {
    expect(numbersInText('Salaire : 1 300 € brut, ou 1.450 €, voire 1300,50')).toEqual(expect.arrayContaining([1300, 1450, 1301]));
    expect(numbersInText('18 000 € par an')).toContain(18000);
    expect(numbersInText('1 200 €')).toContain(1200);
  });
});

describe('amountInText', () => {
  it('accepte un montant mensuel écrit', () => {
    expect(amountInText('Rémunération : 1 400 € brut mensuel', 1400)).toBe(true);
  });
  it('accepte un montant annuel ramené au mois', () => {
    expect(amountInText('Salaire : 18 000 € brut annuel', 1500)).toBe(true);
  });
  it('refuse un montant absent du texte', () => {
    expect(amountInText('Rémunération selon la grille légale', 1767)).toBe(false);
    expect(amountInText('Salaire : 1 400 €', 1867)).toBe(false);
  });
});

const decoded = (min: number | null, max: number | null) =>
  ({ salaire: { annonce: null, mensuelBrutEuros: min, maxBrutEuros: max, avantages: [] } }) as unknown as DecodedOffer;

describe('keepOnlyWrittenSalary', () => {
  it('garde un montant présent dans l’annonce', () => {
    expect(keepOnlyWrittenSalary(decoded(1400, 1800), 'Entre 1 400 et 1 800 € brut').salaire).toMatchObject({ mensuelBrutEuros: 1400, maxBrutEuros: 1800 });
  });
  it('retire un montant inventé et garde l’autre', () => {
    expect(keepOnlyWrittenSalary(decoded(1867, 1800), 'Jusqu’à 1 800 € brut').salaire).toMatchObject({ mensuelBrutEuros: null, maxBrutEuros: 1800 });
  });
});
